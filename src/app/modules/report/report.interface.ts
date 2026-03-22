export interface ICreateReport {
  type: 'HARASSMENT' | 'DOMESTIC_VIOLENCE' | 'STALKING' | 'CORRUPTION' | 'THREAT';
  description: string;
  location: string;
  isAnonymous?: boolean;
}