<script lang="ts">
	import { Row, Col, Input } from '@sveltestrap/sveltestrap';
	import { onMount } from 'svelte';
	import { on } from 'svelte/events';

	let userNameInput = $state('');
	let user = $state({});
	let allUsers = $state([]);

	let debounceTimeout;

	onMount(async () => {
		await getAllUsers();
	});

	async function getUserHistory() {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(async () => {
			const response = await fetch(`/api/reddit/user?username=${userNameInput}`);
			user = await response.json();
		}, 1000); // Adjust the debounce delay as needed
	}

	async function getAllUsers() {
		const response = await fetch(`/api/reddit/user`);
		allUsers = await response.json();
	}
</script>

<Row>
	<Col>
		<Input bind:value={userNameInput} placeholder="Enter a Reddit username" on:input={getUserHistory} />
		{#if userNameInput}
			<ul>
				{#each allUsers.filter((u) => u.username.toLowerCase().includes(userNameInput.toLowerCase())) as filteredUser}
					<li>{filteredUser.username}</li>
				{/each}
			</ul>
		{/if}
	</Col>
</Row>

{#if Object.keys(user).length}
	<!-- content here -->
	<Row>
		<Col>
			<h2>{user.username}</h2>
			<p>{user.comments.length} comments</p>
			<p>{user.posts.length} posts</p>
		</Col>
	</Row>
{/if}
