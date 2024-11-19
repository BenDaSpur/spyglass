<script lang="ts">
	import { chart } from 'svelte-apexcharts?client';
	import { defaultSubreddits } from '$lib/utils';
	import { Input } from '@sveltestrap/sveltestrap';

	export let interactions = [];
	export let subredditName = '';
	export let commentCount = 0;
	export let authorsCount = 0;
	export let fromDate = '';
	export let toDate = '';

	let filterOut = false;
	let filteredSubreddits = interactions.filter(
		(i) => !defaultSubreddits.map((sub) => sub.toLowerCase()).includes(i.subreddit.toLowerCase())
	);

	console.log('interactions', interactions);

	const subtitleText = `
		${commentCount.toLocaleString()} comments recorded from ${authorsCount.toLocaleString()} unique users 
		${!fromDate.includes('1970-01-01') ? 'from ' + fromDate : ''} 
		${!toDate.includes(new Date().toISOString().split('T')[0]) ? 'to ' + toDate : ''}
	`;

	let chartOptions = {
		chart: {
			type: 'bar'
		},
		xaxis: {
			categories: interactions.sort((a, b) => a.subreddit.localeCompare(b.subreddit)).map((i) => i.subreddit)
		},
		series: [
			{
				name: 'Shared Commenters',
				data: interactions.map((i) => i.sharedUserCount)
			}
		],
		title: {
			text: 'Top Interactions for /r/' + subredditName,
			align: 'center'
		},
		subtitle: {
			text: subtitleText,
			align: 'center'
		}
	};

	let noDefaultChartOptions = {
		chart: {
			type: 'bar'
		},
		xaxis: {
			categories: filteredSubreddits.sort((a, b) => a.subreddit.localeCompare(b.subreddit)).map((i) => i.subreddit)
		},
		series: [
			{
				name: 'Shared Commenters',
				data: filteredSubreddits.map((i) => i.sharedUserCount)
			}
		],
		title: {
			text: 'Top Interactions for /r/' + subredditName,
			align: 'center'
		},
		subtitle: {
			text: subtitleText + ' (excluding default subreddits)',
			align: 'center'
		}
	};
</script>

<!-- <h1>Top Interactions for r/{subredditName}</h1>
<h4>{commentCount.toLocaleString()} comments recorded</h4>
<h5>{authorsCount.toLocaleString()} unique users recorded</h5> -->
<Input type="checkbox" bind:checked={filterOut} label="Filter out default subreddits" />
<div use:chart={filterOut ? noDefaultChartOptions : chartOptions} />

<!-- <ApexChart options={chartOptions} series={chartSeries} type="bar" height="350" /> -->
