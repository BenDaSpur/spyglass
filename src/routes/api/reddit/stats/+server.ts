import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { redis } from '$lib/redis.js';

// Function to update the stats summary
async function updateStatsSummary() {
	const [subredditCount, commentCount, userCount, postCount] = await Promise.all([
		prisma.subreddit.count(),
		prisma.comment.count(),
		prisma.user.count({ where: { isDeleted: false } }),
		prisma.post.count()
	]);

	await prisma.statsSummary.create({
		data: {
			totalUsers: userCount,
			totalComments: commentCount,
			totalSubreddits: subredditCount,
			totalPosts: postCount
		}
	});
}

export async function GET() {
	const cacheKey = 'stats:counts';

	// Try to get cached stats first
	const cachedStats = await redis.get(cacheKey);
	if (cachedStats) {
		return json(cachedStats);
	}

	// Get the latest stats from the summary table
	const latestStats = await prisma.statsSummary.findFirst({
		orderBy: { updatedAt: 'desc' }
	});

	if (latestStats) {
		const stats = {
			subreddits: latestStats.totalSubreddits,
			comments: latestStats.totalComments,
			users: latestStats.totalUsers,
			posts: latestStats.totalPosts
		};

		// Cache the results for 24 hours
		await redis.set(cacheKey, stats, { ex: 60 * 60 * 24 });
		return json(stats);
	}

	// If no summary exists, calculate and cache
	const [subredditCount, commentCount, userCount, postCount] = await Promise.all([
		prisma.subreddit.count(),
		prisma.comment.count(),
		prisma.user.count({ where: { isDeleted: false } }),
		prisma.post.count()
	]);

	const stats = {
		subreddits: subredditCount,
		comments: commentCount,
		users: userCount,
		posts: postCount
	};

	// Cache the results for 24 hours
	await redis.set(cacheKey, stats, { ex: 60 * 60 * 24 });

	// Create initial summary
	await updateStatsSummary();

	return json(stats);
}
