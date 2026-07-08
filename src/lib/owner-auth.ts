import { currentUser } from "@clerk/nextjs/server";

export const OWNER_EMAILS = [
  "peakmoonnursery@gmail.com",
  "sligrano@gmail.com",
  "keatonfreeman@gmail.com",
  "sashagordin22@gmail.com",
  "eugenevgordin@gmail.com",
] as const;

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (OWNER_EMAILS as readonly string[]).includes(normalized);
}

export async function getOwnerEmail(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;

  const primary =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    null;

  const normalized = primary?.trim().toLowerCase() ?? null;
  return isOwnerEmail(normalized) ? normalized : null;
}
