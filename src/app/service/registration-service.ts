import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RegistrationInterface } from '../interfaces/registration-interface';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  constructor(private http: HttpClient) {}
  private apiUrl = 'http://localhost:8000/users/register';

  register(
    registerData: RegistrationInterface
  ): Observable<RegistrationInterface> {
    return this.http.post<RegistrationInterface>(this.apiUrl, registerData);
  }
}
