import { Routes } from '@angular/router';
import { Home } from './home/home';
import { LoginComponent } from './login-component/login-component';
import { RegistrationComponent } from './registration-component/registration-component';
import { ProductLists } from './service/product-lists';
import { ProductDetails } from './product-details/product-details';
import { SellerComponent } from './seller-component/seller-component';
import { Admincomponent } from './admincomponent/admincomponent';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegistrationComponent },
  { path: 'seller', component: SellerComponent },
  { path: 'admin', component: Admincomponent },
  { path: 'product/:id', component: ProductDetails },
];
