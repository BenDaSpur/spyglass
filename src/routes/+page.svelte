<script lang="ts">
	import { onMount } from 'svelte';
	import { Styles, Row, Col, Input, Spinner } from '@sveltestrap/sveltestrap';
	import BarChart from '$lib/components/BarChart.svelte';
	import CountUp from '$lib/components/CountUp.svelte';

	let search = '';
	let subredditSearch = $state('');
	let results = $state([]);
	let chartData = $state([]);
	let subreddits = $state([]);
	let filteredSubreddits = $state([]);
	let loading = $state(false);
	let commentCount = $state(0);
	let subredditAuthors = $state([]);
	let totalUsersCount = $state(0);
	let totalCommentsCount = $state(0);
	let totalSubredditsCount = $state(0);
	let topSubredditUsers = $state([]);
	let dateFrom = $state(new Date(0).toISOString().split('T')[0]);
	let dateTo = $state(new Date().toISOString().split('T')[0]);

	let timeout;

	// Debounce function to delay execution
	function debounce(func, delay) {
		clearTimeout(timeout);
		timeout = setTimeout(func, delay);
	}

	// Function to handle input changes in the subreddit search field
	function handleSubredditSearchInput(event) {
		const searchTerm = event.target.value.trim();
		subredditSearch = searchTerm;
		searchFilteredSubreddits(searchTerm);
		debounce(() => {
			getSubredditData(searchTerm);
		}, 500);
	}

	// Function to fetch filtered subreddits based on the search input
	async function searchFilteredSubreddits(searchTerm) {
		if (!searchTerm) {
			filteredSubreddits = [];
			return;
		}
		try {
			const response = await fetch(`/api/reddit/subreddit?search=${encodeURIComponent(searchTerm)}`);
			const data = await response.json();
			filteredSubreddits = data;
		} catch (error) {
			console.error('Error fetching filtered subreddits:', error);
		}
	}

	// Function to fetch subreddit data
	async function getSubredditData(searchedSubreddit) {
		chartData = [];
		commentCount = 0;
		subredditAuthors = [];

		if (!searchedSubreddit) {
			return;
		}
		loading = true;
		try {
			const [commentCountResponse, interactionsResponse] = await Promise.all([
				fetch(`/api/reddit/subreddit/count?search=${encodeURIComponent(searchedSubreddit)}`),
				fetch(
					`/api/reddit/subreddit/interactions?subreddit=${encodeURIComponent(searchedSubreddit)}&dateFrom=${new Date(dateFrom).toISOString()}&dateTo=${new Date(dateTo).toISOString()}`
				)
			]);

			const commentCountJson = await commentCountResponse.json();
			commentCount = commentCountJson.comments;
			subredditAuthors = commentCountJson.authors;

			const chartJson = await interactionsResponse.json();
			chartData = chartJson.sort((a, b) => b.subreddit - a.subreddit);
			await getSubredditTopUsers(searchedSubreddit);
		} catch (error) {
			console.error('Error fetching subreddit data:', error);
		} finally {
			loading = false;
		}
	}

	async function getSubredditTopUsers(searchedSubreddit) {
		if (!searchedSubreddit) {
			return;
		}
		// loading = true;
		try {
			const response = await fetch(`/api/reddit/subreddit/users?subreddit=${encodeURIComponent(searchedSubreddit)}`);
			const data = await response.json();
			topSubredditUsers = data;
		} catch (error) {
			console.error('Error fetching subreddit top users:', error);
		} finally {
			// loading = false;
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
	}

	// Function to get overall stats
	async function getStats() {
		try {
			const response = await fetch('/api/reddit/stats');
			const data = await response.json();
			totalUsersCount = data.users;
			totalCommentsCount = data.comments;
			totalSubredditsCount = data.subreddits;
		} catch (error) {
			console.error('Error fetching stats:', error);
		}
	}

	async function setDates(whatDates: string) {
		if (whatDates === 'full') {
			dateFrom = new Date(0).toISOString().split('T')[0];
			dateTo = new Date().toISOString().split('T')[0];
		} else if (whatDates === 'pre') {
			dateFrom = new Date(0).toISOString().split('T')[0];
			dateTo = new Date('2023-10-07').toISOString().split('T')[0];
		} else if (whatDates === 'post') {
			dateFrom = new Date('2023-10-08').toISOString().split('T')[0];
			dateTo = new Date().toISOString().split('T')[0];
		}
		await getSubredditData(subredditSearch);
	}

	onMount(() => {
		subredditSearch = 'h3h3productions';
		getSubredditData('h3h3productions');
		getStats();
		const interval = setInterval(async () => {
			await getStats();
		}, 3600000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Spyglass</title>
	<meta name="description" content="Search Reddit" />
</svelte:head>

<Styles />

<Row class="my-3">
	<Col>
		<p>
			<b>
				<CountUp targetNumber={totalUsersCount} />
			</b>
			unique Reddit users<br />
			<b>
				<CountUp targetNumber={totalCommentsCount} />
			</b>
			individual comments<br />
			<b>
				<CountUp targetNumber={totalSubredditsCount} />
			</b>
			subreddits recorded<br />
		</p>
		<small>
			Tracking all data that originates from /r/<a
				href="#"
				onclick={() => {
					subredditSearch = 'h3h3productions';
					getSubredditData('h3h3productions');
				}}
			>
				h3h3productions
			</a>
			, /r/<a
				href="#"
				onclick={() => {
					subredditSearch = 'h3snark';
					getSubredditData('h3snark');
				}}
			>
				h3snark
			</a>, /r/<a
				href="#"
				onclick={() => {
					subredditSearch = 'Hasan_Piker';
					getSubredditData('Hasan_Piker');
				}}
			>
				Hasan_Piker
			</a>, /r/<a
				href="#"
				onclick={() => {
					subredditSearch = 'Destiny';
					getSubredditData('Destiny');
				}}
			>
				Destiny
			</a>, /r/<a
				href="#"
				onclick={() => {
					subredditSearch = 'LivestreamFail';
					getSubredditData('LivestreamFail');
				}}
			>
				LivestreamFail
			</a>, /r/<a
				href="#"
				onclick={() => {
					subredditSearch = 'LeftoversH3';
					getSubredditData('LeftoversH3');
				}}
			>
				LeftoversH3
			</a>
		</small>
	</Col>
</Row>

<Row class="mb-3">
	<Col md={8}>
		<div class="input-group">
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
		<div class="btn-group">
			<a href="#" class="btn btn-primary" onclick={() => setDates('full')}>Full Date Range</a>
			<a href="#" class="btn btn-success" onclick={() => setDates('pre')}>Pre Oct 7th</a>
			<a href="#" class="btn btn-warning" onclick={() => setDates('post')}>Post Oct 7th</a>
		</div>
	</Col>
</Row>
<Row>
	<Col md={8}>
		<div class="input-group">
			<span class="input-group-text">/r/</span>
			<input
				class="form-control"
				type="text"
				placeholder="Search Subreddit"
				bind:value={subredditSearch}
				oninput={handleSubredditSearchInput}
			/>
		</div>
		{#if subredditSearch}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore event_directive_deprecated -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<p style="cursor: pointer;" onclick={clearSubredditSearch}>Clear</p>
		{/if}
		<div style="max-height: 200px; overflow-y: auto;" class="bg-light p-2">
			{#if filteredSubreddits.length}
				{#each filteredSubreddits as subreddit}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore event_directive_deprecated -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<p
						style="cursor: pointer;"
						onclick={() => {
							subredditSearch = subreddit.name;
							filteredSubreddits = [];
							getSubredditData(subreddit.name);
						}}
					>
						{subreddit.name}
					</p>
				{/each}
			{/if}
		</div>
	</Col>
</Row>

{#if loading}
	<Spinner size="lg" />
{/if}

{#if chartData.length && subredditSearch}
	<BarChart
		interactions={chartData}
		subredditName={subredditSearch}
		{commentCount}
		authorsCount={subredditAuthors.length}
		fromDate={dateFrom}
		toDate={dateTo}
	/>
{:else if !loading && subredditSearch}
	<p>Not enough data for {subredditSearch}</p>
{/if}

{#if topSubredditUsers.length}
	<h2>Top commenters in {subredditSearch}</h2>
	<ul>
		{#each topSubredditUsers as user}
			<li>
				<a href={`/user?name=${user.authorName}`} target="_blank">
					{user.authorName}
				</a>
				<small>{user.commentCount}</small>
			</li>
		{/each}
	</ul>
{/if}
