import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, APPLICATION, CONTACT, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import type { UserKind } from "../src/models/user.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const listOffersAs = (kind: UserKind, id: number) =>
  request(app).get("/offers").set("Authorization", tokenFor(kind, id));

const offerIds = (body: { id: number }[]): number[] => body.map((offer) => offer.id);

describe("GET /offers : accès", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).get("/offers");

    expect(response.status).toBe(401);
  });

  it.each([
    ["promoteur et signataire", CONTACT.NADIA_CHERIF],
    ["signataire uniquement", CONTACT.NATHALIE_RENARD],
    ["promoteur uniquement", CONTACT.LAURA_SIMON],
  ])("refuse un contact %s (403)", async (_profile, id) => {
    const response = await listOffersAs("CONTACT", id);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /offers : visibilité selon le profil", () => {
  it("montre toutes les offres à un administrateur, de la plus récente année à la plus ancienne", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
    expect(response.body.at(-1)).toEqual({
      id: OFFER.PDF_REPORTS,
      title: "Module de rapports PDF",
      companyShortName: "Orbis",
      academicYear: "2025-2026",
      period: "P1",
      status: "ARCHIVED",
    });
  });

  it("ne montre que les offres publiées à un étudiant", async () => {
    const response = await listOffersAs("STUDENT", STUDENT.LUCAS_DUPONT);

    expect(offerIds(response.body)).toEqual([
      OFFER.INTERNAL_CHATBOT,
      OFFER.DATA_QUALITY,
      OFFER.FLEET_APP,
      OFFER.BILLING_API,
    ]);
    expect(response.body.every((o: { status: string }) => o.status === "PUBLISHED")).toBe(true);
  });

  it("montre à un déposant toutes ses offres, quel que soit leur statut", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.MARC_LEJEUNE);

    expect(offerIds(response.body)).toEqual([
      OFFER.E2E_TESTS,
      OFFER.BILLING_API,
      OFFER.PDF_REPORTS,
    ]);
  });

  it("ne montre pas à un déposant l'offre d'un collègue de la même entreprise", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.CLAIRE_DUMONT);

    expect(offerIds(response.body)).toEqual([OFFER.FLEET_APP]);
    expect(offerIds(response.body)).not.toContain(OFFER.CLIENT_PORTAL);
  });

  it("montre à un contact multi-entreprises ses offres dans ses deux entreprises", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.JULIEN_LAMBERT);

    expect(response.body.map((o: { companyShortName: string }) => o.companyShortName)).toEqual([
      "Lumen Digital",
      "Lumen Data",
    ]);
    expect(offerIds(response.body)).toEqual([OFFER.CLIENT_PORTAL, OFFER.DATA_QUALITY]);
  });

  it("n'expose que les champs du DTO", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(Object.keys(response.body[0]).sort()).toEqual(
      ["academicYear", "companyShortName", "id", "period", "status", "title"],
    );
  });
});

describe("POST /offers/:id/apply : EF-32", () => {
  it("crée une candidature pour une offre publiée avec un message facultatif", async () => {
    const response = await request(app)
      .post(`/offers/${OFFER.INTERNAL_CHATBOT}/apply`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT))
      .send({ message: "Je suis motivé par ce sujet." });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.INTERNAL_CHATBOT,
      studentId: STUDENT.LUCAS_DUPONT,
      status: "IN_PROGRESS",
      message: "Je suis motivé par ce sujet.",
    });
  });

  it("refuse une double candidature active sur la même offre", async () => {
    const response = await request(app)
      .post(`/offers/${OFFER.FLEET_APP}/apply`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT))
      .send({ message: "Je souhaite candidater à nouveau." });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("autorise une nouvelle candidature après une sélection ou un refus", async () => {
    const response = await request(app)
      .post(`/offers/${OFFER.CLOUD_MIGRATION}/apply`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.MATEUSZ_KOWALSKI))
      .send();

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.CLOUD_MIGRATION,
      studentId: STUDENT.MATEUSZ_KOWALSKI,
      status: "IN_PROGRESS",
      message: null,
    });
  });

  it("refuse une candidature sur une offre non publiée", async () => {
    const response = await request(app)
      .post(`/offers/${OFFER.PDF_REPORTS}/apply`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT))
      .send({ message: "Je tente une candidature impossible." });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
    expect(response.body.error.message).toMatch(/n'est (pas|plus) ouverte aux candidatures/i);
  });
});

describe("EF-33 : candidatures de l'étudiant", () => {
  it("affiche les candidatures de l'étudiant avec leur statut", async () => {
    const response = await request(app)
      .get("/applications")
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          offerId: OFFER.FLEET_APP,
          studentId: STUDENT.LUCAS_DUPONT,
          status: "IN_PROGRESS",
        }),
      ]),
    );
  });

  it("refuse le retrait d'une candidature déjà traitée", async () => {
    const response = await request(app)
      .patch(`/applications/${APPLICATION.LEA_CLOUD_MIGRATION}/withdraw`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.LEA_MERTENS));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
    expect(response.body.error.message).toMatch(/ne peut plus être retirée|déjà traitée/i);
  });

  it("retire une candidature active", async () => {
    const response = await request(app)
      .patch(`/applications/${APPLICATION.LUCAS_FLEET_APP}/withdraw`)
      .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: APPLICATION.LUCAS_FLEET_APP,
      status: "WITHDRAWN",
    });
  });
});
