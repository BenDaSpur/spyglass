import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { redis } from '$lib/redis.js';

export async function GET({ url }) {
	const search = url.searchParams.get('search') || '';
	let commentCount: number;
	let uniqueAuthors;

	if (await redis.get(`subreddit-count-${search}`)) {
		commentCount = (await redis.get(`subreddit-count-${search}`)) ?? 0;
	} else {
		commentCount = await prisma.comment.count({
			where: {
				subredditName: {
					contains: search,
					mode: 'insensitive'
				}
			}
		});
		await redis.set(`subreddit-count-${search}`, commentCount);
	}

	if (await redis.get(`subreddit-authors-${search}`)) {
		uniqueAuthors = (await redis.get(`subreddit-authors-${search}`)) ?? [];
	} else {
		uniqueAuthors = await prisma.comment.groupBy({
			where: {
				subredditName: {
					contains: search,
					mode: 'insensitive'
				}
			},
			by: ['authorName']
		});
		await redis.set(`subreddit-authors-${search}`, uniqueAuthors);
	}

	return json({ comments: commentCount, authors: uniqueAuthors });
}
