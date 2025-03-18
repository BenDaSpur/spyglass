import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { redis } from '$lib/redis.js';

export async function GET({ url }) {
	const search = url.searchParams.get('search') || '';
	const dateFrom = url.searchParams.get('dateFrom') || '';
	const dateTo = url.searchParams.get('dateTo') || '';
	let commentCount: number;
	let uniqueAuthors;

	const commentCountKey = `subreddit-count-${search}-from-${dateFrom}-to-${dateTo}`;
	const authorsKey = `subreddit-authors-${search}-from-${dateFrom}-to-${dateTo}`;

	if (await redis.get(commentCountKey)) {
		commentCount = (await redis.get(commentCountKey)) ?? 0;
	} else {
		commentCount = await prisma.comment.count({
			where: {
				subredditName: {
					contains: search,
					mode: 'insensitive'
				},
				commentDate: {
					gte: dateFrom,
					lte: dateTo
				}
			}
		});
		await redis.set(commentCountKey, commentCount);
	}

	if (await redis.get(authorsKey)) {
		uniqueAuthors = (await redis.get(authorsKey)) ?? [];
	} else {
		uniqueAuthors = await prisma.comment.groupBy({
			where: {
				subredditName: {
					contains: search,
					mode: 'insensitive'
				},
				commentDate: {
					gte: dateFrom,
					lte: dateTo
				}
			},
			by: ['authorName']
		});
		await redis.set(authorsKey, uniqueAuthors);
	}

	return json({ comments: commentCount, authors: uniqueAuthors });
}
