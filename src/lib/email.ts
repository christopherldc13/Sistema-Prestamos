import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM
    || (process.env.GMAIL_USER ? `Fact-Prest <${process.env.GMAIL_USER}>` : "Fact-Prest <onboarding@resend.dev>");

function buildResetHtml(resetUrl: string) {
    return `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#6366f1,#a855f7); line-height: 48px; color: white; font-weight: 800; font-size: 20px;">F</div>
      </div>
      <h2 style="text-align: center; font-size: 20px; margin-bottom: 8px;">Restablece tu contraseña</h2>
      <p style="text-align: center; color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 28px;">
        Solicitaste restablecer tu contraseña en Fact-Prest. Haz clic en el botón de abajo para elegir una nueva. Este enlace vence en 1 hora.
      </p>
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; font-weight: 700; padding: 14px 32px; border-radius: 10px; font-size: 14px;">
          Restablecer contraseña
        </a>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
        Si no solicitaste esto, puedes ignorar este correo con seguridad — tu contraseña no cambiará.
      </p>
      <p style="text-align: center; color: #cbd5e1; font-size: 11px; margin-top: 24px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
        <span style="word-break: break-all;">${resetUrl}</span>
      </p>
    </div>
    `;
}

let gmailTransporter: nodemailer.Transporter | null = null;
function getGmailTransporter() {
    if (!gmailTransporter) {
        gmailTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
    }
    return gmailTransporter;
}

async function sendViaGmail(to: string, subject: string, html: string) {
    await getGmailTransporter().sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
    });
}

async function sendViaResend(to: string, subject: string, html: string) {
    if (!resend) throw new Error("RESEND_API_KEY no está configurado.");

    const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });

    // El SDK de Resend no lanza excepción en errores de la API (ej. dominio no verificado,
    // destinatario no permitido en modo sandbox) — los devuelve en result.error sin fallar.
    if (result.error) {
        throw new Error(result.error.message || "No se pudo enviar el correo.");
    }
}

async function sendViaAppsScript(to: string, subject: string, html: string) {
    const url = process.env.GAS_WEBHOOK_URL;
    const secret = process.env.GAS_SHARED_SECRET;
    if (!url || !secret) throw new Error("GAS_WEBHOOK_URL o GAS_SHARED_SECRET no están configurados.");

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Google Apps Script Web Apps responden con un 302 a un dominio distinto al reenviar
        // la respuesta real — hay que seguir la redirección para leer el resultado.
        redirect: "follow",
        body: JSON.stringify({ secret, to, subject, html }),
    });

    let data: any = null;
    try { data = await res.json(); } catch { /* respuesta no-JSON, se maneja abajo */ }

    if (!res.ok || !data?.success) {
        throw new Error(data?.error || `El script de Google respondió con estado ${res.status}.`);
    }
}

async function sendEmail(to: string, subject: string, html: string) {
    const hasAppsScript = !!(process.env.GAS_WEBHOOK_URL && process.env.GAS_SHARED_SECRET);
    const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    const hasResend = !!process.env.RESEND_API_KEY;

    if (hasAppsScript) {
        await sendViaAppsScript(to, subject, html);
    } else if (hasGmail) {
        await sendViaGmail(to, subject, html);
    } else if (hasResend) {
        await sendViaResend(to, subject, html);
    } else {
        console.error("No hay ningún servicio de correo configurado (GAS_WEBHOOK_URL, GMAIL_USER/GMAIL_APP_PASSWORD, o RESEND_API_KEY).");
        throw new Error("El servicio de correo no está configurado.");
    }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    await sendEmail(to, "Restablece tu contraseña — Fact-Prest", buildResetHtml(resetUrl));
}

function buildWelcomeHtml(opts: { name: string; email: string; password: string; loginUrl: string }) {
    const { name, email, password, loginUrl } = opts;
    return `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#6366f1,#a855f7); line-height: 48px; color: white; font-weight: 800; font-size: 20px;">F</div>
      </div>
      <h2 style="text-align: center; font-size: 20px; margin-bottom: 8px;">¡Bienvenido a Fact-Prest!</h2>
      <p style="text-align: center; color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Hola${name ? " " + name : ""}, se creó tu cuenta en Fact-Prest, el sistema de gestión de préstamos, clientes y cobros. Aquí tienes tus datos de acceso:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 10px; font-size: 13px; color: #64748b;">
          <strong style="color: #1e293b;">Correo:</strong> ${email}
        </p>
        <p style="margin: 0; font-size: 13px; color: #64748b;">
          <strong style="color: #1e293b;">Contraseña temporal:</strong>
          <span style="font-family: monospace; background: #e2e8f0; padding: 2px 8px; border-radius: 6px; color: #1e293b; font-size: 14px;">${password}</span>
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${loginUrl}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; font-weight: 700; padding: 14px 32px; border-radius: 10px; font-size: 14px;">
          Entrar al sistema
        </a>
      </div>

      <p style="text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 24px;">
        Por seguridad, te recomendamos cambiar esta contraseña después de tu primer inicio de sesión, desde
        <strong>Configuración → Seguridad</strong>. También puedes iniciar sesión con Google usando este mismo correo.
      </p>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 8px;">
        <p style="text-align: center; color: #64748b; font-size: 12px; line-height: 1.7; margin: 0;">
          Con Fact-Prest puedes: registrar clientes y préstamos, calcular interés simple o amortización francesa,
          llevar el control de abonos y mora, generar contratos y recibos en PDF, y ver reportes de tu cartera —
          todo desde un solo lugar.
        </p>
      </div>

      <p style="text-align: center; color: #cbd5e1; font-size: 11px; margin-top: 24px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
        <span style="word-break: break-all;">${loginUrl}</span>
      </p>
    </div>
    `;
}

export async function sendWelcomeEmail(opts: { name: string; email: string; password: string }) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const html = buildWelcomeHtml({ ...opts, loginUrl: `${baseUrl}/login` });
    await sendEmail(opts.email, "Bienvenido a Fact-Prest — Tus datos de acceso", html);
}
