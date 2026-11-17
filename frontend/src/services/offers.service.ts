import type { Application } from "../models/application.ts";
import type { Offer } from "../models/offer.ts";
import { API_URL, readJson } from "../utils/api.ts";
import { isApplication, isOfferList } from "../utils/guards.ts";

export const getOffers = async (token: string, search: string, signal?: AbortSignal): Promise<Offer[]> => {
  const params = new URLSearchParams();
  if (search.trim() !== "") {
    params.set("q", search.trim());
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";

  const response = await fetch(`${API_URL}/offers${query}`, {
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
