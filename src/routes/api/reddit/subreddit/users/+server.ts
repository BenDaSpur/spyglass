import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';
import { redis } from '$lib/redis.js';
// /api/newsletter GET

export async function GET({ url }) {
	const search = url.searchParams.get('subreddit') || '';

	if (!search) {
		return json({ error: 'Subreddit is required' }, { status: 400 });
	}
	// await redis.del(`subreddits:${search}:topusers`);
	if (await redis.get(`subreddits:${search}:topusers`)) {
		return json(await redis.get(`subreddits:${search}:topusers`));
	} else {
		const topUsers = await prisma.comment.groupBy({
			_count: true,
			by: ['authorName'],
			where: {
				subredditName: {
					equals: search,
					mode: 'insensitive'
				}
			},
			orderBy: {
				_count: {
					authorName: 'desc'
				}
			},
			take: 50
		});
		const sortedUsers = topUsers.map((user) => ({
			authorName: user.authorName,
			commentCount: user._count
		}));
		await redis.set(`subreddits:${search}:topusers`, JSON.stringify(sortedUsers));
		return json(sortedUsers);
	}
}
