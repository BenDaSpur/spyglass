import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';

export async function GET({ url }) {
	const username = url.searchParams.get('username');

	if (!username) {
		return json(await prisma.user.findMany());
	}
	const user = await prisma.user.findFirstOrThrow({
		where: {
			username: {
				mode: 'insensitive',
				startsWith: username
			}
		},
		include: {
			posts: true,
			comments: true
		}
	});

	return json(user);
}

export async function POST({ request }) {
	const { username } = await request.json();

	const key = request.headers.get('x-spyglass-key');

	if (key !== SPYGLASS_SAFETY_KEY) {
		return json({ error: 'Invalid key' }, { status: 401 });
	}

	const user = await prisma.user.upsert({
		where: { username: username },
		update: { username: username },
		create: { username: username }
	});

	return json(user);
}
