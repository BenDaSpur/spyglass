<script lang="ts">
	// import SubredditGraph from '$lib/components/SubredditGraph.svelte';
	import { Styles, Row, Col, Container, Input, Spinner } from '@sveltestrap/sveltestrap';
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
		searchFilteredSubreddits();

		clearTimeout(timeout);
		timeout = setTimeout(async () => {
			chartData = [];
			loading = true;
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
</script>

<svelte:head>
	<title>Spyglass</title>
	<meta name="description" content="Search reddit" />
</svelte:head>

<Styles />

<Row>
	<Col>
		<h1>Spyglass</h1>
		<!-- <Input type="text" placeholder="Search User" bind:value={search} on:input={getUserData} /> -->
		<Input
			type="text"
			placeholder="Search Subreddit"
			name="subreddit_search"
			bind:value={subredditSearch}
			on:input={getSubredditData}
		/>
		<Row>
			<Col>
				<div style="max-height: 200px; overflow-y: auto;">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<!-- svelte-ignore event_directive_deprecated -->
					<p
						style="cursor: pointer;"
						on:click={() => {
							subredditSearch = '';
							// filteredSubreddits = [];
						}}
					>
						clear
					</p>
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
	<BarChart interactions={chartData} subredditName={subredditSearch} />
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
