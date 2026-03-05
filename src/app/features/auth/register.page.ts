import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';

import { AuthStore } from './auth.store';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './register.page.html',
  styleUrl: './auth-pages.scss',
})
export class RegisterPage {
  readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(6)],
  });

  readonly inviteCodeControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor(public readonly authStore: AuthStore) {}

  async submit(): Promise<void> {
    this.emailControl.markAsTouched();
    this.passwordControl.markAsTouched();
    this.inviteCodeControl.markAsTouched();

    if (
      this.emailControl.invalid ||
      this.passwordControl.invalid ||
      this.inviteCodeControl.invalid
    ) {
      return;
    }

    await this.authStore.register(
      this.emailControl.value.trim(),
      this.passwordControl.value,
      this.inviteCodeControl.value.trim(),
    );
  }
}
