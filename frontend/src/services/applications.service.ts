import type { Application } from "../models/application.ts";
import { API_URL, readJson } from "../utils/api.ts";
import { isApplicationList } from "../utils/guards.ts";

export const getApplications = async (token: string, signal?: AbortSignal): Promise<Application[]> => {
  const response = await fetch(`${API_URL}/applications`, {
    headers: { Authorization: token },
    signal,
  });
  return readJson(response, isApplicationList, "Chargement des candidatures impossible");
};

export const withdrawApplication = async (token: string, applicationId: number): Promise<Application> => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/withdraw`, {
    method: "PATCH",
    headers: { Authorization: token },
  });

  return readJson(response, (value): value is Application => typeof value === "object" && value !== null, "Le retrait de candidature a échoué");
};
