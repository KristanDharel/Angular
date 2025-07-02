// import { Component } from '@angular/core';
// import {
//   ProductApiResponse,
//   ProductInterface,
// } from '../interfaces/product-interace';
// import { ProductLists } from '../service/product-lists';
// import { NgFor, NgIf } from '@angular/common';
// import { NgForm } from '@angular/forms';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-home',
//   imports: [NgIf, NgFor],
//   templateUrl: './home.html',
//   styleUrl: './home.css',
// })
// export class Home {
//   productList: ProductInterface[] = [];
//   constructor(private productService: ProductLists, private router: Router) {}
//   ngOnInit() {
//     this.getApprovedProducts();
//   }
//   getApprovedProducts() {
//     this.productService
//       .getApprovedProduct()
//       .subscribe((data: ProductApiResponse) => {
//         console.log(data);
//         this.productList = data.data.filter(
//           (product) => product.paymentStatus === false
//         );
//       });
//   }
//   viewProductDetails(_id: string) {
//     this.router.navigate(['/product', _id]);
//   }
// }
import { Component, inject, signal } from '@angular/core';
import {
  ProductApiResponse,
  ProductInterface,
} from '../interfaces/product-interace';
import { ProductLists } from '../service/product-lists';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
  standalone: true,
})
export class Home {
  constructor(private productService: ProductLists, private router: Router) {}

  allProducts = signal<ProductInterface[]>([]);

  productList = signal<ProductInterface[]>([]);
  searchQuery: string = '';

  currentPage = signal(1);
  itemsPerPage = signal(3);
  totalItems = signal(0);
  totalPages = signal(0);
  isLoading = signal(false);

  ngOnInit() {
    this.loadAllProducts();
  }

  async loadAllProducts() {
    this.isLoading.set(true);
    try {
      const response = await lastValueFrom(
        this.productService.getApprovedProduct() // No parameters needed
      );

      if (response?.data) {
        // Store all approved, unpaid products
        const approvedProducts = response.data.filter(
          (product) => product.paymentStatus === false
        );

        this.allProducts.set(approvedProducts);
        this.totalItems.set(approvedProducts.length);
        this.totalPages.set(Math.ceil(this.totalItems() / this.itemsPerPage()));

        // Apply pagination
        this.paginateProducts();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private paginateProducts() {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    this.productList.set(this.allProducts().slice(startIndex, endIndex));
  }

  viewProductDetails(_id: string) {
    this.router.navigate(['/product', _id]);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.paginateProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
      this.paginateProducts();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
      this.paginateProducts();
    }
  }

  getPages(): number[] {
    const maxVisiblePages = 5;
    const pages = [];

    let startPage = Math.max(
      1,
      this.currentPage() - Math.floor(maxVisiblePages / 2)
    );
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > this.totalPages()) {
      endPage = this.totalPages();
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
  searchFunctionality() {
    const query = this.searchQuery.toLowerCase().trim();

    // If query is empty — reset to all products with pagination
    if (!query) {
      this.totalItems.set(this.allProducts().length);
      this.totalPages.set(Math.ceil(this.totalItems() / this.itemsPerPage()));
      this.currentPage.set(1);
      this.paginateProducts();
      return;
    }

    // Filter from allProducts — NOT productList
    const filtered = this.allProducts().filter((product) =>
      product.ProductName.toLowerCase().includes(query)
    );

    this.totalItems.set(filtered.length);
    this.totalPages.set(Math.ceil(this.totalItems() / this.itemsPerPage()));
    this.currentPage.set(1);

    const startIndex = 0;
    const endIndex = this.itemsPerPage();
    this.productList.set(filtered.slice(startIndex, endIndex));
  }
  reset() {
    this.searchQuery = '';
    this.searchFunctionality();
  }
}
