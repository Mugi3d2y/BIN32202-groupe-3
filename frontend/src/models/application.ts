export const APPLICATION_STATUSES = ["IN_PROGRESS", "SELECTED", "REJECTED", "WITHDRAWN"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application {
  id: number;
  offerId: number;
  studentId: number;
  message: string | null;
  status: ApplicationStatus;
  offerTitle?: string;
  companyShortName?: string;
}
