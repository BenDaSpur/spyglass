<script lang="ts">
	type AccordionData = {
		subredditName: string;
		comments: Comment[];
	};

	type Comment = {
		subredditName: string;
		content: string;
		permalink: string;
		commentDate: string;
	};
	export let subreddits: AccordionData[] = [];
</script>

<div class="accordion" id="accordionExample">
	{#each subreddits as subreddit, i}
		<div class="accordion-item">
			<h2 class="accordion-header">
				<button
					class="accordion-button"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#collapse{i}"
					aria-expanded="true"
					aria-controls="collapse{i}"
				>
					{subreddit.subredditName} ({subreddit.comments.length})
				</button>
			</h2>
			<div id="collapse{i}" class="accordion-collapse collapse show" data-bs-parent="#accordionExample">
				<div class="accordion-body">
					{#each subreddit.comments as comment}
						{#if comment.subredditName === subreddit.subredditName}
							<p>
								{comment.content}
								<small>
									<a href="https://reddit.com{comment.permalink.split('/').slice(0, -2).join('/')}" target="_blank"
										>source
									</a>
								</small>
								{#if comment.commentDate}
									<small>
										{new Date(comment.commentDate).toLocaleDateString()}
									</small>
								{/if}
							</p>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.accordion-body p {
		border-bottom: 1px solid #ccc;
	}
</style>
