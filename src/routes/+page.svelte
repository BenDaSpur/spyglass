<script lang="ts">
	// import SubredditGraph from '$lib/components/SubredditGraph.svelte';
	import { Styles, Row, Col, Container, Input, Spinner, Modal, Button } from '@sveltestrap/sveltestrap';
	import BarChart from '$lib/components/BarChart.svelte';
	import { onMount } from 'svelte';

	let search = '';
	let subredditSearch = $state('');

	let timeout;

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

	let open = false;
	const toggle = () => (open = !open);

	// onMount(async () => {
	// 	const response = await fetch('/api/reddit/subreddit/interactions?subreddit=h3snark');
	// 	chartData = await response.json();
	// 	console.log('chartData', chartData);
	// });

	async function getSubredditData() {
		if (!subredditSearch) {
			filteredSubreddits = [];
			return;
		}
		await searchFilteredSubreddits();

		clearTimeout(timeout);
		timeout = setTimeout(async () => {
			chartData = [];
			commentCount = 0;
			subredditAuthors = [];
			loading = true;
			const commentCountResponse = await fetch(`/api/reddit/subreddit/count?search=${subredditSearch}`);
			const commentCountJson = await commentCountResponse.json();
			commentCount = commentCountJson.comments;
			subredditAuthors = commentCountJson.authors;
			const response = await fetch(`/api/reddit/subreddit/interactions?subreddit=${subredditSearch}`);
			const chartJson = await response.json();
			// chartData = chartJson.sort((a, b) => b.subreddit - a.subreddit);
			chartData = chartJson.sort((a, b) => b.subreddit - a.subreddit);
			loading = false;
		}, 500);
	}

	async function searchFilteredSubreddits() {
		const response = await fetch(`/api/reddit/subreddit?search=${subredditSearch}`);
		const data = await response.json();
		filteredSubreddits = data;
	}

	async function getStats() {
		const response = await fetch('/api/reddit/stats');
		const data = await response.json();
		totalUsersCount = data.users;
		totalCommentsCount = data.comments;
		totalSubredditsCount = data.subreddits;
	}

	onMount(async () => {
		const interval = setInterval(async () => {
			await getStats();
		}, 30000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Spyglass</title>
	<meta name="description" content="Search reddit" />
</svelte:head>

<Styles />

{#await getStats()}
	<!-- promise is pending -->
{:then stats}
	<Row class="my-3">
		<Col>
			<p>
				<b>
					{totalUsersCount.toLocaleString()}
				</b>
				unique users<br />
				<b>
					{totalCommentsCount.toLocaleString()}
				</b>
				individual comments<br />
				<b>
					{totalSubredditsCount.toLocaleString()}
				</b>
				subreddit's recorded<br />
			</p>
		</Col>
	</Row>
{/await}

<Row>
	<Col>
		<!-- <Input type="text" placeholder="Search User" bind:value={search} on:input={getUserData} /> -->
		<!-- <h2>See what other subreddits people comment on</h2> -->
		<small
			>tracking all data that originates from /r/h3h3productions + /r/h3snark + /r/Hasan_Piker + /r/Destiny +
			/r/LivestreamFail</small
		>
		<Input
			type="text"
			placeholder="Search Subreddit"
			name="subreddit_search"
			bind:value={subredditSearch}
			on:input={getSubredditData}
		/>
		<Row>
			<Col>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<!-- svelte-ignore event_directive_deprecated -->
				{#if subredditSearch}
					<!-- content here -->
					<p
						style="cursor: pointer;"
						on:click={() => {
							subredditSearch = '';
							// filteredSubreddits = [];
						}}
					>
						clear
					</p>
				{/if}
				<div style="max-height: 200px; overflow-y: auto;" class="bg-light p-2">
					{#if subredditSearch.length}
						<!-- content here -->
						{#each filteredSubreddits as subreddit}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<!-- svelte-ignore event_directive_deprecated -->
							<p
								style="cursor: pointer;"
								on:click={() => {
									subredditSearch = subreddit.name;
									getSubredditData();
									// getSubredditData(window.document.getElementsByName('subreddit_search')[0]);
								}}
							>
								{subreddit.name}
							</p>
						{/each}
					{/if}
				</div>
			</Col>
		</Row>
		<!-- <Input type="select">
			{#each filteredSubreddits as subreddit}
				<option value={subreddit.name}>{subreddit.name}</option>
			{/each}
		</Input> -->
	</Col>
</Row>

{#if chartData.length && subredditSearch}
	<!-- content here -->
	<!-- <SubredditGraph data={chartData} /> -->
	<BarChart
		interactions={chartData}
		subredditName={subredditSearch}
		{commentCount}
		authorsCount={subredditAuthors.length}
	/>
{/if}

{#if chartData.length == 0 && !loading && subredditSearch}
	<p>Not enough data for {subredditSearch}</p>
{/if}

{#if loading}
	<Spinner size="lg" />
{/if}

{#if results.length}
	<Row>
		<Col>
			<h2>Results</h2>
			<!-- {JSON.stringify(results)} -->
			{#each results as result}
				<div>
					<h3>{result.subredditName}</h3>
					<p>{result.content}</p>
				</div>
			{/each}
		</Col>
	</Row>
{/if}
