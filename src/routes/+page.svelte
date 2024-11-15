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
				fetch(`/api/reddit/subreddit/interactions?subreddit=${encodeURIComponent(searchedSubreddit)}`)
			]);

			const commentCountJson = await commentCountResponse.json();
			commentCount = commentCountJson.comments;
			subredditAuthors = commentCountJson.authors;

			const chartJson = await interactionsResponse.json();
			chartData = chartJson.sort((a, b) => b.subreddit - a.subreddit);
		} catch (error) {
			console.error('Error fetching subreddit data:', error);
		} finally {
			loading = false;
		}
	}

	// Function to clear the subreddit search
	function clearSubredditSearch() {
		subredditSearch = '';
		filteredSubreddits = [];
		chartData = [];
		commentCount = 0;
		subredditAuthors = [];
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

	onMount(async () => {
		await getStats();
		const interval = setInterval(async () => {
			await getStats();
		}, 20000);

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
				<CountUp targetNumber={totalUsersCount} duration={5000} />
			</b>
			unique Reddit users<br />
			<b>
				<CountUp targetNumber={totalCommentsCount} duration={5000} />
			</b>
			individual comments<br />
			<b>
				<CountUp targetNumber={totalSubredditsCount} duration={5000} />
			</b>
			subreddits recorded<br />
		</p>
	</Col>
</Row>

<Row>
	<Col>
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
			</a>
		</small>
		<input
			class="form-control"
			type="text"
			placeholder="Search Subreddit"
			bind:value={subredditSearch}
			oninput={handleSubredditSearchInput}
		/>
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
	/>
{:else if !loading && subredditSearch}
	<p>Not enough data for {subredditSearch}</p>
{/if}
