export interface ICreatePayment {
  amount: number;
}

export interface IConfirmPayment {
  paymentIntentId: string;
}
