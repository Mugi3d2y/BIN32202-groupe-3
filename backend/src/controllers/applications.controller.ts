import { Router } from "express";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { canApplyToOffer } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();

  router.get("/", authorize(canApplyToOffer), (req, res) => {
    res.json(applicationsService.listForStudent(getCurrentUser(req)));
  });

  router.patch("/:applicationId/withdraw", authorize(canApplyToOffer), (req, res) => {
    const applicationId = Number(req.params.applicationId);
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      throw new HttpError(400, "BAD_REQUEST", "Identifiant de candidature invalide");
    }

    res.json(applicationsService.withdraw(getCurrentUser(req), applicationId));
  });

  return router;
};
