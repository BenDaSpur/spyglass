<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	export let data = [];

	let svgElement: SVGSVGElement;

	onMount(() => {
		if (data.length === 0) return;

		// Preprocess data to create nodes and links
		const nodesSet = new Set<string>();
		data.forEach((d) => {
			nodesSet.add(d.Subreddit_A);
			nodesSet.add(d.Subreddit_B);
		});

		const nodes = Array.from(nodesSet).map((id) => ({ id }));
		const links = data.map((d) => ({
			source: d.Subreddit_A,
			target: d.Subreddit_B,
			value: d.Shared_User_Count
		}));

		// Clear the SVG element
		while (svgElement.firstChild) {
			svgElement.removeChild(svgElement.firstChild);
		}

		// Set up dimensions
		const width = 800;
		const height = 600;

		const svg = d3.select(svgElement).attr('width', width).attr('height', height);

		// Create simulation
		const simulation = d3
			.forceSimulation(nodes)
			.force(
				'link',
				d3
					.forceLink(links)
					.id((d: any) => d.id)
					.distance(100)
			)
			.force('charge', d3.forceManyBody().strength(-200))
			.force('center', d3.forceCenter(width / 2, height / 2));

		// Draw links
		const link = svg
			.append('g')
			.attr('class', 'links')
			.selectAll('line')
			.data(links)
			.enter()
			.append('line')
			.attr('stroke-width', (d) => Math.sqrt(d.value))
			.attr('stroke', '#999')
			.attr('stroke-opacity', 0.6);

		// Draw nodes
		const node = svg
			.append('g')
			.attr('class', 'nodes')
			.selectAll('circle')
			.data(nodes)
			.enter()
			.append('circle')
			.attr('r', 5)
			.attr('fill', '#69b3a2')
			.call(d3.drag<SVGCircleElement, any>().on('start', dragStarted).on('drag', dragged).on('end', dragEnded));

		// Add labels to nodes
		const labels = svg
			.append('g')
			.attr('class', 'labels')
			.selectAll('text')
			.data(nodes)
			.enter()
			.append('text')
			.attr('dy', -10)
			.text((d) => d.id)
			.style('font-size', '10px')
			.style('text-anchor', 'middle');

		// Update positions on each tick
		simulation.on('tick', () => {
			link
				.attr('x1', (d) => (d.source as any).x)
				.attr('y1', (d) => (d.source as any).y)
				.attr('x2', (d) => (d.target as any).x)
				.attr('y2', (d) => (d.target as any).y);

			node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);

			labels.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
		});

		// Drag functions
		function dragStarted(event, d) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x!;
			d.fy = d.y!;
		}

		function dragged(event, d) {
			d.fx = event.x;
			d.fy = event.y;
		}

		function dragEnded(event, d) {
			if (!event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}
	});
</script>

<svg bind:this={svgElement}></svg>

<style>
	svg {
		border: 1px solid #ccc;
	}
	.nodes circle {
		cursor: pointer;
	}
	.labels text {
		pointer-events: none;
	}
</style>
