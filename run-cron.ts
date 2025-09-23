#!/usr/bin/env npx tsx
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

// Set up the environment variables as expected by the cron module
process.env.REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || '';
process.env.REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';
process.env.REDDIT_USERNAME = process.env.REDDIT_USERNAME || '';
process.env.REDDIT_PASSWORD = process.env.REDDIT_PASSWORD || '';
process.env.SPYGLASS_SAFETY_KEY = process.env.SPYGLASS_SAFETY_KEY || '';
// Default to production for standalone script unless explicitly set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Dynamic import to ensure env vars are set before module loads
async function runCron() {
  try {
    console.log('Starting cron job...');
    console.log('Environment:', process.env.NODE_ENV);

    // Import and run the cron function
    const cronModule = await import('./src/lib/cron.js');
    await cronModule.default();

    console.log('Cron job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running cron job:', error);
    process.exit(1);
  }
}

runCron();