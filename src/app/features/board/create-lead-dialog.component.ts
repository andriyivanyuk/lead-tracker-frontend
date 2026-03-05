import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CreateLeadRequest } from '../../interfaces/lead.interface';

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

  constructor(
    private readonly dialogRef: MatDialogRef<CreateLeadDialogComponent>,
  ) {}

  submit(): void {
    this.nameControl.markAsTouched();
    if (this.nameControl.invalid) {
      return;
    }

    const companyValue = this.companyControl.value.trim();
    const contactValue = this.contactControl.value.trim();
    const noteValue = this.noteControl.value.trim();

    const payload: CreateLeadRequest = {
      title: companyValue.length > 0 ? companyValue : null,
      contact_name: this.nameControl.value.trim(),
      contact_handle: contactValue.length > 0 ? contactValue : null,
      phone: null,
      notes: noteValue.length > 0 ? noteValue : null,
      status: 'new',
      source: 'other',
      amount_minor: null,
      currency_code: 'UAH',
      reminder_at: null,
    };

    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
