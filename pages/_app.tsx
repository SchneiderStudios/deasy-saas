import type { AppProps } from 'next/app';
import Head from 'next/head';
// Шрифт хранится на нашем сайте (без Google Fonts — важно для Datenschutz)
import '@fontsource/golos-text/400.css';
import '@fontsource/golos-text/500.css';
import '@fontsource/golos-text/600.css';
import '@fontsource/golos-text/800.css';
import '@/styles/globals.css';

export default function DeasyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2b4fd8" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
