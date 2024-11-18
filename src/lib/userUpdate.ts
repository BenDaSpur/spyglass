import snoowrap from 'snoowrap';
import axios from 'axios';
import 'dotenv/config';

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD;
const REDDIT_USERNAME = process.env.REDDIT_USERNAME;
const SPYGLASS_SAFETY_KEY = process.env.SPYGLASS_SAFETY_KEY;

// const baseUrl = NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://spyglass-gamma.vercel.app';
const baseUrl = 'http://localhost:5173';

const r = new snoowrap({
	userAgent: 'my-user-agent',
	clientId: REDDIT_CLIENT_ID,
	clientSecret: REDDIT_CLIENT_SECRET,
	username: REDDIT_USERNAME,
	password: REDDIT_PASSWORD
});

const getUsers = async () => {
	const users = await axios.get(`${baseUrl}/api/reddit/user/high`, {
		headers: {
			'x-spyglass-key': SPYGLASS_SAFETY_KEY
		}
	});
	const randomizedUsers = users.data.sort(() => Math.random() - 0.5);
	return randomizedUsers;
};

const upsertComment = async (comment) => {
	try {
		const response = await axios(`${baseUrl}/api/reddit/comment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-spyglass-key': SPYGLASS_SAFETY_KEY
			},
			data: JSON.stringify({
				author: comment.authorName,
				body_html: comment.bodyHtml,
				body: comment.content,
				link_id: comment.id,
				subreddit: comment.subredditName,
				permalink: comment.permalink,
				created_utc: comment.created_utc
			})
		});

		const commentData = response.data;
		// console.log(commentData);
		return commentData;
	} catch (error) {
		console.error(error);
	}
};

const getUsersData = async (username: string) => {
	const user = await axios.get(`${baseUrl}/api/reddit/user?username=${username}`, {
		headers: {
			'x-spyglass-key': SPYGLASS_SAFETY_KEY
		}
	});
	return user.data;
};

const getCommentMetadata = async (comment: string) => {
	const response = await axios.get(`https://reddit.com/api/info.json?id=${comment}`);
	if (response.data.data.children[0].data.created_utc) {
		return response.data.data.children[0].data.created_utc;
	}
	return null;
};

const getUserFromReddit = async (username: string) => {
	try {
		const rUser = await r.getUser(username);
		return rUser;
	} catch (error) {
		console.error(error);
		return null;
	}
};

const getCommentsFromUserReddit = async (rUser) => {
	try {
		const comments = await rUser.getComments({ limit: Infinity });
		return comments;
	} catch (error) {
		console.error(error);
		return [];
	}
};

export async function start() {
	const users = await getUsers();
	for (const user of users) {
		const userData = await getUsersData(user.authorName);
		console.log('got user from db');
		const rUser = await getUserFromReddit(user.authorName);
		if (!rUser) {
			console.log('User not found on Reddit:', user.authorName);
			continue;
		}
		const comments = await getCommentsFromUserReddit(rUser);
		console.log('Checking user:', user.authorName);

		if (comments.length === 0) {
			console.log('No comments found for user:', user.authorName);
			continue;
		}

		// console.log(userData);
		for (const comment of comments) {
			// console.log('Checking comment:', comment.id);
			const matchingComment = userData.comments.find((c) => c.id === comment.link_id);
			if (matchingComment) {
				if (!matchingComment.commentDate) {
					// console.log('Updating comment:', comment.id);
					await upsertComment({ ...matchingComment, created_utc: comment.created_utc });
				}
			}
		}
		console.log('Finished checking user:', user.authorName);
	}
}

// start();
