import { useState } from "react";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import { useOffers } from "../hooks/useOffers.ts";
import type { User } from "../models/user.ts";
import { applyToOffer } from "../services/offers.service.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  const { offers, isLoading, error } = useOffers(token, onUnauthorized);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingOfferId, setPendingOfferId] = useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");

  const handleApply = async (offerId: number, message?: string) => {
    if (user.kind !== "STUDENT") return;

    try {
      await applyToOffer(token, offerId, message);
      setActionMessage("Candidature enregistrée.");
      setPendingOfferId(null);
      setApplicationMessage("");
    } catch (caughtError) {
      setActionMessage(
        caughtError instanceof Error ? caughtError.message : "La candidature n'a pas pu être enregistrée.",
      );
    }
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        {actionMessage && <p role="status">{actionMessage}</p>}
        <OfferTable
          offers={offers}
          userKind={user.kind}
          onApply={(offerId: number) => {
            setPendingOfferId(offerId);
            setApplicationMessage("");
          }}
        />
        {pendingOfferId !== null && (
          <div>
            <label htmlFor="application-message">Message (facultatif)</label>
            <textarea
              id="application-message"
              value={applicationMessage}
              onChange={(event) => setApplicationMessage(event.target.value)}
              rows={4}
              placeholder="Ajoutez un mot de motivation..."
            />
            <button type="button" onClick={() => handleApply(pendingOfferId, applicationMessage)}>
              Envoyer ma candidature
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      {renderContent()}
    </section>
  );
};

export default OffersPage;
