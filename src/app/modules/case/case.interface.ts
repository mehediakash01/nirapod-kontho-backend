export interface IUpdateCaseStatus {
  status: 'UNDER_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  note?: string;
}