import { getThemeFromCookieHeader } from '@expo/styleguide';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentProps,
} from 'next/document';

type Props = DocumentProps & {
  serverTheme: 'dark' | 'light' | null;
};

export default function DocsDocument({ serverTheme }: Props) {
  return (
    <Html
      lang="en"
      className={serverTheme === 'dark' ? 'dark-theme' : undefined}
      data-expo-theme={serverTheme ?? undefined}
      suppressHydrationWarning>
      <Head>
        {!serverTheme && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark-theme")}})()`,
            }}
          />
        )}
      </Head>
      <body className="text-pretty">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

DocsDocument.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await Document.getInitialProps(ctx);
  const cookieHeader = ctx.req?.headers?.cookie;
  const serverTheme = cookieHeader ? getThemeFromCookieHeader(cookieHeader) : null;
  return { ...initialProps, serverTheme };
};
