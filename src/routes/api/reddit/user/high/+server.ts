import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

export async function GET() {
	const commentAuthors = await prisma.comment.groupBy({
		by: ['authorName'],
		where: {
			commentDate: {
				equals: null
			},
			author: {
				is: {
					isDeleted: false
				}
			}
		},
		_count: {
			authorName: true
		},
		orderBy: {
			_count: {
				authorName: 'desc'
			}
		},
		take: 200
	});
	return json(commentAuthors);
}
