// import { REDDIT_CLIENT_ID } from '$env/static/private';
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
	// await upsertSubredditWatch('javascript');
	const subreddits = await getWatchedSubreddits();
	for (const subreddit of subreddits) {
		console.log(subreddit);
		if (subreddit.tracking) {
			const posts = await getLatestSubredditPosts(subreddit.name);
			let postCount = 0;
			for (const post of posts) {
				postCount = postCount + 1;
				// console.log('post', post);
				// console.log(post.id);
				await upsertUser(post.author.name);
				await upsertPost(post);
				const comments = await getPostComments(post);
				let postCommentsCount = 0;
				// console.log(comments);
				for (const comment of comments) {
					postCommentsCount = postCommentsCount + 1;
					if (comment.author.name !== '[deleted]' && comment.author.name !== 'AutoModerator') {
						const userInfo = await getUserAndPosts(comment.author.name);
						await upsertUser(comment.author.name);
						let userCommentCount = 0;
						for (const userComment of userInfo.comments) {
							userCommentCount = userCommentCount + 1;
							const isAlreadyInserted = await getCommentById(userComment.id);
							if (isAlreadyInserted.length === 0) {
								// console.log(`////// ${subreddit.name} \\\\\\  ${postCount} OF ${posts.length}`)
								// console.log(`////// ${subreddit.name} postComment \\\\\\  ${postCommentsCount} OF ${comments.length}`)
								console.log(
									`////// ${subreddit.name} \\\\\ userComments ${userCommentCount} OF ${userInfo.comments.length} \\\\\\  postComment ${postCommentsCount} OF ${comments.length}`
								);
								// console.log('Inserting comment', JSON.stringify(userComment));
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
): Promise<{ user: RedditUser; comments: Comment[]; userSubmissions: Submission[] }> => {
	const user: RedditUser = await r.getUser(username);
	const [comments, userSubmissions] = await Promise.all([
		user.getComments({ limit: Infinity }),
		user.getSubmissions({ limit: Infinity })
	]);
	return { user, comments, userSubmissions };
};

const getLatestSubredditPosts = async (subredditName: string): Promise<Submission[]> => {
	const subreddit = r.getSubreddit(subredditName);
	const newSubmissions = await subreddit.getNew({ limit: 5 });
	const hotSubmissions = await subreddit.getHot({ limit: 5 });
	return [...newSubmissions, ...hotSubmissions];
};

const getCommentById = async (commentId: string) => {
	const response = await axios(`${baseUrl}/api/reddit/comment?id=${commentId}`);
	const comment = await response.data;
	return comment;
};

const getPostComments = async (submission: Submission): Promise<Comment[]> => {
	const comments = await submission.expandReplies({ limit: Infinity, depth: Infinity });
	return comments.comments;
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
	// console.log(JSON.stringify(comment));
	const response = await axios(`${baseUrl}/api/reddit/comment`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-spyglass-key': SPYGLASS_SAFETY_KEY
		},
		data: JSON.stringify(comment)
	});

	const commentData = await response.data;
	return commentData;
};

const getWatchedSubreddits = async () => {
	const response = await axios(`${baseUrl}/api/reddit/subreddit`);
	// console.log(response);
	const subreddits = await response.data;
	const shuffledSubreddits = subreddits.sort(() => Math.random() - 0.5);
	return shuffledSubreddits;
};
