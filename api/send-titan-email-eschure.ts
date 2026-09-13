import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = req.headers["x-webhook-secret"];
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { record } = req.body;

    // Match actual email_queue columns
    if (!record || !record.recipient_email || !record.subject || !record.html_body) {
      return res.status(400).json({
        error: "Invalid payload from Supabase webhook",
        received_body: req.body,
      });
    }

    if (!process.env.TITAN_USER_ESCHURE || !process.env.TITAN_PASS_ESCHURE) {
      return res.status(500).json({
        error: "Missing Titan credentials in environment variables",
        TITAN_USER_ESCHURE_present: !!process.env.TITAN_USER_ESCHURE,
        TITAN_PASS_ESCHURE_present: !!process.env.TITAN_PASS_ESCHURE,
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net", // GoDaddy Professional Email
      port: 465,
      secure: true,
      auth: {
        user: process.env.TITAN_USER_ESCHURE,
        pass: process.env.TITAN_PASS_ESCHURE,
      },
    });

    try {
      await transporter.verify();
    } catch (verifyError: any) {
      return res.status(500).json({
        error: "SMTP connection/auth failed",
        details: {
          message: verifyError?.message,
          code: verifyError?.code,
          command: verifyError?.command,
          responseCode: verifyError?.responseCode,
          response: verifyError?.response,
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.TITAN_USER_ESCHURE,
      to: record.recipient_name
        ? `"${record.recipient_name}" <${record.recipient_email}>`
        : record.recipient_email,
      subject: record.subject,
      html: record.html_body,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully via Titan SMTP",
      info: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to send email",
      details: {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        command: error?.command,
        responseCode: error?.responseCode,
        response: error?.response,
        stack: error?.stack,
      },
    });
  }
}