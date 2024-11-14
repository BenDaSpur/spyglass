<script>
	import { tweened } from 'svelte/motion';
	import { writable } from 'svelte/store';

	export let targetNumber = 0; // Input prop for the target number
	export let duration = 2000; // Duration for the count-up animation (in milliseconds)

	// Create a tweened store to smoothly animate the number
	const animatedNumber = tweened(0, {
		duration,
		easing: (t) => t * (2 - t) // Easing function for smoothness
	});

	// Watch for changes in the target number and trigger the transition
	$: {
		animatedNumber.set(targetNumber);
	}
</script>

<!-- Display the animated number -->
<span>{Math.floor($animatedNumber).toLocaleString()}</span>

<style>
	span {
		transition:
			color 0.3s ease-in-out,
			font-size 0.3s ease-in-out;
	}
</style>
