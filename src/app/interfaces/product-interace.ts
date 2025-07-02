export interface ProductInterface {
  _id: string;
  id?: string; // Optional fallback
  ProductName: string;
  ProductDescription: string;
  startingBid: number;
  category: string;
  images: { url: string; public_id: string; _id: string }[];
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: number;
    // ... other seller properties can be added as needed
  };
  sellerName: string;
  winner:string
  status: string;
  currentBid: any;
  biddingEndDate: string;
  paymentStatus: boolean;
  sold_out: number;
  bids: any[];
  reviews: any[];
  createdAt: string;
  updatedAt: string;
  adminResponse: string;
  sellerId: string;
}

export interface ProductApiResponse {
  data: ProductInterface[];
  total?: number;
  skip?: number;
  limit?: number;
}

export interface SingleProductResponse {
  data: ProductInterface;
  message?: string;
  success?: boolean;
}