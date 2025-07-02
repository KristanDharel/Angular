import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductLists } from '../service/product-lists';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { SocketService } from '../service/socket-service';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, firstValueFrom, takeUntil } from 'rxjs';
import { ProductInterface } from '../interfaces/product-interace';
import { AuthService } from '../service/auth-service';

@Component({
  selector: 'app-product-details',
  imports: [NgIf, NgFor, FormsModule, CommonModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css'],
  standalone: true,
})
export class ProductDetails implements OnInit, OnDestroy {
  product: ProductInterface | null = null;

  productId: string = '';
  loading: boolean = true;
  error: string = '';
  bidAmount: number = 0;
  minBidAmount: number = 0;
  timeRemaining: string = '';
  auctionEnded: boolean = false;
  socketConnected: boolean = false;
  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();
  isAuthenticated: boolean = false;
  currentUser: any = null;
  disable = true;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductLists,
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.currentUser;

    // Subscribe to user changes
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      })
    );

    if (!this.isAuthenticated) {
      this.error = 'Please login to view product details';
      this.loading = false;
      return;
    }

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (params) => {
        this.productId = params['id'];
        if (this.productId) {
          await this.loadProductDetails();
        }
      });

    // Connect to socket and handle connection status
    this.subscriptions.push(
      this.socketService.connect('http://localhost:8000').subscribe({
        next: (connected) => {
          this.socketConnected = connected;
          if (connected && this.productId) {
            this.setupSocketListeners();
            this.socketService.joinRoom(this.productId).catch((err) => {
              console.error('Failed to join room after reconnect:', err);
            });
          }
        },
        error: (err) => {
          console.error('Socket connection error:', err);
          this.socketConnected = false;
        },
      })
    );
  }

  async ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    // Unsubscribe all subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    try {
      if (this.productId) {
        await this.socketService.leaveRoom(this.productId);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  async loadProductDetails() {
    this.loading = true;
    this.error = '';

    try {
      const response = await firstValueFrom(
        this.productService.getProductById(this.productId)
      );
      this.product = response.data;
      this.minBidAmount = this.product.currentBid
        ? this.product.currentBid + 1
        : this.product.startingBid;

      // Join room only if socket is connected
      if (this.socketConnected) {
        await this.socketService.joinRoom(this.productId);
      }

      this.updateTimeRemaining();
    } catch (err) {
      this.error = 'Failed to load the product';
      console.error('Error loading product', err);
    } finally {
      this.loading = false;
    }
  }

  private setupSocketListeners() {
    // Listen for bid updates
    this.subscriptions.push(
      this.socketService.listen('bid_update').subscribe({
        next: (data: any) => {
          if (data.productId === this.productId && this.product) {
            this.product.currentBid = data.currentBid;
            this.minBidAmount = data.currentBid + 1;

            if (data.auctionExtended) {
              this.product.biddingEndDate = data.newEndTime;
              this.updateTimeRemaining();
            }
          }
        },
        error: (err) => console.error('Error in bid_update listener:', err),
      })
    );

    // Listen for auction time updates
    this.subscriptions.push(
      this.socketService.listen('auction_time_update').subscribe({
        next: (data: any) => {
          if (data.productId === this.productId) {
            this.updateTimeRemaining(data.timeRemaining);
          }
        },
        error: (err) =>
          console.error('Error in auction_time_update listener:', err),
      })
    );

    // Listen for auction ended
    this.subscriptions.push(
      this.socketService.listen('auction_ended').subscribe({
        next: (data: any) => {
          if (data.productId === this.productId && this.product) {
            this.auctionEnded = true;
            this.product.sold_out = 1;
            this.product.winner = data.winningBidder;
          }
        },
        error: (err) => console.error('Error in auction_ended listener:', err),
      })
    );

    // Listen for auction extended
    this.subscriptions.push(
      this.socketService.listen('auction_extended').subscribe({
        next: (data: any) => {
          if (data.productId === this.productId && this.product) {
            this.product.biddingEndDate = data.newEndTime;
            this.updateTimeRemaining();
          }
        },
        error: (err) =>
          console.error('Error in auction_extended listener:', err),
      })
    );
  }

  private updateTimeRemaining(timeRemainingMs?: number) {
    if (!this.product) return;

    const endTime = new Date(this.product.biddingEndDate).getTime();
    const now = Date.now();
    const remaining = timeRemainingMs || endTime - now;

    if (remaining <= 0) {
      this.timeRemaining = 'Auction ended';
      this.auctionEnded = true;
      return;
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (days > 0) {
      this.timeRemaining = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      this.timeRemaining = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      this.timeRemaining = `${minutes}m ${seconds}s`;
    }
  }

  async placeBid() {
    if (!this.isAuthenticated || !this.currentUser) {
      alert('Please login to place a bid');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.product || this.auctionEnded) {
      alert('This auction has ended');
      return;
    }

    if (this.bidAmount < this.minBidAmount) {
      alert(`Bid must be at least $${this.minBidAmount}`);
      return;
    }

    if (!this.socketConnected) {
      alert('Not connected to the auction server. Please try again.');
      return;
    }

    try {
      const response = await new Promise<any>((resolve) => {
        this.socketService
          .emit(
            'place_bid',
            {
              productId: this.productId,
              userId: this.currentUser._id,
              userEmail: this.currentUser.email,
              amount: this.bidAmount,
              sellerId: this.product?.seller,
            },
            resolve
          )
          .catch((err) => {
            console.error('Error placing bid:', err);
            resolve({ success: false, message: 'Failed to place bid' });
          });
      });

      if (response.success) {
        console.log('Bid placed successfully');
        if (response.auctionExtended) {
          this.product!.biddingEndDate = response.newEndTime;
          this.updateTimeRemaining();
        }
      } else {
        alert(response.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Error placing bid. Please try again.');
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
  disableBid(): number | null {
    const currentTime = Date.now();
    const biddingEndDate = this.product?.biddingEndDate;

    if (!biddingEndDate) {
      return null;
    }

    const standardEnd = new Date(biddingEndDate).getTime();
    const difference = standardEnd - currentTime; // Use standardEnd here, not biddingEndDate
    console.log('this is the time ', difference);
    return difference;
  }
  // In your component class
  isBidDisabled(): boolean {
    const difference = this.disableBid();
    // Disable if no end date or if time has expired (difference <= 0)
    return difference === null || difference <= 0;
  }
}
