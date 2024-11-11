import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';
// /api/newsletter GET

export async function GET({ url }) {
	// return comment matching the id
	const id = url.searchParams.get('id');

	if (!id) {
		return json({ error: 'ID is required' }, { status: 400 });
	}
	const theComment = await prisma.comment.findMany({
		where: {
			id
		}
	});

	return json(theComment);
}

// /api/newsletter POST

export async function POST({ request }) {
	const { author, body_html, body, link_id, subreddit, permalink } = await request.json();
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
			subredditName: subreddit
		},
		create: {
			id: link_id,
			authorName: author,
			bodyHtml: body_html,
			content: body,
			permalink,
			subredditName: subreddit
		}
	});

	return json(updatedComment);
}
