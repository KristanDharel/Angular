import { Component } from '@angular/core';
import { RegistrationInterface } from '../interfaces/registration-interface';
import { first } from 'rxjs';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { RegistrationService } from '../service/registration-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration-component',
  imports: [ReactiveFormsModule, NgIf],

  templateUrl: './registration-component.html',
  styleUrl: './registration-component.css',
})
export class RegistrationComponent {
  registerForm = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [
      Validators.required,
      // Validators.pattern('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
      Validators.email,
    ]),
    phoneNumber: new FormControl('', Validators.required),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    confirmPassword: new FormControl('', Validators.required),
    role: new FormControl('user', Validators.required),
  });

  isLoading = false;
  registerError = '';
  successMessage = '';
  constructor(
    private registerService: RegistrationService,
    private router: Router
  ) {}

  // Getter methods for form controls
  get firstName() {
    return this.registerForm.get('firstName');
  }
  get lastName() {
    return this.registerForm.get('lastName');
  }
  get email() {
    return this.registerForm.get('email');
  }
  get phoneNumber() {
    return this.registerForm.get('phoneNumber');
  }
  get password() {
    return this.registerForm.get('password');
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
  get role() {
    return this.registerForm.get('role');
  }

  onSubmit() {
    this.registerError = '';
    this.successMessage = '';
    if (this.registerForm.valid) {
      this.isLoading = true;
      const formValue = this.registerForm.value;
      const registerData: RegistrationInterface = {
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        email: formValue.email!,
        phoneNumber: formValue.phoneNumber!,
        password: formValue.password!,
        conPassword: formValue.password!,
        role: formValue.role!,
      };
      this.registerService
        .register(registerData)
        .pipe(first())
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage =
              'Account created successfully! Please check your email to verify your account.';

            this.registerForm.reset();
            this.registerForm.patchValue({ role: 'user' });
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          },

          error: (error) => {
            this.isLoading = false;
            if (error.status === 409) {
              this.registerError =
                'An account with this email already exists. Please use a different email or try logging in.';
            } else if (error.status === 400) {
              this.registerError =
                'Please check your information and try again.';
            } else if (error.status === 500) {
              this.registerError = 'Server error. Please try again later.';
            } else if (error.error?.message) {
              this.registerError = error.error.message;
            } else {
              this.registerError = 'Registration failed. Please try again.';
            }

            console.error('Registration error:', error);
            console.log('this is registered data', registerData);
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }
  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}
