import type { Db } from "../db/database.ts";
import type { OfferDbo, OfferStatus } from "../models/offer.ts";

export interface OfferFilter {
  /** Limite aux offres de ce statut. */
  status?: OfferStatus;
  /** Limite aux offres déposées par ce contact. */
  depositorContactId?: number;
}

export interface OfferSummary {
  id: number;
  status: OfferStatus;
}

interface FindAllParams {
  status: OfferStatus | null;
  depositorContactId: number | null;
}

interface ApplicationInsertParams {
  offer_id: number;
  student_id: number;
  message: string | null;
}

export const createOffersRepository = (db: Db) => {
  const findAll = db.prepare<FindAllParams, OfferDbo>(`
    SELECT o.id, o.title, o.description, o.status,
           o.company_id, c.short_name AS company_short_name,
           o.depositor_contact_id,
           ay.label AS academic_year_label, p.code AS period_code,
           o.created_at, o.updated_at
    FROM offers o
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE (@status IS NULL OR o.status = @status)
      AND (@depositorContactId IS NULL OR o.depositor_contact_id = @depositorContactId)
    ORDER BY ay.start_date DESC, o.created_at DESC
  `);

  const findById = db.prepare<{ id: number }, OfferSummary>(`SELECT id, status FROM offers WHERE id = @id`);

  const findActiveApplication = db.prepare<
    { offer_id: number; student_id: number },
    { id: number }
  >(`
    SELECT id
    FROM applications
    WHERE offer_id = @offer_id
      AND student_id = @student_id
      AND status = 'IN_PROGRESS'
    LIMIT 1
  `);

  const findApplicationForStudent = db.prepare<
    { offer_id: number; student_id: number },
    { id: number; status: string }
  >(`
    SELECT id, status
    FROM applications
    WHERE offer_id = @offer_id
      AND student_id = @student_id
    ORDER BY applied_at DESC, id DESC
    LIMIT 1
  `);

  const insertApplication = db.prepare<ApplicationInsertParams, { lastInsertRowid: bigint }>(`
    INSERT INTO applications (offer_id, student_id, message, status)
    VALUES (@offer_id, @student_id, @message, 'IN_PROGRESS')
  `);

  return {
    /** Offres correspondant au filtre, de la plus récente année à la plus ancienne. */
    findAll: ({ status, depositorContactId }: OfferFilter): OfferDbo[] =>
      findAll.all({ status: status ?? null, depositorContactId: depositorContactId ?? null }),
    findById: (offerId: number): OfferSummary | undefined => findById.get({ id: offerId }),
    findActiveApplication: (offerId: number, studentId: number): { id: number } | undefined =>
      findActiveApplication.get({ offer_id: offerId, student_id: studentId }),
    findApplicationForStudent: (offerId: number, studentId: number): { id: number; status: string } | undefined =>
      findApplicationForStudent.get({ offer_id: offerId, student_id: studentId }),
    createApplication: ({
      offerId,
      studentId,
      message,
    }: {
      offerId: number;
      studentId: number;
      message: string | null;
    }) => {
      const result = insertApplication.run({
        offer_id: offerId,
        student_id: studentId,
        message,
      });
      return {
        id: Number(result.lastInsertRowid),
        offerId,
        studentId,
        message,
        status: "IN_PROGRESS" as const,
      };
    },
  };
};

export type OffersRepository = ReturnType<typeof createOffersRepository>;
