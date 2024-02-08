import { writable, get } from 'svelte/store';
import { browser } from '$app/env';
import {webURL} from "$lib/Constants.js";
export const IS_DEV = writable(process.env.NODE_ENV === 'development');
export const pathRoute = writable("menuxr");
export const homePath = writable (process.env.NODE_ENV === 'development' ? "/" : webURL);
export const typeStorage = writable("");
export const itemStorage = writable({});

typeStorage.subscribe((value) => {
    if(value.length > 0 )
        if (browser) {
            // debugger;
            console.log("-------- TYPE CHANGED!",value);
            window.localStorage.setItem('typeStorage', value);
        }
});
itemStorage.subscribe((value) => {
    if(Object.keys(value).length > 0)
        if (browser) {
            // debugger;
            console.log("-------- ITEM CHANGED!",value);
            window.localStorage.setItem('itemStorage', JSON.stringify(value));
        }
});

export const getStoreVariable = (name) =>{
    let defaultValue = "";
    let currentValue = browser ? window.localStorage.getItem(name) ?? defaultValue : defaultValue;
    return currentValue;
}
