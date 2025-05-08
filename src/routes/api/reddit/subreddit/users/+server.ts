import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { redis } from '$lib/redis.js';

export async function GET({ url }) {
	const search = url.searchParams.get('subreddit') || '';
	const dateFrom = url.searchParams.get('dateFrom') || 0;
	const dateTo = url.searchParams.get('dateTo') || new Date().toISOString();

	if (!search) {
		return json({ error: 'Subreddit is required' }, { status: 400 });
	}

	const dateFromFormatted = new Date(dateFrom).toISOString();
	const dateToFormatted = new Date(dateTo).toISOString();

	const cacheKey = `subreddits:${search}:topusers:dateFrom:${dateFromFormatted}:dateTo:${dateToFormatted}`;

	if (await redis.get(cacheKey)) {
		return json(await redis.get(cacheKey));
	} else {
		const topUsers = await prisma.comment.groupBy({
			_count: true,
			by: ['authorName'],
			where: {
				subredditName: {
					equals: search,
					mode: 'insensitive'
				},
				commentDate: {
					gte: dateFromFormatted,
					lte: dateToFormatted
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
		await redis.set(cacheKey, JSON.stringify(sortedUsers));
		return json(sortedUsers);
	}
}
