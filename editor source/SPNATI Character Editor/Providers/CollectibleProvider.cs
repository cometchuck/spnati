﻿using Desktop;
using SPNATI_Character_Editor.DataStructures;
using System.Collections.Generic;
using System.Windows.Forms;

namespace SPNATI_Character_Editor.Providers
{
	public class CollectibleProvider : IRecordProvider<Collectible>
	{
		private Character _character;

		public bool AllowsNew { get { return true; } }

		public void SetContext(object context)
		{
			_character = context as Character;
		}

		public IRecord Create(string key)
		{
			Collectible collectible = new Collectible();
			collectible.Key = key;
			collectible.Title = key;
			if (_character != null)
			{
				_character.Collectibles.Add(collectible);
			}
			return collectible;
		}

		public void Delete(IRecord record)
		{
			if (_character != null)
			{
				Collectible collectible = record as Collectible;
				_character.Collectibles.Remove(collectible);
			}
		}

		public ListViewItem FormatItem(IRecord record)
		{
			Collectible collectible = record as Collectible;
			return new ListViewItem(new string[] { collectible.Id, collectible.Name, collectible.Subtitle });
		}

		public string[] GetColumns()
		{
			return new string[] { "ID", "Title", "Subtitle" };
		}

		public string GetLookupCaption()
		{
			return "Select a Collectible";
		}
		public List<IRecord> GetRecords(string text)
		{
			text = text.ToLower();
			var list = new List<IRecord>();

			if (_character == null) { return list; }

			foreach (Collectible record in _character.Collectibles.Collectibles)
			{
				if (record.Key.ToLower().Contains(text) || record.Name.ToLower().Contains(text))
				{
					//partial match
					list.Add(record);
				}
			}
			return list;
		}

		public void Sort(List<IRecord> list)
		{
			list.Sort();
		}
	}
}
