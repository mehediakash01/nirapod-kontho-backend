export interface ICreateNGO {
  name: string;
  email: string;
  phone: string;
  address: string;
  admin: {
    name: string;
    email: string;
    password: string;
  };
}