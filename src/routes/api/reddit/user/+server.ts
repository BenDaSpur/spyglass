import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { SPYGLASS_SAFETY_KEY } from '$env/static/private';
import { redis } from '$lib/redis.js';

export async function GET({ url }) {
	const username = url.searchParams.get('username');

	if (!username) {
		if (await redis.get('users')) {
			return json(await redis.get('users'));
		} else {
			await redis.set('users', JSON.stringify(await prisma.user.findMany()));
			return json(await redis.get('users'));
		}
	}

	const lowercaseUsername = username.toLowerCase();
	// await redis.del(`users:${lowercaseUsername}`);
	if (await redis.get(`users:${lowercaseUsername}`)) {
		console.log('Cache hit users:', lowercaseUsername);
		return json(await redis.get(`users:${lowercaseUsername}`));
	} else {
		const user = await prisma.user.findFirst({
			where: {
				username: {
					mode: 'insensitive',
					startsWith: lowercaseUsername
				}
			},
			include: {
				posts: true,
				comments: {
					select: {
						id: true,
						authorName: true,
						content: true,
						subredditName: true,
						commentDate: true,
						permalink: true,
						bodyHtml: true
					}
				}
			}
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}
		const userData = JSON.stringify(user);
		if (userData.length <= 512000) {
			// 500 KB limit
			await redis.set(`users:${lowercaseUsername}`, userData);
		}

		return json(user);
	}
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
