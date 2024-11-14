<script lang="ts">
	import { chart } from 'svelte-apexcharts?client';

	export let interactions = [];
	export let subredditName = '';
	export let commentCount = 0;
	export let authorsCount = 0;
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
		],
		title: {
			text: 'Top Interactions for /r/' + subredditName,
			align: 'center'
		},
		subtitle: {
			text:
				commentCount.toLocaleString() + ' comments recorded from ' + authorsCount.toLocaleString() + ' unique users',
			align: 'center'
		}
	};
</script>

<!-- <h1>Top Interactions for r/{subredditName}</h1>
<h4>{commentCount.toLocaleString()} comments recorded</h4>
<h5>{authorsCount.toLocaleString()} unique users recorded</h5> -->
<div use:chart={chartOptions} />

<!-- <ApexChart options={chartOptions} series={chartSeries} type="bar" height="350" /> -->
