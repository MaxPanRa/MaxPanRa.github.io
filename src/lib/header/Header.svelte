<script lang="ts">
	import { page } from '$app/stores';
	import open from '$lib/img/menu-icon.png';
    import close from '$lib/img/close.png';
    import homeIcon from '$lib/img/home-nav.png';
	import restaurantLogo from '$lib/img/restaurant-logo.png';
    import returnArrow from '$lib/img/return-arrow.png';
	import jquery from 'jquery';
    import { beforeUpdate } from 'svelte';
    import { homePath, pathRoute, IS_DEV } from '$lib/Store';

    let path:any = $homePath;
    let pathProductos:any = IS_DEV ? "/productos" : "/"+$pathRoute+"/productos";
    beforeUpdate(() => {
		path = window.location.pathname;
	});

	function menuToggle(){
        jquery(".side-bg-menu").toggleClass("disabled-side-bg-menu");
		jquery(".side-menu").toggleClass("disabled-side-menu");
        jquery(".menu-btn-img, .menu-btn-txt").fadeToggle("hidden");
	}
</script>

<header id="header">
    {#if path.includes(pathProductos)}
    <div class="corner">
		<a id="return-arrow" on:click={()=>{window.location = $homePath}}>
			<img class="return-arrow-img" src={returnArrow} alt="Volver" />
		</a>
	</div>
    {:else }
    <div class="corner menu-icon-corner">
		<button id="menuBtn" on:click={menuToggle}>
			<img src={open} class="menu-btn-img" alt="Menú" />
            <img src={close} class="menu-btn-img hidden" alt="Menú" />
			<span class="menu-btn-txt">Menú</span>
		</button>
	</div>
    <div class="side-bg-menu disabled-side-bg-menu">
        <nav class="side-menu disabled-side-menu">
            <div class="side-menu-body">
                <div class="side-menu-body-block row">
                    <div class="side-menu-title-img col-3"> <img class="side-menu-nav-logo" src={restaurantLogo} alt="¡Bienvenido!" /> </div>
                    <div class="side-menu-title-txt col-9">
                        <h3 class="txt-left sz-25" style=" margin-top: 0px; ">
                            ¡Bienvenido a
                            <br/>
                            <b>tu Restaurante!</b>
                        </h3>
                    </div>
                    <p class="side-menu-nav-p">
                        ¡Explora todas las opciones y categorías que tenemos para tí!
                    </p>
                </div>
            </div>
            <ul>
                <li class="page-li" class:active={$homePath}>
                    <img width="40" class="nav-icon" alt="Ir a Inicio" src={homeIcon}/>
                    <a sveltekit:prefetch href={$homePath} on:click="{()=>{menuToggle()}}">Inicio</a>
                </li>
            </ul>
        </nav>
    </div>
    <div class="corner logo-corner">
		<a id="company-logo" href={$homePath}>
			<img src={restaurantLogo} alt="Ir a Inicio" />
		</a>
	</div>
    {/if}
</header>

<style>
.return-arrow-img {
    padding: 10px 10px;
    height: 50px;
}
.page-li a {
    color: black;
    text-decoration: none !important;
}
.menu-btn-img {
    position: absolute;
    left: 30px;
    top: 30px;
}
.page-li {
    list-style: none;
    margin-bottom: 10px;
    font-size: 18px;
}
button#menuBtn {
    background: none;
    border: none;
    outline: none;
    margin: 15px 20px 10px 20px;
    width: 40px;
    height: 40px;
}

header#header {
    display: flex;
    justify-content: space-between;
}

.side-menu {
    transition:0.6s;
    position: fixed;
    height: 100%;
    background: orange;
    z-index: 1;
    width: 80%;
    padding-top: 70px;
    left:0;
}
@media (min-width:1000px){
    .side-menu {
        position: fixed;
        height: 100%;
        background: orange;
        z-index: 1;
        width: 30%;
    }
}
.disabled-side-menu {
    left:-100%;
}
.corner.menu-icon-corner {
    z-index: 2;
}

button#menuBtn img {
    width: 25px;
}

a#company-logo img {
    width: 40px;
}

a#company-logo {
    margin: 15px 20px 10px 20px;
    width: 40px;
    height: 40px;
    display: block;
}
span.menu-btn-txt {
    position: absolute;
    top: 24px;
    left: 65px;
}
.side-menu-title-txt h3 {
    font-size: 23px;
}

img.side-menu-nav-logo {
    width: 100%;
    margin: 0 auto;
    display: block;
    padding: 10px !important;
    background: white;
}

.side-menu-title-img {
    padding: 0;
}

.side-bg-menu {
    background: #00000038;
    width: 100%;
    position: fixed;
    height: 100%;
    z-index: 1;
}

.side-menu-body-block {
    width: 100%;
    position: relative;
    margin: 30px 0px 0px 0 !important;
    padding: 0 15px;
}

img.side-menu-nav-logo {
    border-radius: 50%;
    height: 60px;
    width: 60px;
}

p.side-menu-nav-p {
    margin-top: 30px;
    margin-bottom: 30px;
}

img.nav-icon {
    width: 25px;
    margin-right: 15px;
    margin-left: -20px;
}

img.nav-icon + a {
    top: 1px;
    display: inline-block;
    position: relative;
}
nav.side-menu {
    box-shadow: 0 0 5px 6px #00000030;
    border-radius: 0 40px 0 0;
}
.side-bg-menu{
    transition:0.65s;
    left:0;   
    border-radius:0;
}
.disabled-side-bg-menu{
    left:-100% !important;
    border-radius:100px;
}
</style>
