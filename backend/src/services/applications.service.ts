import type { Application } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { isStudent } from "./permissions.ts";

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  listForStudent: (viewer: User): Application[] => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas accès à ses candidatures");
    }

    return repository.findByStudent(viewer.id).map((application) => ({
      id: application.id,
      offerId: application.offer_id,
      studentId: application.student_id,
      message: application.message,
      status: application.status,
      offerTitle: application.offer_title,
      companyShortName: application.company_short_name,
      appliedAt: application.applied_at,
    }));
  },

  withdraw: (viewer: User, applicationId: number): Application => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas accès à cette candidature");
    }

    const application = repository.findById(applicationId);
    if (!application || application.student_id !== viewer.id) {
      throw new HttpError(404, "NOT_FOUND", "Candidature introuvable");
    }
    if (application.status !== "IN_PROGRESS") {
      throw new HttpError(409, "CONFLICT", "Cette candidature ne peut plus être retirée");
    }

    repository.setStatusToWithdrawn(applicationId);

    return {
      id: application.id,
      offerId: repository.findByStudent(viewer.id).find((row) => row.id === applicationId)?.offer_id ?? 0,
      studentId: application.student_id,
      message: application.message,
      status: "WITHDRAWN",
      offerTitle: repository.findByStudent(viewer.id).find((row) => row.id === applicationId)?.offer_title ?? "",
      companyShortName:
        repository.findByStudent(viewer.id).find((row) => row.id === applicationId)?.company_short_name ?? "",
      appliedAt: repository.findByStudent(viewer.id).find((row) => row.id === applicationId)?.applied_at ?? new Date().toISOString(),
    };
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
