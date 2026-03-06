import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CreateLeadRequest, LeadSource } from '../../interfaces/lead.interface';
import { mapCreateLeadFormToPayload } from './create-lead.mapper';

@Component({
  selector: 'app-create-lead-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './create-lead-dialog.component.html',
  styleUrl: './create-lead-dialog.component.scss',
})
export class CreateLeadDialogComponent {
  readonly sourceOptions: Array<{
    value: LeadSource;
    label: string;
    icon: string;
  }> = [
    { value: 'instagram', label: 'Instagram', icon: 'photo_camera' },
    { value: 'telegram', label: 'Telegram', icon: 'send' },
    { value: 'viber', label: 'Viber', icon: 'chat' },
    { value: 'facebook', label: 'Facebook', icon: 'thumb_up' },
    { value: 'other', label: 'Інше', icon: 'language' },
  ];

  readonly contactNameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly sourceControl = new FormControl<LeadSource>('other', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly contactHandleControl = new FormControl('', {
    nonNullable: true,
  });

  readonly phoneControl = new FormControl('', {
    nonNullable: true,
  });

  readonly titleControl = new FormControl('', {
    nonNullable: true,
  });

  readonly notesControl = new FormControl('', {
    nonNullable: true,
  });

  readonly amountControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.pattern(/^\d+([\.,]\d{1,2})?$/)],
  });

  constructor(
    private readonly dialogRef: MatDialogRef<CreateLeadDialogComponent>,
  ) {}

  submit(): void {
    this.contactNameControl.markAsTouched();
    this.sourceControl.markAsTouched();
    this.amountControl.markAsTouched();

    if (
      this.contactNameControl.invalid ||
      this.sourceControl.invalid ||
      this.amountControl.invalid
    ) {
      return;
    }

    const amountMinorValue = this.parseAmountMinor(this.amountControl.value);
    const payload: CreateLeadRequest = mapCreateLeadFormToPayload({
      title: this.titleControl.value,
      contact_name: this.contactNameControl.value,
      contact_handle: this.contactHandleControl.value,
      phone: this.phoneControl.value,
      notes: this.notesControl.value,
      status: 'new',
      source: this.sourceControl.value,
      amount_minor: amountMinorValue,
      currency_code: 'UAH',
      reminder_at: null,
    });

    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private parseAmountMinor(rawValue: string): number | null {
    const normalized = rawValue.trim().replace(',', '.');
    if (normalized.length === 0) {
      return null;
    }

    const amountMajor = Number(normalized);
    if (Number.isNaN(amountMajor)) {
      return null;
    }

    return Math.round(amountMajor * 100);
  }
}
