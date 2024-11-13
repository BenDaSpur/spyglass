import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';


export async function GET() {
    const interactions = await getSubredditInteractions();
    return json(interactions);
}


async function getSubredditInteractions() {
    // Step 1: Find all users who have commented in more than one subreddit
    const usersWithMultipleSubreddits = await prisma.comment.groupBy({
      by: ['authorName'],
      _count: {
        subredditName: true,
      },
      having: {
        subredditName: {
          _count: {
            gt: 1,
          },
        },
      },
    });
  
    const authorNames = usersWithMultipleSubreddits.map((user) => user.authorName);
  
    // Step 2: Fetch comments made by these users
    const comments = await prisma.comment.findMany({
      where: {
        authorName: {
          in: authorNames,
        },
      },
      select: {
        authorName: true,
        subredditName: true,
      },
    });
  
    // Step 3: Organize comments by user
    const userSubredditsMap: Record<string, Set<string>> = {};
  
    comments.forEach((comment) => {
      if (!userSubredditsMap[comment.authorName]) {
        userSubredditsMap[comment.authorName] = new Set();
      }
      userSubredditsMap[comment.authorName].add(comment.subredditName);
    });
  
    // Step 4: Count shared users between subreddit pairs
    const pairCounts: Record<string, number> = {};
  
    for (const subreddits of Object.values(userSubredditsMap)) {
      const subredditList = Array.from(subreddits);
      for (let i = 0; i < subredditList.length; i++) {
        for (let j = i + 1; j < subredditList.length; j++) {
          const [subA, subB] = [subredditList[i], subredditList[j]].sort();
          const key = `${subA}||${subB}`;
          pairCounts[key] = (pairCounts[key] || 0) + 1;
        }
      }
    }
  
    // Step 5: Convert the counts to an array of interactions
    const interactions = Object.entries(pairCounts)
      .map(([key, count]) => {
        const [Subreddit_A, Subreddit_B] = key.split('||');
        return {
          Subreddit_A,
          Subreddit_B,
          Shared_User_Count: count,
        };
      })
      .filter((interaction) => interaction.Shared_User_Count > 1) // Optional: filter for meaningful interactions
      .sort((a, b) => b.Shared_User_Count - a.Shared_User_Count); // Sort by shared user count
  
    return interactions;
  }