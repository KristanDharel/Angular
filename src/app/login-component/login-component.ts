import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoginService } from '../service/login-service';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { LoginInterface } from '../interfaces/login-interface';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login-component',
  imports: [ReactiveFormsModule, NgIf],

  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.pattern('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6), // More practical for login
    ]),
  });

  isLoading = false;
  loginError = '';

  constructor(
    private loginService: LoginService,
    private router: Router,
    private authService: AuthService
  ) {}

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';

      const loginData: LoginInterface = {
        email: this.loginForm.value.email!,
        password: this.loginForm.value.password!,
      };

      this.loginService.login(loginData).subscribe({
        next: (response) => {
          console.log('Login successful:', response);

          // Store token in localStorage (or use a token service)
          if (response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('userRole', response.data.role);
            localStorage.setItem('userEmail', response.data.email);
            this.authService.setCurrentUser(response.data);
          }

          // Redirect based on role
          this.redirectBasedOnRole(response.data.role);

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.loginError =
            error.error?.message || 'Login failed. Please try again.';
          this.isLoading = false;
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private redirectBasedOnRole(role: string) {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'seller':
        // this.router.navigate(['/seller-dashboard']);
        this.router.navigate(['/seller']);

        break;
      case 'staff':
        // this.router.navigate(['/staff-dashboard']);
        console.log('Redirecting to staff dashboard');
        break;
      case 'customer':
        this.router.navigate(['']);
        // console.log('Redirecting to user dashboard');
        break;
      default:
        // this.router.navigate(['/home']);
        console.log('Redirecting to home');
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }
}
