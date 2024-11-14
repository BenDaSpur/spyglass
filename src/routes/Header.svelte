<script lang="ts">
	import {
		Collapse,
		NavbarToggler,
		NavbarBrand,
		Nav,
		Navbar,
		NavItem,
		NavLink,
		Dropdown,
		DropdownToggle,
		DropdownMenu,
		DropdownItem,
		Button,
		Modal
	} from '@sveltestrap/sveltestrap';

	let isOpen = false;

	function handleUpdate(event) {
		isOpen = event.detail.isOpen;
	}

	// let modalOpen = false;
	// const toggle = () => (modalOpen = !open);
</script>

<Navbar color="light" light expand="md" container="md">
	<NavbarBrand href="/">
		<img src="/logo.svg" alt="Spyglass" width="30" height="30" class="d-inline-block align-top" />
		Spyglass
	</NavbarBrand>
	<NavItem>
		<NavLink href="https://github.com/BenDaSpur/spyglass" target="_blank">GitHub</NavLink>
	</NavItem>
</Navbar>
