import { Edge } from "edge.js";
import path, { join } from "path";
import gmailTransport from "./index.js";
import dotenv from "dotenv";
import { verifyHtml } from "./templates/verify.js";
import { recoveryHtml } from "./templates/recovery.js";

dotenv.config();

const send = (to, subject, html) => {
  const options = {
    to,
    subject,
    html,
    from: process.env.GMAIL_USER,
  };
  return gmailTransport.sendMail(options);
};

export const sensitiveHeaders = async (to, name, link) => {
  const html = verifyHtml(name, link);
  return send(to, "Verify", html);
};

export const recoveryHeader = async (to, name, link) => {
  const html = recoveryHtml(name, link);
  return send(to, "Verify", html);
};
