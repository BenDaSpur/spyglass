import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { redis } from '$lib/redis';

export async function GET() {
	// Check redis cache first
	const cachedStats = await redis.get('reddit_stats');
	if (cachedStats) {
		return json(cachedStats);
	}

	// If not in cache, fetch from DB
	// Using Promise.all to run the count queries in parallel rather than sequentially
	const [subredditCount, commentCount, userCount] = await Promise.all([
		prisma.subreddit.count(),
		prisma.comment.count(),
		prisma.user.count()
	]);

	const stats = { subreddits: subredditCount, comments: commentCount, users: userCount };

	// Cache the results for 1 hour (3600 seconds)
	await redis.set('reddit_stats', stats, { ex: 3600 });

	return json(stats);
}
