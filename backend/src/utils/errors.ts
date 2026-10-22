export interface FieldError {
  field: string;
  message: string;
}

/**
 * שגיאה צפויה שהשרת מחזיר ללקוח.
 * status = קוד HTTP, code = קוד טקסט קבוע, message = הודעה בעברית להצגה למשתמש.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (code: string, message: string, details?: FieldError[]) =>
  new AppError(400, code, message, details);
export const validationError = (details: FieldError[]) =>
  new AppError(400, 'VALIDATION_ERROR', 'הנתונים שנשלחו אינם תקינים', details);
export const unauthorized = (code: string, message: string) => new AppError(401, code, message);
export const forbidden = (code: string, message: string) => new AppError(403, code, message);
export const notFound = (code: string, message: string) => new AppError(404, code, message);
export const conflict = (code: string, message: string) => new AppError(409, code, message);
