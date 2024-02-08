<head>
	<!-- <link rel="shortcut icon" href="/restaurant-logo.ico" /> -->
</head>
<script lang="ts">
	import Header from '../lib/header/Header.svelte';
	import { beforeUpdate } from 'svelte';
	import '../app.css';

	let path:any;
	let showPage = false;
    beforeUpdate(() => {
		path = window.location.pathname;
		showPage=true;
	});
</script>
{#if showPage}
	<Header />

	<main>
		<slot />
	</main>

	<footer>
		<p>Restaurante - 2024</p>
	</footer>
{/if}

<style>
	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	footer {
		font-size:15px;
		background: white;
		padding: 10px !important;
		border-radius: 45px 45px 0px 0px;
	}


	@media (min-width: 480px) {
		footer {
			padding: 40px 0;
		}
	}
</style>
