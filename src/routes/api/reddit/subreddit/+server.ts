import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';

// /api/newsletter GET

export async function GET({ url }) {
	const search = url.searchParams.get('search') || '';

	const subreddits = await prisma.subreddit.findMany({
		where: {
			name: {
				contains: search,
				mode: 'insensitive'
			}
		}
	});
	return json(subreddits);
}

// /api/newsletter POST

export async function POST({ request }) {
	const { name, description, tracking } = await request.json();

	const key = request.headers.get('x-spyglass-key');

	if (key !== SPYGLASS_SAFETY_KEY) {
		return json({ error: 'Invalid key' }, { status: 401 });
	}

	const newSubreddit = await prisma.subreddit.upsert({
		where: { name },
		update: {
			description,
			tracking
		},
		create: {
			name,
			description,
			tracking
		}
	});

	return json(newSubreddit);
}

async function getSubreddits() {
	// First, get the interactions
	const interactions = await getSubredditInteractions();

	// Use a Set to collect unique subreddit names
	const subredditSet = new Set<string>();

	interactions.forEach((interaction) => {
		subredditSet.add(interaction.Subreddit_A);
		subredditSet.add(interaction.Subreddit_B);
	});

	// Convert the Set to an array
	const subredditNames = Array.from(subredditSet);

	return subredditNames;
}
