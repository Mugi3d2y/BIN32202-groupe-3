import type { Db } from "../db/database.ts";
import type { ApplicationDbo, ApplicationStatus } from "../models/application.ts";

export const createApplicationsRepository = (db: Db) => {
  const findByStudent = db.prepare<{ student_id: number }, ApplicationDbo>(`
    SELECT a.id, a.offer_id, a.student_id, a.message, a.status, a.applied_at,
           o.title AS offer_title, c.short_name AS company_short_name
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    WHERE a.student_id = @student_id
    ORDER BY a.applied_at DESC, a.id DESC
  `);

  const findById = db.prepare<{ id: number }, { id: number; student_id: number; message: string | null; status: ApplicationStatus }>(`
    SELECT id, student_id, message, status
    FROM applications
    WHERE id = @id
  `);

  const updateStatus = db.prepare<{ id: number; status: ApplicationStatus }, { id: number }>(`
    UPDATE applications
    SET status = @status
    WHERE id = @id
  `);

  return {
    findByStudent: (studentId: number): ApplicationDbo[] => findByStudent.all({ student_id: studentId }),
    findById: (id: number) => findById.get({ id }),
    setStatusToWithdrawn: (id: number): void => {
      updateStatus.run({ id, status: "WITHDRAWN" });
    },
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
