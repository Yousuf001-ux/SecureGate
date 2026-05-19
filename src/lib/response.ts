import { NextResponse } from "next/server";

/**
 * Returns a standardized Next.js JSON response for successful operations.
 */
export function jsonSuccess<T>(message: string, data: T = {} as T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Returns a standardized Next.js JSON response for failed operations.
 * Avoids exposing stack traces or raw engine errors to the public client.
 */
export function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}
