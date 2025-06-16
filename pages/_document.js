import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="de">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Weitere globale Tags wie Favicon, Meta-Description usw. */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
