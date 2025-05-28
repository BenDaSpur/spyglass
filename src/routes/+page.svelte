<script lang="ts">
	import { onMount } from 'svelte';
	import { Styles, Row, Col, Input, Spinner } from '@sveltestrap/sveltestrap';
	import { MetaTags } from 'svelte-meta-tags';
	import BarChart from '$lib/components/BarChart.svelte';
	import CountUp from '$lib/components/CountUp.svelte';

	interface Subreddit {
		name: string;
	}

	interface User {
		authorName: string;
		commentCount: number;
	}

	interface ChartDataItem {
		subreddit: number;
	}

	let subredditSearch = $state('');
	let chartData = $state<ChartDataItem[]>([]);
	let filteredSubreddits = $state<Subreddit[]>([]);
	let loadingChart = $state(false);
	let loadingUsers = $state(false);
	let loadingStats = $state(false);
	let loadingSubreddits = $state(false);
	let commentCount = $state(0);
	let subredditAuthors = $state<string[]>([]);
	let totalUsersCount = $state(0);
	let totalCommentsCount = $state(0);
	let totalSubredditsCount = $state(0);
	let topSubredditUsers = $state<User[]>([]);
	let dateFrom = $state(new Date(0).toISOString().split('T')[0]);
	let dateTo = $state(new Date().toISOString().split('T')[0]);
	let selectedDateRange = $state('full');
	let errorMessage = $state('');

	let timeout: ReturnType<typeof setTimeout>;

	// Debounce function to delay execution
	function debounce(func: () => void, delay: number) {
		clearTimeout(timeout);
		timeout = setTimeout(func, delay);
	}

	// Function to handle input changes in the subreddit search field
	function handleSubredditSearchInput(event: Event) {
		const searchTerm = (event.target as HTMLInputElement).value.trim();
		subredditSearch = searchTerm;
		searchFilteredSubreddits(searchTerm);
		debounce(() => {
			getSubredditData(searchTerm);
		}, 500);
	}

	// Function to fetch filtered subreddits based on the search input
	async function searchFilteredSubreddits(searchTerm: string) {
		if (!searchTerm) {
			filteredSubreddits = [];
			return;
		}
		loadingSubreddits = true;
		try {
			const response = await fetch(`/api/reddit/subreddit?search=${encodeURIComponent(searchTerm)}`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			filteredSubreddits = data;
			errorMessage = '';
		} catch (error) {
			console.error('Error fetching filtered subreddits:', error);
			errorMessage = 'Failed to fetch subreddit list. Please try again.';
			filteredSubreddits = [];
		} finally {
			loadingSubreddits = false;
		}
	}

	// Function to fetch subreddit data
	async function getSubredditData(searchedSubreddit: string) {
		if (!searchedSubreddit) {
			return;
		}

		loadingChart = true;
		loadingUsers = true;
		chartData = [];
		commentCount = 0;
		subredditAuthors = [];
		topSubredditUsers = [];
		errorMessage = '';

		try {
			const [commentCountResponse, interactionsResponse, usersResponse] = await Promise.all([
				fetch(
					`/api/reddit/subreddit/count?search=${encodeURIComponent(searchedSubreddit)}&dateFrom=${new Date(dateFrom).toISOString()}&dateTo=${new Date(dateTo).toISOString()}`
				),
				fetch(
					`/api/reddit/subreddit/interactions?subreddit=${encodeURIComponent(searchedSubreddit)}&dateFrom=${new Date(dateFrom).toISOString()}&dateTo=${new Date(dateTo).toISOString()}`
				),
				fetch(
					`/api/reddit/subreddit/users?subreddit=${encodeURIComponent(searchedSubreddit)}&dateFrom=${new Date(dateFrom).toISOString()}&dateTo=${new Date(dateTo).toISOString()}`
				)
			]);

			if (!commentCountResponse.ok || !interactionsResponse.ok || !usersResponse.ok) {
				throw new Error('One or more API requests failed');
			}

			const [commentCountJson, chartJson, usersJson] = await Promise.all([
				commentCountResponse.json(),
				interactionsResponse.json(),
				usersResponse.json()
			]);

			commentCount = commentCountJson.comments;
			subredditAuthors = commentCountJson.authors;
			chartData = chartJson.sort((a: ChartDataItem, b: ChartDataItem) => b.subreddit - a.subreddit);
			topSubredditUsers = usersJson;
		} catch (error) {
			console.error('Error fetching subreddit data:', error);
			errorMessage = 'Failed to load subreddit data. Please try again.';
		} finally {
			loadingChart = false;
			loadingUsers = false;
		}
	}

	// Function to clear the subreddit search
	function clearSubredditSearch() {
		subredditSearch = '';
		filteredSubreddits = [];
		chartData = [];
		commentCount = 0;
		subredditAuthors = [];
		topSubredditUsers = [];
		errorMessage = '';
	}

	// Function to get overall stats
	async function getStats() {
		loadingStats = true;
		try {
			const response = await fetch('/api/reddit/stats');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			totalUsersCount = data.users;
			totalCommentsCount = data.comments;
			totalSubredditsCount = data.subreddits;
		} catch (error) {
			console.error('Error fetching stats:', error);
			errorMessage = 'Failed to load overall stats. Please try again.';
		} finally {
			loadingStats = false;
		}
	}

	async function setDates(whatDates: string) {
		selectedDateRange = whatDates;

		if (whatDates === 'full') {
			dateFrom = new Date(0).toISOString().split('T')[0];
			dateTo = new Date().toISOString().split('T')[0];
		} else if (whatDates === 'pre') {
			dateFrom = new Date(0).toISOString().split('T')[0];
			dateTo = new Date('2023-10-07').toISOString().split('T')[0];
		} else if (whatDates === 'post') {
			dateFrom = new Date('2023-10-08').toISOString().split('T')[0];
			dateTo = new Date().toISOString().split('T')[0];
		} else if (whatDates === 'month') {
			dateFrom = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
			dateTo = new Date().toISOString().split('T')[0];
		} else if (whatDates === 'sixMonths') {
			dateFrom = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
			dateTo = new Date().toISOString().split('T')[0];
		}
		await getSubredditData(subredditSearch);
	}

	onMount(() => {
		subredditSearch = 'h3h3productions';
		getStats();
		getSubredditData('h3h3productions');
	});
</script>

<MetaTags title="Reddit Spyglass" description="Data tracking for H3 subreddits" />

<Styles />

<div class="container py-4">
	<div class="card mb-4">
		<div class="card-body">
			<h1 class="h4 mb-3">Reddit Data Explorer</h1>

			<div class="stats-container">
				<div class="stat-item">
					{#if loadingStats}
						<span class="stat-value"><Spinner size="sm" color="primary" /></span>
					{:else}
						<span class="stat-value"><CountUp targetNumber={totalUsersCount} /></span>
					{/if}
					<span class="stat-label">unique Reddit users</span>
				</div>
				<div class="stat-item">
					{#if loadingStats}
						<span class="stat-value"><Spinner size="sm" color="primary" /></span>
					{:else}
						<span class="stat-value"><CountUp targetNumber={totalCommentsCount} /></span>
					{/if}
					<span class="stat-label">individual comments</span>
				</div>
				<div class="stat-item">
					{#if loadingStats}
						<span class="stat-value"><Spinner size="sm" color="primary" /></span>
					{:else}
						<span class="stat-value"><CountUp targetNumber={totalSubredditsCount} /></span>
					{/if}
					<span class="stat-label">subreddits recorded</span>
				</div>
			</div>

			<div class="mt-3">
				<small class="text-muted">
					Tracking data from:
					{#each ['h3h3productions', 'h3snark', 'Hasan_Piker', 'Destiny', 'LivestreamFail', 'LeftoversH3'] as sub}
						<a
							href="#"
							class="badge {subredditSearch === sub ? 'bg-success' : 'bg-secondary'} text-decoration-none me-1"
							onclick={() => {
								subredditSearch = sub;
								getSubredditData(sub);
							}}
						>
							r/{sub}
						</a>
					{/each}
				</small>
			</div>

			<div class="date-controls mb-4">
				<Row>
					<Col md={8}>
						<div class="input-group mb-2">
							<span class="input-group-text">From</span>
							<input
								bind:value={dateFrom}
								oninput={(ev) => {
									dateFrom = ev.currentTarget.value;
									getSubredditData(subredditSearch);
								}}
								type="date"
								class="form-control"
								aria-label="From"
							/>
							<span class="input-group-text">To</span>
							<input
								bind:value={dateTo}
								oninput={(ev) => {
									dateTo = ev.currentTarget.value;
									getSubredditData(subredditSearch);
								}}
								type="date"
								class="form-control"
								aria-label="To"
							/>
						</div>
						<div class="btn-group w-100">
							<button
								type="button"
								class="btn {selectedDateRange === 'full' ? 'btn-primary' : 'btn-outline-primary'}"
								onclick={() => setDates('full')}>Full Range</button
							>
							<button
								type="button"
								class="btn {selectedDateRange === 'pre' ? 'btn-success' : 'btn-outline-success'}"
								onclick={() => setDates('pre')}>Pre Oct 7th</button
							>
							<button
								type="button"
								class="btn {selectedDateRange === 'post' ? 'btn-warning' : 'btn-outline-warning'}"
								onclick={() => setDates('post')}
							>
								Post Oct 7th
							</button>
							<button
								type="button"
								class="btn {selectedDateRange === 'sixMonths' ? 'btn-secondary' : 'btn-outline-secondary'}"
								onclick={() => setDates('sixMonths')}>Six Months</button
							>
							<button
								type="button"
								class="btn {selectedDateRange === 'month' ? 'btn-info' : 'btn-outline-info'}"
								onclick={() => setDates('month')}>Last Month</button
							>
						</div>
					</Col>
				</Row>
			</div>

			<div class="subreddit-search mb-4">
				<Row>
					<Col md={8}>
						<label for="subredditSearch" class="form-label">Subreddit Search</label>
						<div class="input-group mb-2">
							<span class="input-group-text">/r/</span>
							<input
								id="subredditSearch"
								class="form-control"
								type="text"
								placeholder="Enter subreddit name"
								bind:value={subredditSearch}
								oninput={handleSubredditSearchInput}
							/>
							{#if subredditSearch}
								<button class="btn btn-outline-secondary" type="button" onclick={clearSubredditSearch}> Clear </button>
							{/if}
						</div>

						{#if loadingSubreddits}
							<div class="subreddit-suggestions p-2 border rounded bg-light">
								<div class="text-center">
									<Spinner size="sm" color="primary" />
									<small class="text-muted">Loading suggestions...</small>
								</div>
							</div>
						{:else if filteredSubreddits.length}
							<div class="subreddit-suggestions p-2 border rounded bg-light">
								{#each filteredSubreddits as subreddit}
									<button
										class="suggestion-item btn btn-sm btn-light text-start w-100"
										onclick={() => {
											subredditSearch = subreddit.name;
											filteredSubreddits = [];
											getSubredditData(subreddit.name);
										}}
									>
										{subreddit.name}
									</button>
								{/each}
							</div>
						{/if}
					</Col>
				</Row>
			</div>

			{#if errorMessage}
				<div class="alert alert-danger">
					{errorMessage}
				</div>
			{/if}
		</div>
	</div>

	{#if loadingChart}
		<div class="text-center my-5">
			<Spinner size="lg" color="primary" />
			<p class="mt-3 text-muted">Loading chart data, this can take up to a few minutes...</p>
		</div>
	{:else if chartData.length && subredditSearch && !loadingChart}
		<div class="card mb-4">
			<div class="card-body">
				<BarChart
					interactions={chartData}
					subredditName={subredditSearch}
					{commentCount}
					authorsCount={subredditAuthors.length}
					fromDate={dateFrom}
					toDate={dateTo}
				/>
			</div>
		</div>
	{:else if !loadingChart && subredditSearch && !errorMessage}
		<div class="alert alert-info">
			Not enough data for r/{subredditSearch}
		</div>
	{/if}

	{#if loadingUsers}
		<div class="text-center my-3">
			<Spinner size="md" color="secondary" />
			<p class="mt-2 text-muted">Loading top users for the selected date range...</p>
		</div>
	{:else if topSubredditUsers.length && !loadingUsers}
		<div class="card mb-4">
			<div class="card-header">
				<h2 class="h5 m-0">Top commenters in r/{subredditSearch}</h2>
			</div>
			<div class="card-body">
				<ul class="list-group">
					{#each topSubredditUsers as user}
						<li class="list-group-item d-flex justify-content-between align-items-center">
							<a href={`/user?name=${user.authorName}`} target="_blank" class="text-decoration-none">
								{user.authorName}
							</a>
							<span class="badge bg-primary rounded-pill">{user.commentCount}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>

<style>
	.stats-container {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: bold;
	}

	.stat-label {
		font-size: 0.9rem;
		color: #6c757d;
	}

	.subreddit-suggestions {
		max-height: 200px;
		overflow-y: auto;
	}

	.suggestion-item {
		padding: 0.25rem 0.5rem;
		margin-bottom: 0.25rem;
	}

	.suggestion-item:hover {
		background-color: #e9ecef;
	}
</style>
