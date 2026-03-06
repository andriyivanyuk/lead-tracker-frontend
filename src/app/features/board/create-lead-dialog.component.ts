import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CreateLeadRequest } from '../../interfaces/lead.interface';
import { mapCreateLeadFormToPayload } from './create-lead.mapper';

@Component({
  selector: 'app-create-lead-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './create-lead-dialog.component.html',
  styleUrl: './create-lead-dialog.component.scss',
})
export class CreateLeadDialogComponent {
  readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly companyControl = new FormControl('', {
    nonNullable: true,
  });

  readonly contactControl = new FormControl('', {
    nonNullable: true,
  });

  readonly noteControl = new FormControl('', {
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
    this.nameControl.markAsTouched();
    this.amountControl.markAsTouched();

    if (this.nameControl.invalid || this.amountControl.invalid) {
      return;
    }

    const amountMinorValue = this.parseAmountMinor(this.amountControl.value);
    const payload: CreateLeadRequest = mapCreateLeadFormToPayload({
      name: this.nameControl.value,
      company: this.companyControl.value,
      contact: this.contactControl.value,
      notes: this.noteControl.value,
      phone: '',
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
