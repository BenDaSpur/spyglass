import prisma from '$lib/prisma';
import { json } from '@sveltejs/kit';
import { redis } from '$lib/redis.js';

export async function GET({ url }) {
	const subredditName = url.searchParams.get('subreddit');
	const sharedUserCount = url.searchParams.get('sharedUserCount') || '50';
	const dateFrom = url.searchParams.get('dateFrom') || 0;
	const dateTo = url.searchParams.get('dateTo') || new Date().toISOString();

	if (!subredditName) {
		return json({ error: 'Please provide a subreddit name' }, { status: 400 });
	}

	const sharedCount = parseInt(sharedUserCount);

	const dateFromFormatted = new Date(dateFrom).toISOString();
	const dateToFormatted = new Date(dateTo).toISOString();

	console.log(dateFromFormatted, dateToFormatted);

	const redisCache = `subredditInteractions:${subredditName}:${sharedCount}:dateFrom:${dateFromFormatted}:dateTo:${dateToFormatted}`;

	// await redis.del(redisCache);
	if (await redis.get(redisCache)) {
		return json(await redis.get(redisCache));
	} else {
		const interactions = await getTopInteractionsFromSubreddit(
			subredditName,
			sharedCount,
			dateFromFormatted,
			dateToFormatted
		);
		const sorted = interactions.sort((a, b) => b.sharedUserCount - a.sharedUserCount);
		await redis.set(redisCache, JSON.stringify(sorted));
		return json(sorted);
	}
}

async function getTopInteractionsFromSubreddit(
	subredditName: string,
	limit: number = 10,
	dateFrom: string,
	dateTo: string
) {
	const interactions = await prisma.$queryRaw<{ subreddit: string; sharedUserCount: number }[]>`
    WITH target_subreddit_users AS (
      SELECT DISTINCT LOWER("authorName") AS "authorName"
      FROM "Comment"
      WHERE LOWER("subredditName") = LOWER(${subredditName})
        AND "commentDate" BETWEEN ${dateFrom}::timestamp AND ${dateTo}::timestamp
    ),
    interactions AS (
      SELECT 
        LOWER(c."subredditName") AS "subreddit",
        COUNT(DISTINCT LOWER(c."authorName"))::INTEGER AS "sharedUserCount"
      FROM "Comment" c
      INNER JOIN target_subreddit_users tsu ON LOWER(c."authorName") = tsu."authorName"
      WHERE LOWER(c."subredditName") != LOWER(${subredditName})
        AND c."commentDate" BETWEEN ${dateFrom}::timestamp AND ${dateTo}::timestamp
      GROUP BY LOWER(c."subredditName")
      HAVING COUNT(DISTINCT LOWER(c."authorName")) > 1  -- Only include subreddits with meaningful interaction
    )
    SELECT *
    FROM interactions
    ORDER BY "sharedUserCount" DESC
    LIMIT ${limit};
  `;

	console.log(interactions);

	return interactions;
}
