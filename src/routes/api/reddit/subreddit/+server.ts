import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';

// /api/newsletter GET

export async function GET() {
	const subreddits = await prisma.subreddit.findMany();
	return json(subreddits);
}

// /api/newsletter POST

export async function POST({ request }) {
	const { name, description, tracking } = await request.json();

	const key = request.headers.get('x-spyglass-key');

	if (key !== SPYGLASS_SAFETY_KEY) {
		return json({ error: 'Invalid key' }, { status: 401 });
	}

	const newSubreddit = await prisma.subreddit.upsert({
		where: { name },
		update: {
			description,
			tracking
		},
		create: {
			name,
			description,
			tracking
		}
	});

	return json(newSubreddit);
}
