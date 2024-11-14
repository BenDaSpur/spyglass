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
	<NavbarToggler on:click={() => (isOpen = !isOpen)} />
	<Collapse {isOpen} navbar expand="md" on:update={handleUpdate}>
		<Nav class="ms-auto" navbar>
			<!-- <NavItem on:click={toggle}>
				<NavLink>Why?</NavLink>
			</NavItem> -->
			<NavItem>
				<NavLink href="https://github.com/BenDaSpur/spyglass" target="_blank">GitHub</NavLink>
			</NavItem>
			<!-- <Dropdown nav inNavbar>
				<DropdownToggle nav caret>Options</DropdownToggle>
				<DropdownMenu end>
					<DropdownItem>Option 1</DropdownItem>
					<DropdownItem>Option 2</DropdownItem>
					<DropdownItem divider />
					<DropdownItem>Reset</DropdownItem>
				</DropdownMenu>
			</Dropdown> -->
		</Nav>
	</Collapse>
</Navbar>
