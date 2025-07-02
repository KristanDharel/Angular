export interface RegistrationInterface {
     firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | number;
  password: string;
  conPassword: string;
  role: string;
  isVerified?: boolean;
  isVerifiedEmail?: boolean;
}
