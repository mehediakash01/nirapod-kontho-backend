export interface IVerifyReport {
  reportId: string;
  status: 'APPROVED' | 'REJECTED';
  feedback?: string;
}