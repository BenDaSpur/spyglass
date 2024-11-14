import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

export async function GET() {
	const subreddits = await prisma.subreddit.findMany({
		where: {
			tracking: true
		}
	});
	return json(subreddits);
}
