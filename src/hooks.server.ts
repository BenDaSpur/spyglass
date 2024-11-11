import * as scripty from '$lib/cron';
import type { Handle } from '@sveltejs/kit';
import cron from 'node-cron';

// cron.schedule('0 * * * *', () => {
// 	scripty.run();
// });

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	return response;
};
