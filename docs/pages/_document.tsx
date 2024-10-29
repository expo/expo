import { BlockingSetInitialColorMode } from '@expo/styleguide';
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

export default class DocsDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: <>{initialProps.styles}</>,
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body className="text-pretty">
          <BlockingSetInitialColorMode />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
