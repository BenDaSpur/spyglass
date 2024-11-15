<script lang="ts">
	import { onMount } from 'svelte';
	import { Row, Col, Input, Spinner } from '@sveltestrap/sveltestrap';
	import { writable } from 'svelte/store';

	let userNameInput = writable('');
	let user = writable({});
	let allUsers = writable([]);
	let sortedSubreddits = writable([]);
	let isLoading = writable(false);

	// Debounce setup
	let debounceTimeout;
	const debounceDelay = 1000;

	// Fetch all users
	onMount(async () => {
		const response = await fetch(`/api/reddit/user`);
		allUsers.set(await response.json());
	});

	// Debounced function to fetch user data
	function getUserHistory() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			const inputValue = $userNameInput;
			if (!inputValue) {
				user.set({});
				sortedSubreddits.set([]);
				return;
			}
			isLoading.set(true);

			const response = await fetch(`/api/reddit/user?username=${inputValue}`);
			const fetchedUser = await response.json();
			user.set(fetchedUser);

			if (fetchedUser.username) {
				// Generate sorted subreddits by count
				const subredditCounts = fetchedUser.comments.reduce((acc, comment) => {
					acc[comment.subredditName] = (acc[comment.subredditName] || 0) + 1;
					return acc;
				}, {});

				const sorted = Object.entries(subredditCounts)
					.map(([subredditName, count]) => ({
						subredditName,
						count
					}))
					.sort((a, b) => b.count - a.count);

				sortedSubreddits.set(sorted);
			}
			isLoading.set(false);
		}, debounceDelay);
	}

	// Auto-trigger user history when input changes
	$: $userNameInput, getUserHistory();
</script>

<Row>
	<Col>
		<Input bind:value={$userNameInput} placeholder="Enter a Reddit username" on:input={() => getUserHistory()} />
		{#if $userNameInput}
			<small>
				<!-- Showing results for: {$userNameInput} -->
				<a href="#" on:click={() => ($userNameInput = '')}>Clear</a>
			</small>
			<ul style="max-height: 200px; overflow-y: auto;" class="bg-light">
				{#each $allUsers.filter((u) => u.username.toLowerCase().includes($userNameInput.toLowerCase())) as filteredUser}
					<li>
						<a href="#" on:click={() => ($userNameInput = filteredUser.username)}>
							{filteredUser.username}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</Col>
</Row>

{#if $isLoading}
	<Spinner size="lg" />
{/if}

{#if Object.keys($user).length}
	<Row>
		<Col>
			<h2>{$user.username}</h2>
			<p>{$user.comments.length} comments</p>
			<p>{$user.posts.length} posts</p>

			{#if $sortedSubreddits.length}
				<div class="accordion" id="accordionExample">
					{#each $sortedSubreddits as subreddit, i}
						<div class="accordion-item">
							<h2 class="accordion-header">
								<button
									class="accordion-button"
									type="button"
									data-bs-toggle="collapse"
									data-bs-target="#collapse{i}"
									aria-expanded="true"
									aria-controls="collapse{i}"
								>
									{subreddit.subredditName} ({subreddit.count})
								</button>
							</h2>
							<div id="collapse{i}" class="accordion-collapse collapse show" data-bs-parent="#accordionExample">
								<div class="accordion-body">
									{#each $user.comments as comment}
										{#if comment.subredditName === subreddit.subredditName}
											<p>
												{comment.content}
												<small
													><a
														href="https://reddit.com{comment.permalink.split('/').slice(0, -2).join('/')}"
														target="_blank">source</a
													></small
												>
											</p>
										{/if}
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Col>
	</Row>
{/if}

<style>
	.accordion-body p {
		border-bottom: 1px solid #ccc;
	}
</style>
