import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

export async function GET({ url }) {
	const search = url.searchParams.get('search') || '';

	const commentCount = await prisma.comment.count({
		where: {
			subredditName: {
				contains: search,
				mode: 'insensitive'
			}
		}
	});

	const uniqueAuthors = await prisma.comment.groupBy({
		where: {
			subredditName: {
				contains: search,
				mode: 'insensitive'
			}
		},
		by: ['authorName']
	});

	return json({ comments: commentCount, authors: uniqueAuthors });
}
