import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const from = process.env.RESEND_FROM || "Portfolio <onboarding@resend.dev>";
const ownerEmail = process.env.CONTACT_EMAIL || process.env.ADMIN_EMAIL;

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export async function sendSubscriberConfirmation({ name, email }) {
  if (!resend) throw new Error("RESEND_API_KEY is not configured.");
  return resend.emails.send({
    from,
    to: [email],
    subject: "Thanks for subscribing",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto">
           <h2>Thanks for subscribing${name ? `, ${escapeHtml(name)}` : ""}!</h2>
           <p>You are now subscribed for updates from ${escapeHtml(process.env.PORTFOLIO_NAME || "Shivam Sharma")}.
           </p>
           </div>`,
  });
}

export async function notifyOwnerOfSubscriber({ name, email }) {
  if (!resend || !ownerEmail)
    throw new Error("Resend or owner email is not configured.");
  return resend.emails.send({
    from,
    to: [ownerEmail],
    replyTo: email,
    subject: `New subscriber: ${name || email}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6">
           <h2>New portfolio subscriber</h2><p><strong>Name:</strong> ${escapeHtml(name || "—")}
           </p>
           <p><strong>Email:</strong> ${escapeHtml(email)}
           </p>
           </div>`,
  });
}

export async function sendContactEmails({ name, email, subject, message }) {
  if (!resend) throw new Error("RESEND_API_KEY is not configured.");
  const visitorEmail = resend.emails.send({
    from,
    to: [email],
    subject: "Thanks for contacting me",
    replyTo: ownerEmail || undefined,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto">
           <h2>Thanks for reaching out, ${escapeHtml(name)}!</h2>
           <p>I’ve received your message${subject ? ` regarding <strong>${escapeHtml(subject)}</strong>` : ""}.
           </p>
           <p>I’ll review it and get back to you as soon as possible.</p>
           <p>Best regards,<br><strong>${escapeHtml(process.env.PORTFOLIO_NAME || "Portfolio Owner")}</strong>
           </p>
           </div>`,
  });
  const ownerNotification = ownerEmail
    ? resend.emails.send({
        from,
        to: [ownerEmail],
        replyTo: email,
        subject: `New portfolio contact: ${escapeHtml(subject || name)}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>New contact message</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject || "—")}</p><hr/>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        </div>`,
      })
    : Promise.reject(new Error("Owner email is not configured."));
  const [visitorResult, ownerResult] = await Promise.allSettled([
    visitorEmail,
    ownerNotification,
  ]);
  if (visitorResult.status === "rejected")
    console.error(
      "Visitor confirmation failed:",
      visitorResult.reason?.message || visitorResult.reason,
    );
  if (ownerResult.status === "rejected")
    console.error(
      "Owner notification failed:",
      ownerResult.reason?.message || ownerResult.reason,
    );
  return {
    status: {
      visitor: visitorResult.status === "fulfilled",
      owner: ownerResult.status === "fulfilled",
    },
  };
}

export function isEmailConfigured() {
  return Boolean(resend && ownerEmail);
}
