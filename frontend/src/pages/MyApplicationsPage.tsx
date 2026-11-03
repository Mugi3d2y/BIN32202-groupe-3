import { useEffect, useState } from "react";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import type { Application } from "../models/application.ts";
import type { User } from "../models/user.ts";
import { getApplications, withdrawApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

interface MyApplicationsPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const MyApplicationsPage = ({ token, onUnauthorized }: MyApplicationsPageProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = () => {
    const controller = new AbortController();

    getApplications(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setApplications(data);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setError(reason instanceof Error ? reason.message : "Erreur inconnue");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return controller;
  };

  useEffect(() => {
    const controller = loadApplications();
    return () => controller.abort();
  }, [token, onUnauthorized]);

  const handleWithdraw = async (applicationId: number) => {
    try {
      await withdrawApplication(token, applicationId);
      setError(null);
      loadApplications();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Le retrait a échoué");
    }
  };

  if (error) return <ErrorState message={error} />;
  if (isLoading) return <LoadingState />;

  return (
    <section>
      <h1>Mes candidatures</h1>
      {applications.length === 0 ? (
        <p>Aucune candidature.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Offre</th>
              <th>Entreprise</th>
              <th>Statut</th>
              <th>Message</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.offerTitle}</td>
                <td>{application.companyShortName}</td>
                <td>{application.status}</td>
                <td>{application.message ?? "—"}</td>
                <td>
                  {application.status === "IN_PROGRESS" ? (
                    <button type="button" onClick={() => handleWithdraw(application.id)}>
                      Retirer
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default MyApplicationsPage;
