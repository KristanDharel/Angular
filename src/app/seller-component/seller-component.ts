import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Sellerservice } from '../service/sellerservice';
import { AuthService } from '../service/auth-service';
import { first } from 'rxjs';

@Component({
  selector: 'app-seller-component',
  imports: [ReactiveFormsModule, NgIf, NgFor],

  templateUrl: './seller-component.html',
  styleUrl: './seller-component.css',
})
export class SellerComponent {
  addProductForm = new FormGroup({
    ProductName: new FormControl('', Validators.required),
    ProductDescription: new FormControl('', Validators.required),
    startingBid: new FormControl('', [
      Validators.required,
      Validators.min(0.01),
    ]),
    category: new FormControl('', Validators.required),
    biddingEndDate: new FormControl('', Validators.required),
  });
  isLoading = false;
  addError = '';
  successMessage = '';
  selectedFiles: File[] = [];
  formSubmitted = false;

  constructor(
    private sellerService: Sellerservice,
    private authService: AuthService
  ) {}

  get ProductName() {
    return this.addProductForm.get('ProductName');
  }
  get ProductDescription() {
    return this.addProductForm.get('ProductDescription');
  }
  get startingBid() {
    return this.addProductForm.get('startingBid');
  }
  get category() {
    return this.addProductForm.get('category');
  }
  get biddingEndDate() {
    return this.addProductForm.get('biddingEndDate');
  }
  //extract input from file input then stores in selected file array
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.addError = '';
    }
  }

  onSubmit() {
    this.addError = '';
    this.successMessage = '';
    this.formSubmitted = true;

    // Validate form
    if (!this.addProductForm.valid) {
      this.addError = 'Please fill in all required fields correctly.';
      return;
    }

    // Validate files
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.addError = 'At least one product image is required.';
      return;
    }

    // Validate bidding end date
    const biddingEndDate = new Date(this.addProductForm.value.biddingEndDate!);
    if (biddingEndDate <= new Date()) {
      this.addError = 'Bidding end date must be in the future.';
      return;
    }

    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.addError = 'You must be logged in to add a product.';
      this.isLoading = false;
      return;
    }

    // as file is created we use FormData

    const formData = new FormData();
    const formValue = this.addProductForm.value;
    if (!formValue.biddingEndDate) {
      console.error('Bidding End Date is missing');
      return;
    }

    const isoDate = new Date(formValue.biddingEndDate).toISOString();
    formData.append('ProductName', formValue.ProductName!);
    formData.append('ProductDescription', formValue.ProductDescription!);
    formData.append('startingBid', formValue.startingBid!.toString());
    formData.append('category', formValue.category!);
    formData.append('biddingEndDate', isoDate);
    for (let i = 0; i < this.selectedFiles.length; i++) {
      formData.append('images', this.selectedFiles[i]);
    }

    this.sellerService
      .addProduct(formData)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.successMessage =
            'Your product has been sent for review. Till then stay tuned hehehaha';
          this.resetForm();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error submitting product:', error);
          this.addError =
            error.error?.message ||
            'Failed to submit product. Please try again.';
          this.isLoading = false;
        },
      });
    console.log('Form value:', this.addProductForm.value);
    console.log(
      'Raw bidding end date:',
      this.addProductForm.value.biddingEndDate
    );
  }

  resetForm(): void {
    this.addProductForm.reset();
    this.selectedFiles = [];
    this.formSubmitted = false;
    // Reset file input
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}