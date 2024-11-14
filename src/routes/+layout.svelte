<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { Container, Styles } from '@sveltestrap/sveltestrap';

	let { children } = $props();
</script>

<Styles />
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
