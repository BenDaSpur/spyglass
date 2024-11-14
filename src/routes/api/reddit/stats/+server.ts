import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

export async function GET() {
	const subredditCount = await prisma.subreddit.count();
	const commentCount = await prisma.comment.count();
	const userCount = await prisma.user.count();

	return json({ subreddits: subredditCount, comments: commentCount, users: userCount });
}
