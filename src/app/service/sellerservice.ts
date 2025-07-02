import { Injectable } from '@angular/core';
import { ProductInterface } from '../interfaces/product-interace';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Sellerservice {
  constructor(private http: HttpClient) {}
  addProduct(formData: FormData): Observable<any> {
    const addProductApi =
      'http://localhost:8000/seller/submit-product-approval';

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<any>(addProductApi, formData, { headers });
  }
}
