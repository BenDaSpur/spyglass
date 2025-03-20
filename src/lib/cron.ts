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

// Add rate limiting and concurrency control
import pLimit from 'p-limit';

const baseUrl = NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://spyglass-gamma.vercel.app';

// Simple logging function with timestamps
const log = (message: string, ...args: unknown[]) => {
	console.log(`${message}`, ...args);
};

const r = new snoowrap({
	userAgent: 'Node.js script for subreddit analysis',
	clientId: REDDIT_CLIENT_ID,
	clientSecret: REDDIT_CLIENT_SECRET,
	username: REDDIT_USERNAME,
	password: REDDIT_PASSWORD
});

// Set up concurrency limits
const subredditLimit = pLimit(3); // Process 3 subreddits at a time
const postLimit = pLimit(5); // Process 5 posts at a time
const commentLimit = pLimit(10); // Process 10 comments at a time

// Define types to fix linter errors
interface SubredditData {
	name: string;
	tracking: boolean;
	description?: string;
}

export default async function run() {
	const startTime = Date.now();
	log('Starting Reddit data collection job');
	log('BASE URL:', baseUrl);

	// Reset counters for this run
	apiCallCount = 0;
	cacheHits = 0;

	const subreddits = await getWatchedSubreddits();
	log(`Found ${subreddits.length} subreddits to process`);

	let processedSubreddits = 0;
	let processedPosts = 0;
	let processedComments = 0;
	let processedUserComments = 0;

	// Process subreddits concurrently with limits
	await Promise.all(
		subreddits.map((subreddit) =>
			subredditLimit(async () => {
				const subredditStartTime = Date.now();
				log(`Processing subreddit: ${subreddit.name} (${++processedSubreddits}/${subreddits.length})`);

				if (subreddit.tracking) {
					const posts = await getLatestSubredditPosts(subreddit.name);
					log(`Found ${posts.length} posts in r/${subreddit.name}`);

					// Process posts concurrently with limits
					await Promise.all(
						posts.map((post) =>
							postLimit(async () => {
								const postStartTime = Date.now();
								log(`Processing post: ${post.id} in r/${subreddit.name} (${++processedPosts} total posts)`);

								await upsertUser(post.author.name);
								await upsertPost(post);

								const comments = await getPostComments(post);
								log(`Found ${comments.length} comments in post ${post.id}`);

								// Filter out deleted and AutoModerator comments first
								const validComments = comments.filter(
									(comment) => comment.author?.name !== '[deleted]' && comment.author?.name !== 'AutoModerator'
								);
								log(`${validComments.length} valid comments after filtering in post ${post.id}`);

								// Process comments concurrently with limits
								await Promise.all(
									validComments.map((comment) =>
										commentLimit(async () => {
											const commentStartTime = Date.now();
											log(
												`Processing comment: ${comment.id} by ${comment.author.name} (${++processedComments} total comments)`
											);

											await upsertUser(comment.author.name);
											log(`Fetching user history for: ${comment.author.name}`);
											const userInfo = await getUserAndPosts(comment.author.name);
											log(`Found ${userInfo.comments.length} comments in user history for ${comment.author.name}`);

											// Pre-filter comments that need to be inserted
											const commentPromises = [];
											let newCommentsCount = 0;

											for (const userComment of userInfo.comments) {
												const isAlreadyInserted = await getCommentById(userComment.id);
												if (!isAlreadyInserted) {
													newCommentsCount++;
													commentPromises.push(
														(async () => {
															await upsertSubreddit(
																userComment.subreddit.display_name,
																subreddits.some(
																	(s: SubredditData) => s.name === userComment.subreddit.display_name && s.tracking
																)
															);
															await upsertComment(userComment);
															processedUserComments++;
														})()
													);
												}
											}

											log(`Found ${newCommentsCount} new comments to insert for user ${comment.author.name}`);

											// Process comment inserts in smaller batches
											const batchSize = 5;
											for (let i = 0; i < commentPromises.length; i += batchSize) {
												const batch = commentPromises.slice(i, i + batchSize);
												log(
													`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(commentPromises.length / batchSize)} for user ${comment.author.name}`
												);
												await Promise.all(batch);
											}

											const commentDuration = Date.now() - commentStartTime;
											log(`Finished processing comment ${comment.id} in ${commentDuration}ms`);
										})
									)
								);

								const postDuration = Date.now() - postStartTime;
								log(`Finished processing post ${post.id} in ${postDuration}ms`);
							})
						)
					);
				}

				const subredditDuration = Date.now() - subredditStartTime;
				log(`Finished processing subreddit ${subreddit.name} in ${subredditDuration}ms`);
			})
		)
	);

	const totalDuration = Date.now() - startTime;
	log(`Job completed in ${totalDuration}ms`);
	log(`Processed ${processedSubreddits} subreddits, ${processedPosts} posts, ${processedComments} comments`);
	log(`Inserted ${processedUserComments} user comments`);
	log(
		`API calls: ${apiCallCount}, Cache hits: ${cacheHits}, API efficiency: ${Math.round((cacheHits / (apiCallCount + cacheHits)) * 100)}%`
	);
}

interface UserData {
	user: RedditUser | null;
	comments: Comment[];
	userSubmissions: Submission[];
}

const getUserAndPosts = async (username: string): Promise<UserData> => {
	const startTime = Date.now();
	try {
		log(`Fetching data for user: ${username}`);
		const user: RedditUser = await r.getUser(username);

		log(`Fetching comments and submissions for user: ${username}`);
		const [comments, userSubmissions] = await Promise.all([
			user.getComments({ limit: 100 }), // Reduced from Infinity to improve performance
			user.getSubmissions({ limit: 100 }) // Reduced from Infinity to improve performance
		]);

		const duration = Date.now() - startTime;
		log(
			`Fetched ${comments.length} comments and ${userSubmissions.length} submissions for user ${username} in ${duration}ms`
		);

		return { user, comments, userSubmissions };
	} catch (error: unknown) {
		const typedError = error as { statusCode?: number };
		if (typedError.statusCode === 429) {
			log(`Received 429 error when fetching user data for ${username} - Rate limited!`);
		} else {
			log(`Error fetching user data for ${username}`, error);
		}
		return { user: null, comments: [], userSubmissions: [] };
	}
};

const getLatestSubredditPosts = async (subredditName: string): Promise<Submission[]> => {
	const startTime = Date.now();
	try {
		log(`Fetching posts for subreddit: ${subredditName}`);
		const subreddit = r.getSubreddit(subredditName);

		log(`Fetching new posts for r/${subredditName}`);
		const newSubmissions = await subreddit.getNew({ limit: 5 });
		log(`Found ${newSubmissions.length} new posts in r/${subredditName}`);

		let hotSubmissions: Submission[] = [];
		if (Math.random() <= 0.2) {
			log(`Also fetching hot posts for r/${subredditName}`);
			hotSubmissions = await subreddit.getHot({ limit: 5 });
			log(`Found ${hotSubmissions.length} hot posts in r/${subredditName}`);
		}

		const allSubmissions = [...newSubmissions, ...hotSubmissions];
		const shuffledSubmissions = allSubmissions.sort(() => Math.random() - 0.5);

		const duration = Date.now() - startTime;
		log(`Fetched ${shuffledSubmissions.length} total posts for r/${subredditName} in ${duration}ms`);

		return shuffledSubmissions;
	} catch (error: unknown) {
		const typedError = error as { statusCode?: number };
		if (typedError.statusCode === 429) {
			log(`Received 429 error when fetching posts for subreddit ${subredditName} - Rate limited!`);
		} else {
			log(`Error fetching posts for subreddit ${subredditName}`, error);
		}
		return [];
	}
};

const getCommentById = async (commentId: string) => {
	try {
		const response = await axios(`${baseUrl}/api/reddit/comment?id=${commentId}`);
		const comment = await response.data;
		return comment;
	} catch (error) {
		log(`Error checking if comment ${commentId} exists`, error);
		return null;
	}
};

const getPostComments = async (submission: Submission): Promise<Comment[]> => {
	const startTime = Date.now();
	try {
		log(`Fetching comments for post: ${submission.id} (${submission.title})`);
		const comments = await submission.expandReplies({
			limit: 100, // Limit to 100 comments per post
			depth: 5 // Limit depth to 5 levels
		});

		const duration = Date.now() - startTime;
		log(`Fetched ${comments.comments.length} comments for post ${submission.id} in ${duration}ms`);

		return comments.comments;
	} catch (error: unknown) {
		const typedError = error as { statusCode?: number };
		if (typedError.statusCode === 429) {
			log(`Received 429 error when fetching comments for submission ${submission.id} - Rate limited!`);
		} else {
			log(`Error fetching comments for submission ${submission.id}`, error);
		}
		return [];
	}
};

// Tracking API calls
let apiCallCount = 0;
let cacheHits = 0;

// Cache subreddits to reduce API calls
type SubredditCacheData = Record<string, unknown>;
const subredditCache = new Map<string, SubredditCacheData>();

const upsertUser = async (user: string) => {
	apiCallCount++;
	try {
		log(`Upserting user: ${user}`);
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
	} catch (error) {
		log(`Error upserting user ${user}`, error);
		throw error;
	}
};

const upsertSubreddit = async (subreddit: string, tracking = false) => {
	// Check cache first
	if (subredditCache.has(subreddit)) {
		cacheHits++;
		log(`Cache hit for subreddit: ${subreddit}`);
		return subredditCache.get(subreddit);
	}

	apiCallCount++;
	try {
		log(`Upserting subreddit: ${subreddit} (tracking: ${tracking})`);
		const response = await axios(`${baseUrl}/api/reddit/subreddit`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-spyglass-key': SPYGLASS_SAFETY_KEY
			},
			data: JSON.stringify({ name: subreddit, description: 'testing', tracking })
		});
		const subredditData = await response.data;

		// Store in cache
		subredditCache.set(subreddit, subredditData);
		log(`Cached subreddit: ${subreddit}`);
		return subredditData;
	} catch (error) {
		log(`Error upserting subreddit ${subreddit}`, error);
		throw error;
	}
};

const upsertPost = async (submission: Submission) => {
	apiCallCount++;
	try {
		log(`Upserting post: ${submission.id} (${submission.title})`);
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
	} catch (error) {
		log(`Error upserting post ${submission.id}`, error);
		throw error;
	}
};

// Extend Comment interface to include the properties we need
interface ExtendedComment extends Comment {
	commentDate?: number;
}

const upsertComment = async (comment: Comment) => {
	apiCallCount++;
	try {
		log(`Upserting comment: ${comment.id}`);
		const theComment = comment as ExtendedComment;
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
	} catch (error) {
		log(`Error upserting comment ${comment.id}`, error);
		throw error;
	}
};

// Cache for subreddits to reduce API calls
let cachedSubreddits: SubredditData[] = [];
let subredditCacheTime = 0;

const getWatchedSubreddits = async (): Promise<SubredditData[]> => {
	// Use cached version if it's less than 5 minutes old
	const now = Date.now();
	if (cachedSubreddits.length > 0 && now - subredditCacheTime < 5 * 60 * 1000) {
		cacheHits++;
		log(`Using cached watched subreddits list (${cachedSubreddits.length} subreddits)`);
		return cachedSubreddits;
	}

	apiCallCount++;
	try {
		log('Fetching watched subreddits');
		const response = await axios(`${baseUrl}/api/reddit/subreddit/watched`);
		const subreddits = await response.data;
		log(`Found ${subreddits.length} watched subreddits`);

		const shuffledSubreddits = subreddits.sort(() => Math.random() - 0.5);

		// Update cache
		cachedSubreddits = shuffledSubreddits;
		subredditCacheTime = now;
		log('Updated subreddits cache');

		return shuffledSubreddits;
	} catch (error) {
		log('Error fetching watched subreddits', error);
		throw error;
	}
};
