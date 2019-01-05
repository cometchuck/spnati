﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Reflection;
using System.Text;
using System.Xml;
using System.Xml.Serialization;

namespace SPNATI_Character_Editor.IO
{
	/// <summary>
	/// Basic XML serializer designed specifically for SPNATI files. Output can be deserialized back into C# objects using the .NET XmlSerializer
	/// </summary>
	public class SpnatiXmlSerializer
	{
		private static Dictionary<Type, ElementInformation> _serializationInfo = new Dictionary<Type, ElementInformation>();

		private const string IndentString = "    ";

		public void Serialize<T>(string filename, T data)
		{
			IHookSerialization hook = data as IHookSerialization;
			if (hook != null)
			{
				hook.OnBeforeSerialize();
			}

			XmlRootAttribute root = data.GetType().GetCustomAttribute<XmlRootAttribute>(true);
			if (root == null)
			{
				throw new ArgumentException(string.Format("The type {0} cannot be serialized because it is missing an XmlRoot attribute.", data.GetType()));
			}

			var sb = new StringBuilder();
			var settings = new XmlWriterSettings()
			{
				OmitXmlDeclaration = true,
				Indent = true,
				IndentChars = IndentString
			};
			XmlWriter writer = XmlWriter.Create(sb, settings);
			sb.AppendLine("<?xml version='1.0' encoding='UTF-8'?>");

			WriteElement(data, root.ElementName, writer, sb);

			writer.Flush();
			sb.AppendLine();
			string text = sb.ToString();
			text = text.Replace("\r\n>", ">\r\n");
			text = XMLHelper.Encode(text);

			File.WriteAllText(filename, text);
			writer.Dispose();
		}

		public static ElementInformation GetSerializationInformation(Type type)
		{
			ElementInformation elementInfo = _serializationInfo.Get(type);
			if (elementInfo == null)
			{
				elementInfo = new ElementInformation(type);
				_serializationInfo[type] = elementInfo;
			}
			return elementInfo;
		}

		private void WriteElement(object data, string name, XmlWriter writer, StringBuilder builder)
		{
			if (data == null)
				return;

			Type type = data.GetType();
			ElementInformation elementInfo = GetSerializationInformation(type);
			if (elementInfo.Header != null)
			{
				writer.Flush();
				builder.AppendLine();
				writer.WriteComment(ReplaceTokens(elementInfo.Header.Text));
			}

			List<Tuple<FieldInformation, string, string>> subElements = new List<Tuple<FieldInformation, string, string>>();

			bool foundSomething = false;
			writer.WriteStartElement(name);

			if (type == typeof(string) && string.IsNullOrEmpty(data.ToString()))
			{
				//Stop empty strings immediately
				writer.WriteEndElement();
				return;
			}

			string text = null;

			foreach (FieldInformation field in elementInfo.Fields)
			{
				DefaultValueAttribute defaultValueAttr = field.DefaultValue;
				if (defaultValueAttr != null)
				{
					object actualValue = field.GetValue(data);
					if (defaultValueAttr.Value == null)
					{
						if (actualValue == null)
							continue;
					}
					else if (defaultValueAttr.Value.Equals(actualValue))
					{
						continue;
					}
				}

				XmlElementAttribute element = field.Element;
				if (element != null)
				{
					//Save elements for later
					subElements.Add(new Tuple<FieldInformation, string, string>(field, element.ElementName, null));
					foundSomething = true;
					continue;
				}

				XmlArrayAttribute arrayAttr = field.Array;
				if (arrayAttr != null)
				{
					XmlArrayItemAttribute arrayItemAttr = field.ArrayItem;
					if (arrayItemAttr != null)
					{
						foundSomething = true;
						subElements.Add(new Tuple<FieldInformation, string, string>(field, arrayAttr.ElementName, arrayItemAttr.ElementName));
					}
					continue;
				}

				XmlTextAttribute textAttr = field.Text;
				if (textAttr != null)
				{
					text = field.GetValue(data)?.ToString();
					foundSomething = true;
					continue;
				}

				XmlAttributeAttribute attribute = field.Attribute;
				if (attribute != null)
				{
					string value = field.GetValue(data)?.ToString();
					foundSomething = true;
					if (value == null)
						continue;
					if (field.FieldType == typeof(bool))
					{
						value = value.ToLowerInvariant();
					}
					writer.WriteAttributeString(attribute.AttributeName, value);
					continue;
				}
			}

			// now do elements and arrays
			foreach (var tuple in subElements)
			{
				FieldInformation field = tuple.Item1;

				//Element
				XmlNewLineAttribute newLineAttr = field.NewLine;
				XmlNewLinePosition newLine = XmlNewLinePosition.None;
				if (newLineAttr != null)
				{
					newLine = newLineAttr.Position;
				}
				if (newLine == XmlNewLinePosition.Before || newLine == XmlNewLinePosition.Both)
				{
					writer.Flush();
					builder.AppendLine();
				}

				if (tuple.Item3 == null)
				{
					object subdata = field.GetValue(data);
					IList list = subdata as IList;
					if (list != null)
					{
						MethodInfo sortMethod = field.SortMethod;
						if (sortMethod != null)
						{
							List<object> sortedList = new List<object>();
							foreach (object obj in list)
							{
								sortedList.Add(obj);
							}
							sortedList.Sort((o1, o2) =>
							{
								return (int)sortMethod.Invoke(data, new object[] { o1, o2 });
							}
							);
							list = sortedList;
						}

						foreach (object item in list)
						{
							WriteElement(item, tuple.Item2, writer, builder);

							if (newLine == XmlNewLinePosition.After || newLine == XmlNewLinePosition.Both)
							{
								writer.Flush();
								builder.AppendLine();
							}
						}
					}
					else
					{
						WriteElement(subdata, tuple.Item2, writer, builder);
					}
				}
				else
				{
					//Array
					writer.WriteStartElement(tuple.Item2);
					IList array = field.GetValue(data) as IList;
					if (array != null)
					{
						foreach (var obj in array)
						{
							WriteElement(obj, tuple.Item3, writer, builder);
						}
					}

					if (newLine == XmlNewLinePosition.After || newLine == XmlNewLinePosition.Both)
					{
						writer.Flush();
						builder.AppendLine();
					}

					writer.WriteEndElement();
				}
			}

			foreach (var field in elementInfo.Fields)
			{
				XmlAnyElementAttribute any = field.AnyElement;
				if (any != null && field.GetValue(data) != null)
				{
					foreach (XmlElement el in field.GetValue(data) as List<XmlElement>)
					{
						el.WriteTo(writer);
					}
					foundSomething = true;
				}

			}

			if (!foundSomething)
			{
				text = data.ToString();
				if (data.GetType() == typeof(bool))
					text = text.ToLower();
			}
			if (text != null)
			{
				writer.WriteString(text);
			}

			writer.WriteEndElement();
		}

		private string ReplaceTokens(string line)
		{
			line = line.Replace("{Time}", DateTime.Now.ToString("h:mm:ss tt"));
			line = line.Replace("{Date}", DateTime.Now.ToString("MMMM dd, yyyy"));
			line = line.Replace("{Version}", Config.Version);
			return line;
		}
	}

	/// <summary>
	/// Cached attributes to limit the necessary amount of reflection during serialization
	/// </summary>
	public class ElementInformation
	{
		public XmlHeaderAttribute Header;

		public List<FieldInformation> Fields = new List<FieldInformation>();

		public ElementInformation(Type type)
		{
			Header = type.GetCustomAttribute<XmlHeaderAttribute>();

			FieldInfo[] fields = type.GetFields();
			foreach (FieldInfo field in fields)
			{
				if (field.GetCustomAttribute<XmlIgnoreAttribute>() != null)
					continue;

				FieldInformation info = new FieldInformation(type, field);
				Fields.Add(info);
			}
		}
	}

	public class FieldInformation
	{
		public FieldInfo Info;
		public Type FieldType;
		public DefaultValueAttribute DefaultValue;
		public XmlElementAttribute Element;
		public XmlArrayAttribute Array;
		public XmlArrayItemAttribute ArrayItem;
		public XmlTextAttribute Text;
		public XmlAttributeAttribute Attribute;
		public XmlNewLineAttribute NewLine;
		public MethodInfo SortMethod;
		public XmlAnyElementAttribute AnyElement;

		public FieldInformation(Type parentType, FieldInfo field)
		{
			Info = field;
			FieldType = Info.FieldType;
			DefaultValue = field.GetCustomAttribute<DefaultValueAttribute>();
			Element = field.GetCustomAttribute<XmlElementAttribute>();
			Array = field.GetCustomAttribute<XmlArrayAttribute>();
			ArrayItem = field.GetCustomAttribute<XmlArrayItemAttribute>();
			Text = field.GetCustomAttribute<XmlTextAttribute>();
			Attribute = field.GetCustomAttribute<XmlAttributeAttribute>();
			NewLine = field.GetCustomAttribute<XmlNewLineAttribute>();

			XmlSortMethodAttribute sortAttribute = field.GetCustomAttribute<XmlSortMethodAttribute>();
			if (sortAttribute != null)
			{
				SortMethod = parentType.GetMethod(sortAttribute.Method, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static);
			}

			AnyElement = field.GetCustomAttribute<XmlAnyElementAttribute>();

		}

		public object GetValue(object obj)
		{
			return Info.GetValue(obj);
		}
	}

	[AttributeUsage(AttributeTargets.Field)]
	public class XmlNewLineAttribute : Attribute
	{
		public XmlNewLinePosition Position { get; set; }

		public XmlNewLineAttribute(XmlNewLinePosition where)
		{
			Position = where;
		}

		public XmlNewLineAttribute()
		{
			Position = XmlNewLinePosition.Before;
		}
	}

	public enum XmlNewLinePosition
	{
		Before,
		After,
		Both,
		None
	}

	public class XmlHeaderAttribute : Attribute
	{
		public string Text { get; set; }

		public XmlHeaderAttribute(string text)
		{
			Text = text;
		}
	}

	public class XmlSortMethodAttribute : Attribute
	{
		public string Method { get; set; }

		public XmlSortMethodAttribute(string method)
		{
			Method = method;
		}
	}
}
