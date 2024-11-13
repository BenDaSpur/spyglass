import prisma from '$lib/prisma';
import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const subredditName = url.searchParams.get('subreddit');
	const sharedUserCount = url.searchParams.get('sharedUserCount') || '50';

	if (!subredditName) {
		return json({ error: 'Please provide a subreddit name' }, { status: 400 });
	}

	const sharedCount = parseInt(sharedUserCount);
	const interactions = await getTopInteractionsFromSubreddit(subredditName, sharedCount);
	console.log(interactions);
	const sorted = interactions.sort((a, b) => b.otherSubreddit - a.otherSubreddit);
	return json(sorted);
}

async function getTopInteractionsFromSubreddit(subredditName: string, limit: number = 10) {
	const interactions = await prisma.$queryRaw<{ otherSubreddit: string; sharedUserCount: number }[]>`
      WITH target_subreddit_users AS (
        SELECT DISTINCT LOWER("authorName") AS "authorName"
        FROM "Comment"
        WHERE LOWER("subredditName") = LOWER(${subredditName})
      ),
      interactions AS (
        SELECT LOWER(c."subredditName") AS "subreddit",
               CAST(COUNT(DISTINCT LOWER(c."authorName")) AS INTEGER) AS "sharedUserCount"
        FROM "Comment" c
        JOIN target_subreddit_users tsu ON LOWER(c."authorName") = tsu."authorName"
        WHERE LOWER(c."subredditName") != LOWER(${subredditName})
        GROUP BY LOWER(c."subredditName")
      )
      SELECT *
      FROM interactions
      ORDER BY "sharedUserCount" DESC
      LIMIT ${limit};
    `;

	return interactions;
}
