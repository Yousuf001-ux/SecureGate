import { getServerSession } from "next-auth";
import { authOptions } from "./nextauth";

/**
 * Retrieves the current session on the server-side.
 * Suitable for Server Components, Route Handlers, and Server Actions.
 */
export async function getServerSideSession() {
  return getServerSession(authOptions);
}
