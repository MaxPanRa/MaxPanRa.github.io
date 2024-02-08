import { writable, derived } from 'svelte/store';
import { homePath, IS_DEV } from './Store';
import {webURL} from "$lib/Constants.js";
export default function () {
	const loading = writable(false);
	const error = writable(false);
	const data = writable({});
	const categories = writable([]);
	const ligaHome = window.location.href.toUpperCase().includes("AURAXR") ? webURL : webURL;
    var url = ligaHome+'data.json';
	if(IS_DEV){
		url = "/data.json";
	}
	
	async function get() {
		loading.set(true)
		error.set(false)
		try {
			const response = await fetch(url)
			const responseJSON = await response.json();
			data.set(responseJSON)
			let cat  = [];
			responseJSON.store.map(res=>{
				if(!cat.find(a=>a==res.category)){
					cat.push(res.category);
				}
			});
			// @ts-ignore
			categories.set(cat);
			loading.set(false);
		} catch(e) {
			// @ts-ignore
			error.set(e)
		}
		loading.set(false);
	}
	
	get()
	
	return [ data, categories, loading, error, get];
}