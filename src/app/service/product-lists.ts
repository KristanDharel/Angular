import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ProductApiResponse,
  ProductInterface,
  SingleProductResponse,
} from '../interfaces/product-interace';

@Injectable({
  providedIn: 'root',
})
export class ProductLists {
  constructor(private http: HttpClient) {}
  getApprovedProduct(): Observable<ProductApiResponse> {
    const url = 'http://localhost:8000/admin/approved-products';
    return this.http.get<ProductApiResponse>(url);
  }
  getProductById(id: string): Observable<SingleProductResponse> {
    const url = `http://localhost:8000/product/read-product-by-id/${id}`;
    return this.http.get<SingleProductResponse>(url);
  }
  
}
