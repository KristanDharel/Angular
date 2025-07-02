export interface LoginInterface {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    email: string;
    role: 'admin' | 'seller' | 'staff' | 'user';
    [key: string]: any; // for other user properties
  };
  token: string;
}
