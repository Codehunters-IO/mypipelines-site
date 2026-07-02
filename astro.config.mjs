import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import pagefind from 'astro-pagefind';

export default defineConfig({
  output: 'static',
  site: 'https://mypipelines.vercel.app',
  integrations: [
    expressiveCode({
      themes: ['dracula', 'github-light'],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => {
        if (theme.name === 'dracula') return 'html.dark';
        if (theme.name === 'github-light') return 'html:not(.dark)';
        return false;
      },
      plugins: [pluginLineNumbers()],
      defaultProps: {
        showLineNumbers: false,
        overridesByLang: { 'bash,sh,zsh': { showLineNumbers: false, wrap: false } },
      },
    }),
    mdx(),
    pagefind(),
  ],
  vite: { plugins: [tailwindcss()] },
});
