import { boolish } from '@expo/env';
import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const isCI = boolish('CI', false);

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
  testDir: './playwright',
  /* Run test files in parallel. The tests in one file share one export or one server, so they run in order in one worker. */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  /* Retry failed tests. Some development server tests fail at random. */
  retries: 2,
  /* Opt out of parallel tests on CI or Windows. */
  workers: isCI || process.platform === 'win32' ? 1 : undefined,
  // Configure the global timeout to 3m, on Windows increase this to 5m
  timeout: process.platform === 'win32' ? 300_000 : 180_000,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [isCI ? ['list', { printSteps: true }] : ['null']],
  // reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'dev',
      testDir: './playwright/dev',
      /* A development server reacts to each file change in the repository, and some of these tests edit files. */
      workers: 1,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'prod',
      testDir: './playwright/prod',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
