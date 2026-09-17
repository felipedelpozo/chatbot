import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function apiError(
  status: 400 | 401 | 404 | 409 | 422 | 500 | 503,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export function validationError(error: ZodError) {
  return apiError(
    422,
    "VALIDATION_ERROR",
    "The request contains invalid values.",
    error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export function isSafeReturnPath(value: string | null | undefined) {
  return Boolean(value?.startsWith("/") && !value.startsWith("//"));
}

