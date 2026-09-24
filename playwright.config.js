import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173/', locale: 'en-US' },
  webServer: { command: 'node tools/serve.mjs 4173', url: 'http://localhost:4173/', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 5'] } },
    { name: 'small phone', use: { ...devices['iPhone SE'], browserName: 'chromium' } },
  ],
});
