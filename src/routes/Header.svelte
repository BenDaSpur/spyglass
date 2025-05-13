<script lang="ts">
	import { page } from '$app/stores';

	// let modalOpen = false;
	// const toggle = () => (modalOpen = !open);
</script>

<nav class="navbar navbar-expand-lg bg-body-tertiary">
	<div class="container-fluid">
		<a class="navbar-brand" href="/">
			<img src="/logo.svg" alt="Spyglass" width="30" height="30" class="d-inline-block align-top me-2" />
			Spyglass
		</a>
		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarSupportedContent"
			aria-controls="navbarSupportedContent"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="collapse navbar-collapse" id="navbarSupportedContent">
			<ul class="navbar-nav ms-auto mb-2 mb-lg-0">
				<li class="nav-item">
					<a class="nav-link {$page.url.pathname == '/user' ? 'active' : ''}" href="/user">User</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" target="_blank" href="https://github.com/BenDaSpur/spyglass">GitHub</a>
				</li>
				<!-- <li class="nav-item">
					<a class="nav-link" target="_blank" href="/h3stats">H3 Stats</a>
				</li> -->
				<li class="nav-item">
					<a class="nav-link" target="_blank" href="https://ethankleinlied.com">Ethan Klein Lied</a>
				</li>
			</ul>
		</div>
	</div>
</nav>
