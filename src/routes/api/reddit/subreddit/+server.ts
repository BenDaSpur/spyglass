import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';
import { redis } from '$lib/redis.js';
// /api/newsletter GET

export async function GET({ url }) {
	const search = url.searchParams.get('search') || '';

	if (await redis.get(`subreddits:${search}`)) {
		return json(await redis.get(`subreddits:${search}`));
	} else {
		const subreddits = await prisma.subreddit.findMany({
			where: {
				name: {
					contains: search,
					mode: 'insensitive'
				}
			}
		});
		await redis.set(`subreddits:${search}`, JSON.stringify(subreddits));
		return json(subreddits);
	}
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
