import { defineWorkspace } from 'vitest/config';

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
          { name: 'chrome', browser: 'chrome' },
          { name: 'firefox', browser: 'firefox' },
          { name: 'edge', browser: 'edge' },
          { name: 'safari', browser: 'safari' },
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
