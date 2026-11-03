import { Router } from "express";
import { toOfferDto } from "../mappers/offer.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { OffersService } from "../services/offers.service.ts";
import { canApplyToOffer, canListOffers } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

export const createOffersRouter = (offersService: OffersService) => {
  const router = Router();

  router.get("/", authorize(canListOffers), (req, res) => {
    res.json(offersService.listOffers(getCurrentUser(req)).map(toOfferDto));
  });

  router.post("/:offerId/apply", authorize(canApplyToOffer), (req, res) => {
    const offerId = Number(req.params.offerId);

    if (!Number.isInteger(offerId) || offerId <= 0) {
      throw new HttpError(400, "BAD_REQUEST", "Identifiant d'offre invalide");
    }

    const message = typeof req.body?.message === "string" ? req.body.message : undefined;
    res.status(201).json(offersService.applyToOffer(getCurrentUser(req), offerId, message));
  });

  return router;
};
