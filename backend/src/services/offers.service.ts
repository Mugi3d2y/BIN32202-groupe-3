import { toOffer } from "../mappers/offer.mapper.ts";
import type { Offer } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import type { OfferFilter, OffersRepository } from "../repositories/offers.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { hasContactRole, isAdmin, isStudent } from "./permissions.ts";

/**
 * Offres visibles selon le profil (CdC § 4) : toutes pour l'administrateur, les offres
 * publiées pour l'étudiant, les offres qu'il a déposées pour un déposant.
 */
const visibilityFilter = (viewer: User): OfferFilter => {
  if (isAdmin(viewer)) return {};
  if (isStudent(viewer)) return { status: "PUBLISHED" };
  if (hasContactRole(viewer, "DEPOSITOR")) return { depositorContactId: viewer.id };
  throw new HttpError(403, "FORBIDDEN", "Vous n'avez pas accès aux offres");
};

export const createOffersService = (repository: OffersRepository) => ({
  listOffers: (viewer: User): Offer[] => repository.findAll(visibilityFilter(viewer)).map(toOffer),
  applyToOffer: (
    viewer: User,
    offerId: number,
    message?: string,
  ): { id: number; offerId: number; studentId: number; message: string | null; status: "IN_PROGRESS" } => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seuls les étudiants peuvent candidater");
    }

    const offer = repository.findById(offerId);
    if (!offer) {
      throw new HttpError(404, "NOT_FOUND", "Offre introuvable");
    }

    if (offer.status === "SUBMITTED" || offer.status === "PENDING") {
      throw new HttpError(409, "CONFLICT", "Cette offre n'est pas ouverte aux candidatures");
    }

    if (repository.findActiveApplication(offerId, viewer.id)) {
      throw new HttpError(409, "CONFLICT", "Vous avez déjà une candidature active pour cette offre");
    }

    const latestApplication = repository.findApplicationForStudent(offerId, viewer.id);
    if (
      (offer.status === "ASSIGNED" || offer.status === "ARCHIVED") &&
      (!latestApplication || latestApplication.status === "IN_PROGRESS")
    ) {
      throw new HttpError(
        409,
        "CONFLICT",
        "Cette offre n'est plus ouverte aux candidatures pour ce profil",
      );
    }

    const normalizedMessage = typeof message === "string" ? message.trim() : "";

    return repository.createApplication({
      offerId,
      studentId: viewer.id,
      message: normalizedMessage === "" ? null : normalizedMessage,
    });
  },
});

export type OffersService = ReturnType<typeof createOffersService>;
