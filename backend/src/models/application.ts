export const APPLICATION_STATUSES = ["IN_PROGRESS", "SELECTED", "REJECTED", "WITHDRAWN"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationDbo {
  id: number;
  offer_id: number;
  student_id: number;
  message: string | null;
  status: ApplicationStatus;
  applied_at: string;
  offer_title: string;
  company_short_name: string;
}

export interface Application {
  id: number;
  offerId: number;
  studentId: number;
  message: string | null;
  status: ApplicationStatus;
  offerTitle: string;
  companyShortName: string;
  appliedAt: string;
}
