import {defineConfig} from 'astro/config';

export default defineConfig({
  site: 'https://bryanyao.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
