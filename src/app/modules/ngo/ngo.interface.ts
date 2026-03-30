export interface ICreateNGO {
  name: string;
  email: string;
  phone: string;
  address: string;
  supportedReportTypes?: Array<
    'HARASSMENT' | 'DOMESTIC_VIOLENCE' | 'STALKING' | 'CORRUPTION' | 'THREAT'
  >;
  coverageAreas?: string[];
  maxActiveCases?: number;
  priorityEscalationHours?: number;
  admin: {
    name: string;
    email: string;
    password: string;
  };
}

export interface ISuperAdminAnalytics {
  totalNgos: number;
  totalReports: number;
  submittedReports: number;
  verifiedReports: number;
  rejectedReports: number;
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  totalSuccessfulDonations: number;
}