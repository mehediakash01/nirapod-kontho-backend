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