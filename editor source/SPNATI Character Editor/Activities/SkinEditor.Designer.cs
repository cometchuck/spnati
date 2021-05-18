﻿namespace SPNATI_Character_Editor.Activities
{
	partial class SkinEditor
	{
		/// <summary> 
		/// Required designer variable.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary> 
		/// Clean up any resources being used.
		/// </summary>
		/// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		protected override void Dispose(bool disposing)
		{
			if (disposing && (components != null))
			{
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Component Designer generated code

		/// <summary> 
		/// Required method for Designer support - do not modify 
		/// the contents of this method with the code editor.
		/// </summary>
		private void InitializeComponent()
		{
            this.label1 = new Desktop.Skinning.SkinnedLabel();
            this.txtName = new Desktop.Skinning.SkinnedTextBox();
            this.label2 = new Desktop.Skinning.SkinnedLabel();
            this.cboBaseStage = new Desktop.Skinning.SkinnedComboBox();
            this.label3 = new Desktop.Skinning.SkinnedLabel();
            this.gridLabels = new SPNATI_Character_Editor.Controls.StageSpecificGrid();
            this.label22 = new Desktop.Skinning.SkinnedLabel();
            this.cboDefaultPic = new Desktop.Skinning.SkinnedComboBox();
            this.lblStatus = new Desktop.Skinning.SkinnedLabel();
            this.cboStatus = new Desktop.Skinning.SkinnedComboBox();
            this.skinnedLabel1 = new Desktop.Skinning.SkinnedLabel();
            this.cboGender = new Desktop.Skinning.SkinnedComboBox();
            this.skinnedLabel2 = new Desktop.Skinning.SkinnedLabel();
            this.cboEvent = new Desktop.Skinning.SkinnedComboBox();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.label1.ForeColor = System.Drawing.SystemColors.ControlText;
            this.label1.Highlight = Desktop.Skinning.SkinnedHighlight.Normal;
            this.label1.Level = Desktop.Skinning.SkinnedLabelLevel.Normal;
            this.label1.Location = new System.Drawing.Point(8, 7);
            this.label1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(49, 17);
            this.label1.TabIndex = 0;
            this.label1.Text = "Name:";
            // 
            // txtName
            // 
            this.txtName.BackColor = System.Drawing.Color.White;
            this.txtName.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.txtName.ForeColor = System.Drawing.Color.Black;
            this.txtName.Location = new System.Drawing.Point(71, 4);
            this.txtName.Margin = new System.Windows.Forms.Padding(4);
            this.txtName.Name = "txtName";
            this.txtName.Size = new System.Drawing.Size(207, 23);
            this.txtName.TabIndex = 1;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.label2.ForeColor = System.Drawing.SystemColors.ControlText;
            this.label2.Highlight = Desktop.Skinning.SkinnedHighlight.Normal;
            this.label2.Level = Desktop.Skinning.SkinnedLabelLevel.Normal;
            this.label2.Location = new System.Drawing.Point(3, 107);
            this.label2.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(227, 17);
            this.label2.TabIndex = 3;
            this.label2.Text = "Use base images starting at stage:";
            // 
            // cboBaseStage
            // 
            this.cboBaseStage.AutoCompleteMode = System.Windows.Forms.AutoCompleteMode.None;
            this.cboBaseStage.AutoCompleteSource = System.Windows.Forms.AutoCompleteSource.None;
            this.cboBaseStage.BackColor = System.Drawing.Color.White;
            this.cboBaseStage.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cboBaseStage.FieldType = Desktop.Skinning.SkinnedFieldType.Surface;
            this.cboBaseStage.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.cboBaseStage.FormattingEnabled = true;
            this.cboBaseStage.KeyMember = null;
            this.cboBaseStage.Location = new System.Drawing.Point(236, 103);
            this.cboBaseStage.Margin = new System.Windows.Forms.Padding(4);
            this.cboBaseStage.Name = "cboBaseStage";
            this.cboBaseStage.SelectedIndex = -1;
            this.cboBaseStage.SelectedItem = null;
            this.cboBaseStage.Size = new System.Drawing.Size(172, 26);
            this.cboBaseStage.Sorted = false;
            this.cboBaseStage.TabIndex = 5;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.label3.ForeColor = System.Drawing.SystemColors.ControlText;
            this.label3.Highlight = Desktop.Skinning.SkinnedHighlight.Normal;
            this.label3.Level = Desktop.Skinning.SkinnedLabelLevel.Normal;
            this.label3.Location = new System.Drawing.Point(3, 147);
            this.label3.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(54, 17);
            this.label3.TabIndex = 6;
            this.label3.Text = "Labels:";
            // 
            // gridLabels
            // 
            this.gridLabels.Label = "Display Name";
            this.gridLabels.Location = new System.Drawing.Point(7, 167);
            this.gridLabels.Margin = new System.Windows.Forms.Padding(5);
            this.gridLabels.Name = "gridLabels";
            this.gridLabels.Size = new System.Drawing.Size(260, 186);
            this.gridLabels.TabIndex = 6;
            // 
            // label22
            // 
            this.label22.AutoSize = true;
            this.label22.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.label22.ForeColor = System.Drawing.SystemColors.ControlText;
            this.label22.Highlight = Desktop.Skinning.SkinnedHighlight.Normal;
            this.label22.Level = Desktop.Skinning.SkinnedLabelLevel.Normal;
            this.label22.Location = new System.Drawing.Point(8, 41);
            this.label22.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label22.Name = "label22";
            this.label22.Size = new System.Drawing.Size(48, 17);
            this.label22.TabIndex = 96;
            this.label22.Text = "Event:";
            // 
            // cboDefaultPic
            // 
            this.cboDefaultPic.AutoCompleteMode = System.Windows.Forms.AutoCompleteMode.None;
            this.cboDefaultPic.AutoCompleteSource = System.Windows.Forms.AutoCompleteSource.None;
            this.cboDefaultPic.BackColor = System.Drawing.Color.White;
            this.cboDefaultPic.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cboDefaultPic.FieldType = Desktop.Skinning.SkinnedFieldType.Surface;
            this.cboDefaultPic.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.cboDefaultPic.FormattingEnabled = true;
            this.cboDefaultPic.KeyMember = null;
            this.cboDefaultPic.Location = new System.Drawing.Point(363, 36);
            this.cboDefaultPic.Margin = new System.Windows.Forms.Padding(4);
            this.cboDefaultPic.Name = "cboDefaultPic";
            this.cboDefaultPic.SelectedIndex = -1;
            this.cboDefaultPic.SelectedItem = null;
            this.cboDefaultPic.Size = new System.Drawing.Size(208, 26);
            this.cboDefaultPic.Sorted = false;
            this.cboDefaultPic.TabIndex = 3;
            this.cboDefaultPic.SelectedIndexChanged += new System.EventHandler(this.cboDefaultPic_SelectedIndexChanged);
            // 
            // lblStatus
            // 
            this.lblStatus.AutoSize = true;
            this.lblStatus.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.lblStatus.ForeColor = System.Drawing.SystemColors.ControlText;
            this.lblStatus.Highlight = Desktop.Skinning.SkinnedHighlight.Normal;
            this.lblStatus.Level = Desktop.Skinning.SkinnedLabelLevel.Normal;
            this.lblStatus.Location = new System.Drawing.Point(299, 7);
            this.lblStatus.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblStatus.Name = "lblStatus";
            this.lblStatus.Size = new System.Drawing.Size(52, 17);
            this.lblStatus.TabIndex = 98;
            this.lblStatus.Text = "Status:";
            // 
            // cboStatus
            // 
            this.cboStatus.AutoCompleteMode = System.Windows.Forms.AutoCompleteMode.None;
            this.cboStatus.AutoCompleteSource = System.Windows.Forms.AutoCompleteSource.None;
            this.cboStatus.BackColor = System.Drawing.Color.White;
            this.cboStatus.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cboStatus.FieldType = Desktop.Skinning.SkinnedFieldType.Surface;
            this.cboStatus.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.cboStatus.FormattingEnabled = true;
            this.cboStatus.KeyMember = null;
            this.cboStatus.Location = new System.Drawing.Point(364, 2);
            this.cboStatus.Margin = new System.Windows.Forms.Padding(4);
            this.cboStatus.Name = "cboStatus";
            this.cboStatus.SelectedIndex = -1;
            this.cboStatus.SelectedItem = null;
            this.cboStatus.Size = new System.Drawing.Size(208, 26);
            this.cboStatus.Sorted = false;
            this.cboStatus.TabIndex = 2;
            // 
            // skinnedLabel1
            // 
            this.skinnedLabel1.AutoSize = true;
            this.skinnedLabel1.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.skinnedLabel1.ForeColor = System.Drawing.SystemColors.ControlText;
            this.skinnedLabel1.Highlight = Desktop.Skinning.SkinnedHighlight.Normal;
            this.skinnedLabel1.Level = Desktop.Skinning.SkinnedLabelLevel.Normal;
            this.skinnedLabel1.Location = new System.Drawing.Point(5, 72);
            this.skinnedLabel1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.skinnedLabel1.Name = "skinnedLabel1";
            this.skinnedLabel1.Size = new System.Drawing.Size(60, 17);
            this.skinnedLabel1.TabIndex = 99;
            this.skinnedLabel1.Text = "Gender:";
            // 
            // cboGender
            // 
            this.cboGender.AutoCompleteMode = System.Windows.Forms.AutoCompleteMode.None;
            this.cboGender.AutoCompleteSource = System.Windows.Forms.AutoCompleteSource.None;
            this.cboGender.BackColor = System.Drawing.Color.White;
            this.cboGender.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cboGender.FieldType = Desktop.Skinning.SkinnedFieldType.Surface;
            this.cboGender.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.cboGender.FormattingEnabled = true;
            this.cboGender.KeyMember = null;
            this.cboGender.Location = new System.Drawing.Point(70, 69);
            this.cboGender.Margin = new System.Windows.Forms.Padding(4);
            this.cboGender.Name = "cboGender";
            this.cboGender.SelectedIndex = -1;
            this.cboGender.SelectedItem = null;
            this.cboGender.Size = new System.Drawing.Size(208, 26);
            this.cboGender.Sorted = false;
            this.cboGender.TabIndex = 4;
            // 
            // skinnedLabel2
            // 
            this.skinnedLabel2.AutoSize = true;
            this.skinnedLabel2.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.skinnedLabel2.ForeColor = System.Drawing.SystemColors.ControlText;
            this.skinnedLabel2.Highlight = Desktop.Skinning.SkinnedHighlight.Normal;
            this.skinnedLabel2.Level = Desktop.Skinning.SkinnedLabelLevel.Normal;
            this.skinnedLabel2.Location = new System.Drawing.Point(297, 41);
            this.skinnedLabel2.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.skinnedLabel2.Name = "skinnedLabel2";
            this.skinnedLabel2.Size = new System.Drawing.Size(58, 17);
            this.skinnedLabel2.TabIndex = 101;
            this.skinnedLabel2.Text = "Portrait:";
            // 
            // cboEvent
            // 
            this.cboEvent.AutoCompleteMode = System.Windows.Forms.AutoCompleteMode.None;
            this.cboEvent.AutoCompleteSource = System.Windows.Forms.AutoCompleteSource.None;
            this.cboEvent.BackColor = System.Drawing.Color.White;
            this.cboEvent.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cboEvent.FieldType = Desktop.Skinning.SkinnedFieldType.Surface;
            this.cboEvent.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F);
            this.cboEvent.FormattingEnabled = true;
            this.cboEvent.KeyMember = null;
            this.cboEvent.Location = new System.Drawing.Point(70, 35);
            this.cboEvent.Margin = new System.Windows.Forms.Padding(4);
            this.cboEvent.Name = "cboEvent";
            this.cboEvent.SelectedIndex = -1;
            this.cboEvent.SelectedItem = null;
            this.cboEvent.Size = new System.Drawing.Size(208, 26);
            this.cboEvent.Sorted = false;
            this.cboEvent.TabIndex = 100;
            // 
            // SkinEditor
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.skinnedLabel2);
            this.Controls.Add(this.cboEvent);
            this.Controls.Add(this.cboGender);
            this.Controls.Add(this.skinnedLabel1);
            this.Controls.Add(this.lblStatus);
            this.Controls.Add(this.cboStatus);
            this.Controls.Add(this.label22);
            this.Controls.Add(this.cboDefaultPic);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.gridLabels);
            this.Controls.Add(this.cboBaseStage);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.txtName);
            this.Controls.Add(this.label1);
            this.Margin = new System.Windows.Forms.Padding(4);
            this.Name = "SkinEditor";
            this.Size = new System.Drawing.Size(749, 662);
            this.ResumeLayout(false);
            this.PerformLayout();

		}

		#endregion

		private Desktop.Skinning.SkinnedLabel label1;
		private Desktop.Skinning.SkinnedTextBox txtName;
		private Desktop.Skinning.SkinnedLabel label2;
		private Desktop.Skinning.SkinnedComboBox cboBaseStage;
		private Controls.StageSpecificGrid gridLabels;
		private Desktop.Skinning.SkinnedLabel label3;
		private Desktop.Skinning.SkinnedLabel label22;
		private Desktop.Skinning.SkinnedComboBox cboDefaultPic;
		private Desktop.Skinning.SkinnedLabel lblStatus;
		private Desktop.Skinning.SkinnedComboBox cboStatus;
		private Desktop.Skinning.SkinnedLabel skinnedLabel1;
		private Desktop.Skinning.SkinnedComboBox cboGender;
        private Desktop.Skinning.SkinnedLabel skinnedLabel2;
        private Desktop.Skinning.SkinnedComboBox cboEvent;
    }
}
