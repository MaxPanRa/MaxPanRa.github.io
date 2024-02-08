<svelte:head>
    <title>{"Visor AR"}</title>
    <meta name="description" content="A todo list app" />
</svelte:head>
<script>
	import Loader from "$lib/Loader.svelte";
	// import { get } from 'svelte/store';
	import {typeStorage, itemStorage, getStoreVariable, homePath} from "$lib/Store.js";
	import { onMount, beforeUpdate } from 'svelte';
	import organicoImg from '$lib/img/organico.png';
	import veganoImg from '$lib/img/vegano.png';
	import picosoImg from '$lib/img/picoso.png';
	import superfoodImg from '$lib/img/superfood.png';

	let showLoad = true;
	let showScreen = false;
	let showMenu= true;
	let firstShow = true;

	function timedLoad(milli){
		setTimeout(() => {
			showLoad = false;
		}, milli);
	}
	beforeUpdate(()=>{
		$typeStorage = getStoreVariable("typeStorage");
		$itemStorage = typeof JSON.parse(getStoreVariable("itemStorage")) == "object" ? JSON.parse(getStoreVariable("itemStorage")) : {title:"Visor"};
		showScreen=true;
		showLoad=false;
		// debugger;
	})
	onMount(()=>{
		timedLoad(1000);
		menuChange(false,1000);
	})
	
	function menuChange(active, milli){
		setTimeout(() => {
			showMenu=active;
			firstShow=false;
		}, milli);
	}
	

</script>
<body class="products-body" style="">
	<select class="searchSelect visorSelect" value={$typeStorage} on:change="{(e) => {$typeStorage=e.target.value}}">
		<option value="AR">Realidad Aumentada</option>
		<option value="3D" >Visor 3D</option>
	</select>
	{#if showLoad}
		<Loader/>
	{/if}
	{#if showScreen}
		<div class="product_name">
			{$itemStorage.title || "Visor"}
		</div>
		<iframe title="viewer" allowvr="yes" height="100%" width="100%" allowfullscreen={true} src={$typeStorage=="" || $typeStorage=="AR" ? $homePath+'viewerAR.html' : $homePath+'viewer3D.html'}></iframe>
		{#if $itemStorage != undefined && $itemStorage != null && $itemStorage != {}}
		<div class="info-platillo" class:active={showMenu} class:first={firstShow}>
			<div class="infocard">
				<button id="infoBtn" class:active={showMenu} on:click={()=>{menuChange(!showMenu,100)}}><div class="infoBTNText">V</div></button>
				{#if $itemStorage.info != undefined && $itemStorage.info.price != undefined}
				<h2 id="infocard-title">{"$"+$itemStorage.info.price}</h2>
				{/if}
				<h1 id="infocard-title">{$itemStorage.title}</h1>
				<h3 id="infocard-subtitle">{$itemStorage.subtitle}</h3>
				{#if $itemStorage.info != undefined && $itemStorage.info.isOrganic != undefined
				&& $itemStorage.info.isVegan != undefined && $itemStorage.info.isSuperFood != undefined && $itemStorage.info.isSpicy != undefined}
				<div class="types-platillo row flexinline">
					<div class="col-3 typediv"><img class="typeimg" class:active={$itemStorage.info.isVegan} width="50" alt="tipo de platillo" src={veganoImg}/></div>
					<div class="col-3 typediv"><img class="typeimg" class:active={$itemStorage.info.isSuperFood} width="55" alt="tipo de platillo" src={superfoodImg}/></div>
					<div class="col-3 typediv"><img class="typeimg" class:active={$itemStorage.info.isSpicy} width="50" alt="tipo de platillo" src={picosoImg}/></div>
					<div class="col-3 typediv"><img class="typeimg" class:active={$itemStorage.info.isOrganic} width="53" alt="tipo de platillo" src={organicoImg}/></div>
				</div>
				{/if}
				<p id="infocard-description">{$itemStorage.body}</p>
			</div>
		</div>
		{/if}
	{/if}
</body>
<style>
	
body {
    margin: 0;
    padding: 0;
    background:none;
}

iframe {
    display: block;
    width: 100vw;
    height: 100vh;
    max-width: 100%;
    margin: 0;
    padding: 0;
    border: 0 none;
    box-sizing: border-box;
}
.product_name {
    text-align: center;
    padding-bottom: 10px;
    background: #f6ad33;
    color: white;
    padding-top: 10px;
    border-radius: 30px 30px 0 0;
}
select.searchSelect.visorSelect {
    position: absolute;
    top: 5px;
    right: 10px;
    width: 210px;
    height: 40px;
    padding: 0px 20px;
    background: #ffffff;
    border: 2px solid #f6ad33;
    font-size:15px;
    font-weight:500;
    color: #f6ad33;
    border-radius: 10px;
	outline: none;
}
.info-platillo {
    background: white;
    position: fixed;
    bottom: 0px;
    height: 70%;
    width: 96%;
    left: 2%;
    margin: 0 auto;
    display: block;
    transform: translate(0, 100%);
    transition: 1s;
    border-radius: 25px 25px 0 0;
    border: 5px solid #e6e6e6;
}
.info-platillo.active {
    transform: translate(0px, 0%);
}
.infoBTNText {
    position: relative;
    margin: 0 auto -20px;
    display: block;
    line-height: 50px;
    top: -45px;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: 25px;
    font-family: monospace;
    background: #f6ad33;
    font-weight: 800;
    color: #fff;
    border: 3px solid #cb9130;
    cursor: pointer;
    transition: .5s;
    vertical-align: middle;
    box-shadow: 0 0 7px 1px #d5b027d9;
}

button#infoBtn:hover {
    top: -48px;
}

h1#infocard-title {
    font-size: 20px;
    font-weight: 800;
    text-align: left;
}

.infocard {
    padding: 0px 12px;
}

h2#infocard-title {
    position: absolute;
    TOP: 10px;
    left: 30px;
    font-size: 18px;
}

h3#infocard-subtitle {
    font-size: 16px;
    font-weight: 300;
}

p#infocard-description {
    font-size: 14px;
    text-align: justify;
}
.types-platillo.row.flexinline {
    width:90%;
    margin:0 auto;
}

img.typeimg {
    margin: 0 auto;
    display: block;
    position: relative;
}
img.typeimg {
    opacity: 0.3;
    filter: grayscale(1);
}

img.typeimg.active {
    opacity: 1;
    filter: sepia(1);
}
.types-platillo{
	margin:0 15px;
}
.info-platillo.first {
    transform: translate(0px, 62%) !important;
}
button#infoBtn {
    transform: rotateX(180deg);
}
button#infoBtn.active {
    transform: rotateX(0deg);
}
button#infoBtn{
    text-align: center;
    position: relative;
    display: block;
    top: -100px!important;
    background: none;
    width: 100%;
    outline: none !important;
    border: none !important;
}
button#infoBtn.active {
    top: -35px !important;
}
</style>