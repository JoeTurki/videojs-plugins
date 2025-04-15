import { defineWorkspace } from 'vitest/config';

const browser = process.env.TEST_BROWSER || 'chrome';

export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'browser',
      browser: {
        enabled: true,
        provider: 'webdriverio',
        headless: process.env.TEST_HEADLESS !== 'false',
        instances: [
          { name: browser, browser },
        ],
        viewport: {
          width: 1920,
          height: 1080,
        },
      },
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'ci',
    },
  },
]);
