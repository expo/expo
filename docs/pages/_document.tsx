import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default class DocsDocument extends Document {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: <>{initialProps.styles}</>,
    };
  }

  render() {
    return (
      <Html lang="en" data-expo-theme>
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark-theme")}})()`,
            }}
          />
        </Head>
        <body className="text-pretty">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
