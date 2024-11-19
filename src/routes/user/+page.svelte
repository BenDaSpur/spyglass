<script lang="ts">
	import { onMount } from 'svelte';
	import { Row, Col, Input, Spinner } from '@sveltestrap/sveltestrap';
	import Accordion from '$lib/components/Accordion.svelte';

	type User = {
		username: string;
		comments: Comment[];
		posts: Post[];
	};

	type Post = {
		id: string;
		title: string;
		content: string;
		authorId: string;
		subredditName: string;
		permalink: string;
	};

	type Comment = {
		id: string;
		authorName: string;
		content: string;
		subredditName: string;
		commentDate: string;
		permalink: string;
		bodyHtml: string;
	};

	let debounceTimeout: ReturnType<typeof setTimeout>;
	const debounceDelay = 1000;

	let userInput = '';
	let singleUser: User | null = null; // Initialize as null
	let accordionData: {
		subredditName: string;
		comments: Comment[];
	}[] = []; // Initialize as an empty array
	let allUsers: User[] = [];
	let isLoading = false;
	let viewMostPopular = true;

	// Fetch all users on mount
	onMount(async () => {
		userInput = new URLSearchParams(location.search).get('name') || '';
		if (userInput) {
			getUserHistory(userInput);
		}
		allUsers = await getAllUsers();
	});

	async function getAllUsers() {
		const response = await fetch(`/api/reddit/user`);
		return await response.json();
	}

	// Debounced function to fetch user data
	function getUserHistory(theuser: string) {
		userInput = theuser;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			const inputValue = theuser.trim();
			if (!inputValue) {
				singleUser = null;
				accordionData = [];
				return;
			}
			isLoading = true;

			try {
				const response = await fetch(`/api/reddit/user?username=${inputValue}`);
				const data = await response.json();
				singleUser = data;
				accordionData = formatAccordionData(singleUser);
			} catch (error) {
				console.error(error);
				singleUser = null;
				accordionData = [];
			} finally {
				isLoading = false;
			}
		}, debounceDelay);
	}

	function formatAccordionData(user: User) {
		if (!user || !user.comments) {
			return [];
		}

		const subreddits = user.comments.reduce(
			(acc, comment) => {
				const existingSubreddit = acc.find((sub) => sub.subredditName === comment.subredditName);
				if (existingSubreddit) {
					existingSubreddit.comments.push(comment);
				} else {
					acc.push({
						subredditName: comment.subredditName,
						comments: [comment]
					});
				}
				return acc;
			},
			[] as { subredditName: string; comments: Comment[] }[]
		);

		// Sort subreddits by the number of comments, from biggest to smallest
		subreddits.sort((a, b) => b.comments.length - a.comments.length);

		// Sort comments by commentDate within each subreddit
		subreddits.forEach((subreddit) => {
			subreddit.comments.sort((a, b) => new Date(a.commentDate).getTime() - new Date(b.commentDate).getTime());
		});

		return subreddits;
	}
</script>

<Row>
	<Col>
		<input
			class="form-control"
			bind:value={userInput}
			placeholder="Enter a Reddit username"
			on:input={() => getUserHistory(userInput)}
		/>
		{#if userInput.length}
			<small>
				<a href="#" on:click={() => getUserHistory('')}>clear</a>
			</small>
			<ul style="max-height: 200px; overflow-y: auto;" class="bg-light">
				{#each allUsers.filter((u) => u.username.toLowerCase().includes(userInput.toLowerCase())) as filteredUser}
					<li>
						<a href="#" on:click={() => getUserHistory(filteredUser.username)}>
							{filteredUser.username}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</Col>
</Row>

{#if isLoading}
	<Spinner size="lg" />
{/if}

{#if singleUser}
	<Row>
		<Col>
			<h2>
				<a target="_blank" href="https://reddit.com/u/{singleUser.username}">
					{singleUser.username}
				</a>
			</h2>
			<p>{singleUser.comments?.length || 0} comments</p>
			<p>{singleUser.posts?.length || 0} posts</p>
		</Col>
		<Col>
			<select class="form-control" on:change={(event) => (viewMostPopular = event.target.value === 'top')}>
				<option value="top">Sort by: Top</option>
				<option value="newest">Sort by: Newest</option>
			</select>
		</Col>
	</Row>
	<Row>
		{#if accordionData.length}
			<Col>
				{#if viewMostPopular}
					<Accordion subreddits={accordionData} />
				{:else}
					{#each singleUser.comments.sort((a, b) => new Date(b.commentDate).getTime() - new Date(a.commentDate).getTime()) as comment}
						<Row class="border-bottom">
							<Col xs={2}>
								<a target="_blank" href="https://reddit.com/r/{comment.subredditName}">{comment.subredditName}</a>
								<br />
								<small>{new Date(comment.commentDate).toLocaleString()}</small>
								<br />
								<small>
									<a target="_blank" href="https://reddit.com{comment.permalink.split('/').slice(0, -2).join('/')}"
										>source</a
									>
								</small>
							</Col>
							<Col xs={10}>
								<p>
									{comment.content}
								</p>
							</Col>
						</Row>
					{/each}
				{/if}
			</Col>
		{/if}
	</Row>
{/if}
