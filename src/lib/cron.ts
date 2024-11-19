import snoowrap, { type RedditUser, type Submission, type Comment } from 'snoowrap';
import axios from 'axios';
import {
	REDDIT_CLIENT_ID,
	REDDIT_CLIENT_SECRET,
	REDDIT_PASSWORD,
	REDDIT_USERNAME,
	SPYGLASS_SAFETY_KEY,
	NODE_ENV
} from '$env/static/private';

const baseUrl = NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://spyglass-gamma.vercel.app';

const r = new snoowrap({
	userAgent: 'Node.js script for subreddit analysis',
	clientId: REDDIT_CLIENT_ID,
	clientSecret: REDDIT_CLIENT_SECRET,
	username: REDDIT_USERNAME,
	password: REDDIT_PASSWORD
});

export default async function run() {
	console.log('BASE URL::::', baseUrl);
	const subreddits = await getWatchedSubreddits();
	for (const subreddit of subreddits) {
		console.log(subreddit);
		if (subreddit.tracking) {
			const posts = await getLatestSubredditPosts(subreddit.name);
			let postCount = 0;
			for (const post of posts) {
				postCount = postCount + 1;
				await upsertUser(post.author.name);
				await upsertPost(post);
				const comments = await getPostComments(post);
				let postCommentsCount = 0;
				for (const comment of comments) {
					postCommentsCount = postCommentsCount + 1;
					if (comment.author.name !== '[deleted]' && comment.author.name !== 'AutoModerator') {
						const userInfo = await getUserAndPosts(comment.author.name);
						await upsertUser(comment.author.name);
						let userCommentCount = 0;
						for (const userComment of userInfo.comments) {
							userCommentCount = userCommentCount + 1;
							const isAlreadyInserted = await getCommentById(userComment.id);
							if (!isAlreadyInserted) {
								console.log(
									`////// ${subreddit.name} \\\\ userComments ${userCommentCount} OF ${userInfo.comments.length} \\\\\\  postComment ${postCommentsCount} OF ${comments.length}`
								);
								await upsertSubreddit(
									userComment.subreddit.display_name,
									subreddits.some((s) => s.name === userComment.subreddit.display_name && s.tracking)
								);
								await upsertComment(userComment);
							}
						}
						await upsertUser(comment.author.name);
					}
				}
			}
		}
	}
}

const getUserAndPosts = async (
	username: string
): Promise<{
	user: RedditUser | null;
	comments: Comment[];
	userSubmissions: Submission[];
}> => {
	try {
		const user: RedditUser = await r.getUser(username);
		const [comments, userSubmissions] = await Promise.all([
			user.getComments({ limit: Infinity }),
			user.getSubmissions({ limit: Infinity })
		]);
		return { user, comments, userSubmissions };
	} catch (error) {
		if (error.statusCode === 429) {
			console.log('Received 429 error when fetching user data for', username);
		} else {
			console.error('Error fetching user data for', username, error);
		}
		return { user: null, comments: [], userSubmissions: [] };
	}
};

const getLatestSubredditPosts = async (subredditName: string): Promise<Submission[]> => {
	try {
		const subreddit = r.getSubreddit(subredditName);
		const newSubmissions = await subreddit.getNew({ limit: 5 });

		let hotSubmissions: Submission[] = [];
		if (Math.random() <= 0.2) {
			hotSubmissions = await subreddit.getHot({ limit: 5 });
		}
		const allSubmissions = [...newSubmissions, ...hotSubmissions];
		const shuffledSubmissions = allSubmissions.sort(() => Math.random() - 0.5);
		return shuffledSubmissions;
	} catch (error) {
		if (error.statusCode === 429) {
			console.log('Received 429 error when fetching posts for subreddit', subredditName);
		} else {
			console.error('Error fetching posts for subreddit', subredditName, error);
		}
		return [];
	}
};

const getCommentById = async (commentId: string) => {
	const response = await axios(`${baseUrl}/api/reddit/comment?id=${commentId}`);
	const comment = await response.data;
	return comment;
};

const getPostComments = async (submission: Submission): Promise<Comment[]> => {
	try {
		const comments = await submission.expandReplies({
			limit: Infinity,
			depth: Infinity
		});
		return comments.comments;
	} catch (error) {
		if (error.statusCode === 429) {
			console.log('Received 429 error when fetching comments for submission', submission.id);
		} else {
			console.error('Error fetching comments for submission', submission.id, error);
		}
		return [];
	}
};

const upsertUser = async (user: string) => {
	const response = await axios(`${baseUrl}/api/reddit/user`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-spyglass-key': SPYGLASS_SAFETY_KEY
		},
		data: JSON.stringify({ username: user })
	});
	const userData = response.data;
	return userData;
};

const upsertSubreddit = async (subreddit: string, tracking = false) => {
	const response = await axios(`${baseUrl}/api/reddit/subreddit`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-spyglass-key': SPYGLASS_SAFETY_KEY
		},
		data: JSON.stringify({ name: subreddit, description: 'testing', tracking })
	});
	const subredditData = await response.data;
	return subredditData;
};

const upsertPost = async (submission: Submission) => {
	const response = await axios(`${baseUrl}/api/reddit/post`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-spyglass-key': SPYGLASS_SAFETY_KEY
		},
		data: JSON.stringify({
			id: submission.id,
			title: submission.title,
			content: submission.selftext,
			author: submission.author.name,
			permalink: submission.permalink,
			subreddit: submission.subreddit.display_name
		})
	});

	const postData = await response.data;
	return postData;
};

const upsertComment = async (comment: Comment) => {
	const theComment = comment;

	theComment.commentDate = comment.created_utc;
	const response = await axios(`${baseUrl}/api/reddit/comment`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-spyglass-key': SPYGLASS_SAFETY_KEY
		},
		data: JSON.stringify(theComment)
	});

	const commentData = await response.data;
	return commentData;
};

const getWatchedSubreddits = async () => {
	const response = await axios(`${baseUrl}/api/reddit/subreddit/watched`);
	const subreddits = await response.data;
	const shuffledSubreddits = subreddits.sort(() => Math.random() - 0.5);
	return shuffledSubreddits;
};
