import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';

// /api/newsletter GET

export async function GET({ url }) {
	const id = url.searchParams.get('id');
	const subreddit = url.searchParams.get('subreddit');
	const author = url.searchParams.get('author');
	const page = url.searchParams.get('page') || 1;
	let limit = url.searchParams.get('limit') || '25';
	limit = parseInt(limit, 10);

	if (!id && !subreddit && !author) {
		return json({ error: 'ID, subreddit, or author is required' }, { status: 400 });
	}

	const thePosts = await prisma.post.findMany({
		where: {
			id,
			subreddit: {
				name: subreddit
			}
		}
	});
	const skip = (page - 1) * limit;
	const take = parseInt(limit, 10);

	const posts = await prisma.post.findMany({
		where: {
			...(id && { id }),
			...(subreddit && { subreddit: { name: subreddit } }),
			...(author && { author: { username: author } })
		},
		skip,
		take
	});

	return json(posts);

	return json(thePost);
}

// /api/newsletter POST

export async function POST({ request }) {
	const { id, title, content, author, subreddit, permalink } = await request.json();

	console.log(id, title, content, author, subreddit, permalink);

	const key = request.headers.get('x-spyglass-key');

	if (key !== SPYGLASS_SAFETY_KEY) {
		return json({ error: 'Invalid key' }, { status: 401 });
	}

	try {
		const newPost = await prisma.post.upsert({
			where: { id },
			update: {
				title,
				content,
				author: { connect: { username: author } },
				permalink,
				subreddit: { connect: { name: subreddit } }
			},
			create: {
				id,
				title,
				content,
				author: { connect: { username: author } },
				permalink,
				subreddit: { connect: { name: subreddit } }
			}
		});
		return json(newPost);
	} catch (error) {
		console.error(error);
		return json({ error: 'Failed to create post' }, { status: 500 });
	}
}
