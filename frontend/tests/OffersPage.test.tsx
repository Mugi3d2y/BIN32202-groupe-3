import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MyApplicationsPage from "../src/pages/MyApplicationsPage.tsx";
import OffersPage from "../src/pages/OffersPage.tsx";
import { adminUser, contactUser, stubFetch, studentUser } from "./helpers/fetchMock.ts";

const offers = [
  {
    id: 2,
    title: "Refonte du portail client",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2",
    status: "SUBMITTED",
  },
  {
    id: 5,
    title: "Tableau de bord de qualité des données",
    companyShortName: "Lumen Data",
    academicYear: "2026-2027",
    period: "OTHER",
    status: "ASSIGNED",
  },
];

describe("OffersPage", () => {
  it("affiche les offres avec leurs libellés français", async () => {
    stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Refonte du portail client")).toBeInTheDocument();
    expect(screen.getByText("Soumise")).toBeInTheDocument();
    expect(screen.getByText("Attribuée")).toBeInTheDocument();
    expect(screen.getByText("Autre")).toBeInTheDocument();
    expect(screen.getByText("2 offres")).toBeInTheDocument();
    expect(screen.getByText("Les offres que vous avez déposées.")).toBeInTheDocument();
  });

  it("adapte la description au profil", async () => {
    stubFetch({ "/api/offers": () => Response.json([]) });

    const { unmount } = render(
      <OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />,
    );
    expect(screen.getByText("Les offres publiées.")).toBeInTheDocument();
    expect(await screen.findByText("Aucune offre à afficher.")).toBeInTheDocument();
    unmount();

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    expect(screen.getByText("Toutes les offres, tous statuts confondus.")).toBeInTheDocument();
  });

  it("affiche un bouton Candidater pour une offre publiée d'un étudiant", async () => {
    stubFetch({
      "/api/offers": () =>
        Response.json([
          {
            id: 2,
            title: "Refonte du portail client",
            companyShortName: "Lumen Digital",
            academicYear: "2026-2027",
            period: "P2",
            status: "PUBLISHED",
          },
        ]),
      "/api/offers/2/apply": () =>
        Response.json({
          id: 99,
          offerId: 2,
          studentId: studentUser.id,
          message: null,
          status: "IN_PROGRESS",
        }),
    });

    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Candidater" }));
    expect(screen.getByLabelText("Message (facultatif)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Candidature enregistrée."),
    );
  });

  it("permet d'ajouter un message facultatif avant la candidature", async () => {
    const fetchMock = stubFetch({
      "/api/offers": () =>
        Response.json([
          {
            id: 2,
            title: "Refonte du portail client",
            companyShortName: "Lumen Digital",
            academicYear: "2026-2027",
            period: "P2",
            status: "PUBLISHED",
          },
        ]),
      "/api/offers/2/apply": () => {
        const lastCall = fetchMock.mock.calls.at(-1) as [RequestInfo | URL, RequestInit?] | undefined;
        const request = lastCall?.[0];
        const requestOptions = lastCall?.[1];
        const body = requestOptions?.body;
        expect(String(request)).toContain("/api/offers/2/apply");
        expect(String(body)).toContain("Je suis motivé");
        return Response.json({
          id: 99,
          offerId: 2,
          studentId: studentUser.id,
          message: "Je suis motivé",
          status: "IN_PROGRESS",
        });
      },
    });

    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Candidater" }));
    fireEvent.change(screen.getByLabelText("Message (facultatif)"), {
      target: { value: "Je suis motivé" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Candidature enregistrée."),
    );
  });

  it("ignore les aborts de nettoyage du fetch", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("signal is aborted without reason", "AbortError"));
        });
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(
      <MyApplicationsPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />,
    );
    unmount();

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("affiche un refus d'accès renvoyé par le backend", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 403 }) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 403");
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});
