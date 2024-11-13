<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { Container } from '@sveltestrap/sveltestrap';

	let { children } = $props();
</script>

<Container>
	<div class="app">
		<Header />

		<main>
			{@render children()}
		</main>
	</div>
</Container>

<style>
</style>
