// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthService {
//   getCurrentUser() {
//     const userJson = localStorage.getItem('currentUser');
//     return userJson ? JSON.parse(userJson) : null;
//   }

//   setCurrentUser(user: any) {
//     localStorage.setItem('currentUser', JSON.stringify(user));
//   }

//   clearCurrentUser() {
//     localStorage.removeItem('currentUser');
//   }
//   getToken(): string | null {
//     return localStorage.getItem('token');
//   }
// }
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor() {
    // Initialize from localStorage
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      this.currentUserSubject.next(JSON.parse(userJson));
    }
  }

  get currentUser$() {
    return this.currentUserSubject.asObservable();
  }

  get currentUser() {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: any) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  clearCurrentUser() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!this.getToken();
  }
  getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }
}
