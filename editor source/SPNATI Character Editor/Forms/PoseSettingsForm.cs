﻿using KisekaeImporter;
using SPNATI_Character_Editor.Controls;
using System.Collections.Generic;
using System.Globalization;
using System.Windows.Forms;

namespace SPNATI_Character_Editor.Forms
{
	public partial class PoseSettingsForm : Form
	{
		private Dictionary<KisekaePart, PartTransparencySlider> _sliders = new Dictionary<KisekaePart, PartTransparencySlider>();

		public PoseSettingsForm()
		{
			InitializeComponent();

			PopulateHead();
			PopulateBody();
			PopulateClothing();
		}

		private void PopulateHead()
		{
			AddSlider(KisekaePart.Head, panelHead);
			AddSlider(KisekaePart.Face, panelHead);
			AddSlider(KisekaePart.LeftEye, panelHead);
			AddSlider(KisekaePart.RightEye, panelHead);
			AddSlider(KisekaePart.Nose, panelHead);
			AddSlider(KisekaePart.Mouth, panelHead);
			AddSlider(KisekaePart.LeftEar, panelHead);
			AddSlider(KisekaePart.RightEar, panelHead);
		}

		private void PopulateBody()
		{
			AddSlider(KisekaePart.UpperBody, panelBody);
			AddSlider(KisekaePart.LowerBody, panelBody);
			AddSlider(KisekaePart.LeftUpperArmShoulder, panelBody);
			AddSlider(KisekaePart.LeftLowerArmHand, panelBody);
			AddSlider(KisekaePart.RightUpperArmShoulder, panelBody);
			AddSlider(KisekaePart.RightLowerArmHand, panelBody);
			AddSlider(KisekaePart.LeftLeg, panelBody);
			AddSlider(KisekaePart.RightLeg, panelBody);
		}

		private void PopulateClothing()
		{
			AddSlider(KisekaePart.UpperJacket, panelClothing);
			AddSlider(KisekaePart.LowerJacket, panelClothing);
			AddSlider(KisekaePart.UpperVest, panelClothing);
			AddSlider(KisekaePart.LowerVest, panelClothing);
			AddSlider(KisekaePart.UpperShirt, panelClothing);
			AddSlider(KisekaePart.LowerShirt, panelClothing);
			AddSlider(KisekaePart.UpperUndershirt, panelClothing);
			AddSlider(KisekaePart.LowerUndershirt, panelClothing);
			AddSlider(KisekaePart.Skirt, panelClothing);
			AddSlider(KisekaePart.Necktie, panelClothing);
			AddSlider(KisekaePart.Bra, panelClothing);
			AddSlider(KisekaePart.Panties, panelClothing);
		}

		private void AddSlider(KisekaePart part, FlowLayoutPanel panel)
		{
			PartTransparencySlider slider = new PartTransparencySlider();
			slider.SetLabel(part);
			slider.Value = 100;
			_sliders[part] = slider;
			panel.Controls.Add(slider);
		}

		private void cmdOK_Click(object sender, System.EventArgs e)
		{
			DialogResult = DialogResult.OK;
			Close();
		}

		private void cmdCancel_Click(object sender, System.EventArgs e)
		{
			DialogResult = DialogResult.Cancel;
			Close();
		}

		public void SetData(Dictionary<string, string> data)
		{
			if (data == null) { return; }
			foreach (KeyValuePair<string, string> kvp in data)
			{
				string key = kvp.Key;
				string value = kvp.Value;

				KisekaePart kkPart = key.ToKisekaePart();
				PartTransparencySlider slider;
				int v;
				if (_sliders.TryGetValue(kkPart, out slider) && int.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out v))
				{
					slider.Value = v;
				}
			}
		}

		public Dictionary<string, string> GetData()
		{
			Dictionary<string, string> data = new Dictionary<string, string>();
			foreach (KeyValuePair<KisekaePart, PartTransparencySlider> kvp in _sliders)
			{
				if (kvp.Value.Value < 100)
				{
					string key = kvp.Key.Serialize();
					int v = kvp.Value.Value;
					data[key] = v.ToString(CultureInfo.InvariantCulture);
				}
			}
			return data;
		}
	}
}
