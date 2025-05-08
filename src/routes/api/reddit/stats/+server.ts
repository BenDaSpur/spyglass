import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { redis } from '$lib/redis.js';

export async function GET() {
	// Get today's date string in YYYY-MM-DD format
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	const dateString = `${yyyy}-${mm}-${dd}`;

	const cacheKey = `stats:counts:${dateString}`;

	// Try to get cached stats first
	const cachedStats = await redis.get(cacheKey);
	if (cachedStats) {
		return json(cachedStats);
	}

	// Get today's date range
	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date();
	endOfDay.setHours(23, 59, 59, 999);

	// Check if there is a statsSummary for today
	const todayStats = await prisma.statsSummary.findFirst({
		where: {
			updatedAt: {
				gte: startOfDay,
				lte: endOfDay
			}
		},
		orderBy: { updatedAt: 'desc' }
	});

	if (todayStats) {
		const stats = {
			subreddits: todayStats.totalSubreddits,
			comments: todayStats.totalComments,
			users: todayStats.totalUsers,
			posts: todayStats.totalPosts
		};
		// Cache the results for 24 hours
		await redis.set(cacheKey, stats, { ex: 60 * 60 * 24 });
		return json(stats);
	}

	// If no summary for today, calculate and cache
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

	// Create today's summary
	await prisma.statsSummary.create({
		data: {
			totalUsers: userCount,
			totalComments: commentCount,
			totalSubreddits: subredditCount,
			totalPosts: postCount
		}
	});

	return json(stats);
}
