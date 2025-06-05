// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
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
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release Health
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Additional Options
    environment: process.env.NODE_ENV,
    debug: false,
    
    // Filter out non-app errors
    beforeSend(event, hint) {
      // Filter out errors from browser extensions
      if (event.exception && event.exception.values?.[0]?.stacktrace?.frames) {
        const frames = event.exception.values[0].stacktrace.frames;
        if (frames.some(frame => frame.filename?.includes('extension://'))) {
          return null;
        }
      }
      return event;
    },
  });
} else {
  console.log("Sentry client initialization skipped: No valid DSN configured");
}