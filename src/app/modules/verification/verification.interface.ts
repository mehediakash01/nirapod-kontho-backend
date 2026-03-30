export interface IVerifyReport {
  reportId: string;
  status: 'APPROVED' | 'REJECTED';
  feedback?: string;
  rejectionReason?:
    | 'INSUFFICIENT_EVIDENCE'
    | 'INCONSISTENT_DETAILS'
    | 'DUPLICATE_REPORT'
    | 'OUT_OF_SCOPE'
    | 'POTENTIAL_SPAM'
    | 'OTHER';
  checklist?: string[];
}