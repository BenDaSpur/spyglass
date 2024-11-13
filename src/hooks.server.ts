import { run } from '$lib/cron';
import type { Handle } from '@sveltejs/kit';
import cron from 'node-cron';

cron.schedule('0 * * * *', () => {
	run();
});

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	return response;
};
