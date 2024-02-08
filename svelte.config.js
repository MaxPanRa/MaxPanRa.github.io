// import adapter from '@sveltejs/adapter-auto';
// import adapter from '@sveltejs/adapter-node';
import adapter from '@sveltejs/adapter-static';

import preprocess from 'svelte-preprocess';

const dev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		paths: {
			base: dev ? '' : '',
		},
		adapter: adapter({ 
			out: 'docs',
			pages: 'docs',
			assets: 'docs',
			fallback: null,
			precompress: false, 
		}),
		trailingSlash: 'always',
		prerender: {
			default: true
		  },
		// Override http methods in the Todo forms
		methodOverride: {
			allowed: ['PATCH', 'DELETE']
		}
	}
};

export default config;
