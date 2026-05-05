import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "noreply@yourdomain.com";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) { console.error("[email] Failed to send:", error); throw error; }
  return data;
}

export function welcomeEmail(name: string) {
  return {
    subject: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME}!`,
    html: `<h1>Hey ${name}, welcome aboard!</h1><p>Thanks for signing up.</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to Dashboard →</a>`,
  };
}
