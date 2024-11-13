<script lang="ts">
	import { chart } from 'svelte-apexcharts?client';

	export let interactions = [];
	export let subredditName = '';
	console.log('interactions', interactions);

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
		]
	};
</script>

<h1>Top Interactions for r/{subredditName}</h1>

<div use:chart={chartOptions} />

<!-- <ApexChart options={chartOptions} series={chartSeries} type="bar" height="350" /> -->
