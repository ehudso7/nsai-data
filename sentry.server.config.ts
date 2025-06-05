// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

    // Capture unhandled promise rejections
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
} else {
  console.log("Sentry server initialization skipped: No valid DSN configured");
}