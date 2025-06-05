// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry if DSN is properly configured and not the placeholder
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isValidDsn = dsn && dsn !== "YOUR_SENTRY_DSN_HERE";

if (isValidDsn) {
  Sentry.init({
    dsn: dsn,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Additional Options
    environment: process.env.NODE_ENV,
    debug: false,
  });
} else {
  console.log("Sentry edge initialization skipped: No valid DSN configured");
}