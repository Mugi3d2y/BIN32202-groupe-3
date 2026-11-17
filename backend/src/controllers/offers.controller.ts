import { Router } from "express";
import type { PeriodCode } from "../models/offer.ts";
import { toOfferDto } from "../mappers/offer.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { OffersService } from "../services/offers.service.ts";
import { canApplyToOffer, canListOffers } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const MAX_SEARCH_LENGTH = 100;

const parseSearch = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_QUERY", "Le paramètre q doit apparaître une seule fois");
  }
  if (value.length > MAX_SEARCH_LENGTH) {
    throw new HttpError(
      400,
      "INVALID_QUERY",
      `Le paramètre q ne peut pas dépasser ${MAX_SEARCH_LENGTH} caractères`,
    );
  }

  const search = value.trim();
  return search === "" ? undefined : search;
};

const parsePeriod = (value: unknown): PeriodCode | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_QUERY", "Le paramètre period doit apparaître une seule fois");
  }
  if (value === "P1" || value === "P2" || value === "OTHER") {
    return value;
  }
  throw new HttpError(400, "INVALID_QUERY", "Le paramètre period est invalide");
};

export const createOffersRouter = (offersService: OffersService) => {
  const router = Router();

  router.get("/", authorize(canListOffers), (req, res) => {
    const search = parseSearch(req.query.q);
    const period = parsePeriod(req.query.period);
    res.json(offersService.listOffers(getCurrentUser(req), { search, period }).map(toOfferDto));
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
