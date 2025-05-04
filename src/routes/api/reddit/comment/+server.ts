import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';
import { epochToIso8601 } from '$lib/utils';
// /api/newsletter GET

export async function GET({ url }) {
	// return comment matching the id
	const id = url.searchParams.get('id');

	if (!id) {
		return json({ error: 'ID is required' }, { status: 400 });
	}
	const theComment = await prisma.comment.findFirst({
		where: {
			id
		}
	});

	return json(theComment);
}

// /api/newsletter POST

export async function POST({ request }) {
	try {
		const { author, body_html, body, link_id, subreddit, permalink, created_utc, id } = await request.json();
		const key = request.headers.get('x-spyglass-key');

		if (key !== SPYGLASS_SAFETY_KEY) {
			return json({ error: 'Invalid key' }, { status: 401 });
		}

		const updatedComment = await prisma.comment.upsert({
			where: { id: link_id },
			update: {
				authorName: author,
				bodyHtml: body_html,
				content: body,
				subredditName: subreddit,
				commentDate: created_utc ? epochToIso8601(created_utc) : undefined
			},
			create: {
				id: link_id,
				authorName: author,
				bodyHtml: body_html,
				content: body,
				permalink,
				subredditName: subreddit,
				commentDate: created_utc ? epochToIso8601(created_utc) : undefined
			}
		});

		return json(updatedComment);
	} catch (error) {
		console.error('Error processing comment:', error);
		return json({ error: 'Failed to process comment' }, { status: 500 });
	}
}
