import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

export async function GET() {
	// Using Promise.all to run the count queries in parallel rather than sequentially
	const [subredditCount, commentCount, userCount] = await Promise.all([
		prisma.subreddit.count(),
		prisma.comment.count(),
		prisma.user.count()
	]);

	return json({ subreddits: subredditCount, comments: commentCount, users: userCount });
}
