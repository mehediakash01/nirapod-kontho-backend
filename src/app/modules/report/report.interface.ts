export interface ICreateReport {
  type: 'HARASSMENT' | 'DOMESTIC_VIOLENCE' | 'STALKING' | 'CORRUPTION' | 'THREAT';
  description: string;
  location: string;
  incidentDate: Date;
  severity: 'MILD' | 'MODERATE' | 'URGENT';
  latitude?: number;
  longitude?: number;
  voiceNoteUrl?: string;
  evidenceFiles?: {
    fileUrl: string;
    fileType: string;
  }[];
  isAnonymous?: boolean;
}