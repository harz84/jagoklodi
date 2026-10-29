import { defineConfig, devices } from '@playwright/test';

/**
 * Uji end-to-end situs jagoklodi.
 * Jalankan setelah build:  npm run build && npm test
 * Server preview Astro dinyalakan otomatis dan menyajikan folder dist/.
 */
export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['list']] : 'list',
	use: {
		baseURL: 'http://localhost:4321',
		trace: 'retain-on-failure',
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: {
		command: 'npm run preview -- --port 4321 --ignore-lock',
		url: 'http://localhost:4321',
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
