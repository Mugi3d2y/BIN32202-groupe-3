import type { Application } from "../models/application.ts";
import type { Offer } from "../models/offer.ts";
import { API_URL, readJson } from "../utils/api.ts";
import { isApplication, isOfferList } from "../utils/guards.ts";

export const getOffers = async (token: string, signal?: AbortSignal): Promise<Offer[]> => {
  const response = await fetch(`${API_URL}/offers`, {
    headers: { Authorization: token },
    signal,
  });
  return readJson(response, isOfferList, "Chargement des offres impossible");
};

export const applyToOffer = async (
  token: string,
  offerId: number,
  message?: string,
): Promise<Application> => {
  const response = await fetch(`${API_URL}/offers/${offerId}/apply`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message === undefined ? {} : { message }),
  });

  return readJson(response, isApplication, "La candidature n'a pas pu être enregistrée");
};
