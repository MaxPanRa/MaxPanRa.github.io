<script lang="ts">
	import info from '$lib/img/info.png';
    import arbtn from '$lib/img/ar-btn.png';
	import closePop from '$lib/img/close-pop.png';
	import visor3D from '$lib/img/visor3d.png';
	import visorAR from '$lib/img/visorAr.png';

	import {homePath, itemStorage, typeStorage, IS_DEV} from '$lib/Store.js';
	import fetchProducts from '$lib/FetchProducts.js';
	import Loader from '$lib/Loader.svelte';
	import { afterUpdate, onMount } from 'svelte';
    
	const [items, categories, loading, error, getter] = fetchProducts();
	let searchFirst = true;
	let searchQuery:any = [];
	let categorySelected="";
	let popup = false;
	let popupData = 
	{
		img:"",
		title:"",
		subtitle:"",
		price:0,
		body:"",
	}
	let producto = {};
	let image_url_completer = $homePath+"PlatillosThumbs";

	function search(category:any){
		console.log("BUSCAR:",category);
		categorySelected = category;
		if(category == null || category=="" || category == 0 ){
			categorySelected = "";
			searchQuery = $items.store;
		}else{
			searchQuery=[];
			$items.store.map((item)=>{
				if(item.category == category)
					searchQuery.push(item);
			})
		}
		return;
	}

	function popupShow(show,data){
		if(data == null || !show){
			popup = false;
			return;
		}else{
			popup = true;
			producto = data;
			popupData = 
			{
				img:data.assets.imageA,
				title:data.title,
				subtitle:data.subtitle,
				price:data.info.price,
				body:data.body,
			}
		}

	}

	function sendToViewer(type:any,item:any){
		$typeStorage = type;
		$itemStorage = item;
		setTimeout(()=>{window.location=$homePath+"productos";},200);
	}

	afterUpdate(() => {
		//Para buscar por primera vez nada más
		if(searchFirst){
		 search(null);
		 if($items && $items.store && $items.store.length > 0 ){
		 	searchFirst = false;
		 }
		}
	});
	
	$: console.log($typeStorage);
	
</script>

<svelte:head>
	<title>Menú AR</title>
	<meta name="description" content="Menú Restaurante AR" />
</svelte:head>

<section id="main-page">
	{#if $loading}
		<Loader/>
	{/if}
	{#if popup}
		<div class="popup-bg">
			<div class="popup">
				<button class="close-pop-btn" on:click="{()=>{popup=false}}"><img alt="Cerrar" src={closePop} class="img-close-pop"/> </button>
				<div class="pop-top"> <div class="pop-img-block"><img alt="Producto"src={image_url_completer+popupData.img}/></div> </div>
				<div class="pop-bot">
					<div class="popupbod">
						<h2>{popupData.title}</h2>
						<p>{popupData.subtitle}</p>
						<h2 style="font-size:18px;">{"$"+popupData.price}</h2>
						<p>{popupData.body}</p>	
					</div>
					<div class="btns-pop row">
						<div class="btn-pop col-6 row">
							<a sveltekit:prefetch  on:click={()=>{sendToViewer("AR",producto)}} class="btn-a-pop col-6"> <img alt="Ver en RA" src={visorAR} class="visorimg visorAr-icon"/></a>
							<span class="btn-span-pop col-6">Ver en Realidad Aumentada </span>
						</div>
						<div class="btn-pop col-6 row">
							<a sveltekit:prefetch  on:click={()=>{sendToViewer("3D",producto)}} class="btn-a-pop col-6"> <img alt="Ver en 3D" src={visor3D} class="visorimg visor3d-icon"/></a>
							<span class="btn-span-pop col-6">Ver en el visor 3D </span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	<h3 class="txt-center sz-25" style=" margin-top: 0px; margin-bottom:20px; ">
		¡Disfruta de nuestros
		<br/>
		<b>mejores platillos!</b>
	</h3>
	{#if $categories.length > 0 }
	<div class="select-combo">
		<select class="searchSelect" value={categorySelected} on:change="{(e) => {search(e.target.value)}}">
			<option value="" disabled>¿Qué desea buscar?</option>
			<option value="" >Todos</option>
			{#each $categories as category} 
				<option value={category}>{category}</option>
			{/each}
		</select>
	</div>
	{/if}
	{#if $categories.length > 0}
	<h2 class="txt-left sz-16" style="margin-top:20px;">Nuestras categorías</h2>
	<div class="grid-item main">
		<div class="items">
			<div class={"item item1"} class:active={categorySelected == ""}>
				<button class="btn-cat-carousel" class:active={categorySelected == ""} on:click={()=>{search("")}}>Todos</button>
			</div>
			{#each $categories as category, i}
			{#if $categories.length == i+1}
				<script lang="ts">
					console.log("COMPLETO!");
					const slider:any = document.querySelector('.items');
					let isDown = false;
					let startX:any;
					let scrollLeft:any;

					slider.addEventListener('mousedown', (e) => {
					isDown = true;
					slider.classList.add('active');
					startX = e.pageX - slider.offsetLeft;
					scrollLeft = slider.scrollLeft;
					});
					slider.addEventListener('mouseleave', () => {
					isDown = false;
					slider.classList.remove('active');
					});
					slider.addEventListener('mouseup', () => {
					isDown = false;
					slider.classList.remove('active');
					});
					slider.addEventListener('mousemove', (e) => {
					if(!isDown) return;
					e.preventDefault();
					const x = e.pageX - slider.offsetLeft;
					const walk = (x - startX) * 3; //scroll-fast
					slider.scrollLeft = scrollLeft - walk;
					console.log("Slider!");
					});
				</script>
			{/if}
			<div class={"item item"+(i+1)} class:active={categorySelected == ""}>
				<button class="btn-cat-carousel" class:active={categorySelected == category} on:click={()=>{search(category)}}>{category}</button>
			</div>
			{/each}
		</div>
	</div>
	{/if}
	{#if false}
	<!-- <h2 class="txt-left sz-16" style="margin-top:20px;">Nuestras categorías</h2>
		<div class="carousel row">
			<div class="carousel-block col-4" on:click="{()=>search("")}" class:active={categorySelected == ""}>Todos</div>
			{#each $categories as category} 
				<div class="carousel-block col-4" on:click="{()=>search(category)}" class:active={categorySelected == category}>
					{category}
				</div>
			{/each}
		</div> -->
		<!-- <pre>{JSON.stringify($items, null, 2)}</pre> -->
	{/if}

	{#if searchQuery && searchQuery.length > 0}
		<h2 class="txt-left sz-16" >Nuestros platillos</h2>
		<p class="txt-center">¡Haz clic en el ícono de <b>[AR]</b> para ver el platillo en realidad aumentada!</p>
		<div class="blocks-listado">
		{#each searchQuery as item}
			<div class="list-block row">
				<div class="col-reg col-3"> <img alt={item.title} src={image_url_completer+item.assets.imageA} class="list-block-img"/> </div>
				<div class="col-reg col-5">
					<p class="list-block-title">{item.title}</p>
					<p class="list-block-subtitle">{item.subtitle}</p>
					<p class="list-block-price">{"$"+item.info.price}</p>
				</div>
				<div class="col-reg col-4 row rowARinfo"> 
					<div class="col-reg col-7 iconoARblock" > <img on:click="{()=>{sendToViewer("AR",item)}}" alt="Realidad Aumentada" src={arbtn} class="list-block-AR"/> </div>
					<div class="col-reg col-5 iconoInfoblock" > <img on:click="{()=>{popupShow(true,item)}}" alt="Más información" src={info} class="list-block-INFO"/> </div>
				</div>
			</div>
		{/each}
		</div>
		<!-- <pre>{JSON.stringify($items, null, 2)}</pre> -->
	{/if}
	
</section>

<style lang="scss">
	section#main-page {
    padding: 0 20px;
}

select.searchSelect {
    width: 92%;
    margin: 0px auto;
    display: block;
    height: 45px;
    border-radius: 20px;
    padding: 0 10px;
    color: gray;
    background: white;
    border: none;
}

.select-combo {
    background: #e9e9e9;
    padding: 15px 0;
    border-radius: 41px;
}
.col-reg {
    padding: 10px 5px;
}
.iconoARblock{
	right:-5px;
}
.iconoInfoblock {
    width: 40px;
    height: 50px;
	right:-10px;
    display: block;
    position: relative;
}
img.list-block-INFO {
    height: 100%;
	width:100%;
}
.rowARinfo {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.carousel.row {
    display: flex;
    flex-wrap: nowrap;
}

.carousel-block {
    height: 50px;
    border-radius:15px;
    text-align:center;
    margin-left:10px;
    height: 55px;
    background: white;
    line-height: 55px;
}

.carousel.row {
    width: 100%;
    overflow: auto;
}
.carousel.row {
    margin: 20px 0;
    padding: 20px 0;
    background: #f2ecd2;
    border-radius: 15px;
    box-shadow: 0 0 5px 1px #00000033;
}
.carousel::-webkit-scrollbar {
  display: none;
}

.carousel {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.list-block {
    background: white;
    box-shadow: 0 0 5px 0 #00000033;
    border-radius: 15px;
    width: 100%;
    margin: 0px auto 15px auto;
}

.list-block p {
    margin: 0;
}

img.list-block-img {
    height: 100%;
    width: 100%;
    display: block;
}

p.list-block-title {font-weight: 600;}

p.list-block-subtitle {
    font-weight: 300;
    font-size: 14px;
}

p.list-block-price {
    font-weight: 800;
    margin-top: 5px;
}

img.list-block-AR {
    width: 100%;
}

img.list-block-INFO {
    width: 100%;
}
img.list-block-img {
	object-fit: scale-down;
	width: 100%;
    height: 100%;
	border-radius: 20px;
	display: block;
	position: relative;
}
.carousel-block.active {
    background: orange !important;
}

.carousel-block {
	transition:0.3s;
    font-weight: 500;
    height: 45px !important;
    line-height: 45px !important;
    border-radius: 40px !important;
}

.carousel {
    margin: 10px 0 !important;
}
.popupbod {
    /* height: 252px; */
    margin-bottom: 20px;
    padding-right: 20px;
    /* overflow-y: scroll; */
}
::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 7px;
}
::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgb(255 189 78 / 58%);
  -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, .5);
}
.pop-img-block {
    width: 100%;
    height: 100%;
}

.pop-img-block img {
    width: 100%;
    border-radius: 30px 30px 100px 100px;
    border: 4px solid #e2e2e2;
    display: block;
}

button.close-pop-btn {
    background: white;
    border-radius: 50%;
    width: 42px;
    height: 42px;
    top: 7px;
}

img.img-close-pop {
    display: block;
    position: relative;
}
a.btn-a-pop {padding: 0 0 20px 0px;}

img.visorimg {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

span.btn-span-pop {
    color: #edac3f;
    font-weight: 600;
    font-size: 14px;
    line-height: 16px;
    padding: 0 0 0 10px;
    top: -12px;
    margin: auto auto;
}

.btns-pop {
    width: 100%;
    margin: 0;
    display: inline-flex;
    justify-content: space-around;
    align-content: stretch;
    align-items: center;
}
img.list-block-INFO {
    width: 30px !important;
    height: 30px !important;
}
img.list-block-img {
    object-fit: cover !important;
    height: 70px !important;
    padding-left: 5px;
}

p.list-block-title {
    line-height: 16px;
}
@media(min-width:600px){
	img.list-block-AR {
		width: 70px !important;
	}

	img.list-block-INFO {
		width: 30px !important;
	}
}
@media(min-width:950px){
	.list-block {
    width: 45% !important;
    display: inline-flex;
    margin: 2% !important;
}
}

//VARIABLES BECAUSE CSS PREPROCESSORS ARE COOL
$gray: #555;
$yellow: #f2e968;
$white: #efefef;

//ENABLE CSS GRID FOR LIFT OFF  🚀
@supports(display: grid) {

  .grid-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto 1fr auto;
    
    //Let the craziness begin!!!
    grid-template-areas:
      "header header header"
      "title title footer"
      "main main main";
    @media screen and (max-width: 500px) {
      grid-template-columns: 1fr;
      grid-template-rows: 0.3fr 1fr auto 1fr;
      grid-template-areas: 
        "header"
        "title"
        "main"
        "footer";
    }
  }

  .main {
    color: lighten($gray, 25%);
    background-color: lighten(skyblue, 60%);
    grid-area: main;
    padding: 0;
    /*overflow-x: scroll;*/
    overflow-y: hidden;
	
  }

  .items {
    position: relative;
    width: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
    white-space: nowrap;
    transition: all 0.2s;
    transform: scale(0.98);
    will-change: transform;
    user-select: none;
    cursor: pointer;
  }

  .items.active {
    background: rgba(255,255,255,0.3);
    cursor: grabbing;
    cursor: -webkit-grabbing;
    transform: scale(1);
  }

  .item {
    display: inline-block;
    background: skyblue;
    min-height: 250px;
    min-width: 400px;
    margin: 2em 1em;
    @media screen and (max-width: 500px) {
      min-height: 200px;
      min-width: 200px;
    }
  }
}
.items::-webkit-scrollbar-thumb {
    background-color: #ffbd4e !important;
}
button.btn-cat-carousel {
    position: relative;
    display: block;
    margin: 20px auto;
    background: white;
    border-radius: 15px;
    width: 100%;
    padding: 10px 15px;
	border: none;
	transition:0.3s;
	cursor:pointer;
}
button.btn-cat-carousel.active {
    background: #ffbd4e;
    color: white;
}

.item {
    min-width: 30% !important;
    min-height: 90px !important;
    max-width: 30%;
    background: none !important;
    margin: 0px 10px !important;
}

.grid-item.main {
    background: #f2ecd2 !important;
    height: 105px;
    padding-bottom: 0 !important;
    margin-bottom: -5px;
	border-radius: 15px;
    box-shadow: 0 0 5px 2px #00000038;
    margin: 20px 0;
}
img.list-block-AR, img.list-block-INFO {
    cursor: pointer;
}
.blocks-listado {
    display: flex;
    flex-wrap: wrap;
}
select.searchSelect, button.btn-cat-carousel {
    text-transform: capitalize;
}
img.visorimg {
	max-width: 80px;
}
.pop-img-block img {
    object-fit: cover;
}
img.img-close-pop {
    width: 100% !important;
}

button.close-pop-btn {
    top: 15px !important;
    right: 15px !important;
}
@media(min-width:764px){
    
    span.btn-span-pop {
        font-size: 20px !important;
        line-height: 25px;
    }
}
</style>
