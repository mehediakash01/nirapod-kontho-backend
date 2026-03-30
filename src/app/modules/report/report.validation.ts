import { z } from 'zod';

const optionalNumberField = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().optional()
);

const cloudinaryUrlValidator = z.string().url('Must be a valid Cloudinary URL').optional();

export const createReportSchema = z.object({
  type: z.enum([
    'HARASSMENT',
    'DOMESTIC_VIOLENCE',
    'STALKING',
    'CORRUPTION',
    'THREAT',
  ]),
  description: z.string().min(10, 'Description too short'),
  location: z.string().min(3),
  incidentDate: z.coerce.date({
    error: 'Incident date and time is required',
  }),
  severity: z.enum(['MILD', 'MODERATE', 'URGENT']),
  latitude: optionalNumberField.refine(
    (value) => value === undefined || (value >= -90 && value <= 90),
    'Latitude must be between -90 and 90'
  ),
  longitude: optionalNumberField.refine(
    (value) => value === undefined || (value >= -180 && value <= 180),
    'Longitude must be between -180 and 180'
  ),
  voiceNoteUrl: cloudinaryUrlValidator,
  evidenceFiles: z
    .array(
      z.object({
        fileUrl: z.string().url('Must be a valid Cloudinary URL'),
        fileType: z.string().min(1, 'fileType is required'),
      })
    )
    .max(5, 'Maximum 5 evidence files are allowed')
    .optional(),
  isAnonymous: z.coerce.boolean().optional(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().optional(),
});

export const assignReportSchema = z.object({
  ngoId: z.string().min(1, 'ngoId is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assignmentRationale: z.string().min(10, 'assignmentRationale must be at least 10 characters'),
  confirmAssignment: z.literal(true),
});