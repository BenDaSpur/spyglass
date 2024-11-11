<script lang="ts">
	import { Styles, Row, Col, Container, Input } from '@sveltestrap/sveltestrap';

	let search = '';

	let timeout;

	let results = $state([]);

	async function getUserData(e) {
		e.preventDefault();
		search = e.target.value;

		clearTimeout(timeout);
		timeout = setTimeout(async () => {
			const response = await fetch(`/api/reddit/user?username=${search}`);
			const data = await response.json();
			results = data.comments;
			console.log(data);
		}, 500);
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<Styles />

<Container>
	<Row>
		<Col>
			<h1>Spyglass</h1>
			<Input type="text" placeholder="Search" bind:value={search} on:input={getUserData} />
		</Col>
	</Row>

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
</Container>
