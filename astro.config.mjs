import { defineConfig } from 'astro/config';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL || 'https://kasavu-journeys.optionx-prem-7508.chatgpt.site',
  trailingSlash: 'always',
});
