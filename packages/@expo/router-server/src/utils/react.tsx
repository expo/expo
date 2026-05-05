import type { ServerFontResourceDescriptor } from 'expo-font';
import { type ReactNode } from 'react';

import { getHydrationFlagScriptContents, getLoaderDataScriptContents } from './html';

type CreateNodeResult = {
  headNodes?: ReactNode[];
  bodyNodes?: ReactNode[];
};

export function createInjectedCssAsNodes(hrefs: string[]): CreateNodeResult {
  return {
    headNodes: hrefs.flatMap((href) => [
      <link key={`css-preload-${href}`} rel="preload" href={href} as="style" />,
      <link key={`css-stylesheet-${href}`} rel="stylesheet" href={href} />,
    ]),
  };
}

export function createInjectedScriptAsNodes(srcs: string[]): CreateNodeResult {
  return {
    headNodes: srcs.map((src) => (
      <link key={`script-preload-${src}`} rel="preload" href={src} as="script" />
    )),
    bodyNodes: srcs.map((src) => <script key={`script-src-${src}`} defer src={src} />),
  };
}

export function getBootstrapContents({
  hydrate = true,
  loadedData,
}: {
  hydrate: boolean;
  loadedData: Record<string, unknown> | null;
}): string {
  const parts = [];

  if (hydrate) {
    parts.push(getHydrationFlagScriptContents());
  }

  if (loadedData) {
    parts.push(getLoaderDataScriptContents(loadedData));
  }

  return parts.join('\n');
}

export function createInjectedFontsAsNodes(
  descriptors: ServerFontResourceDescriptor[]
): ReactNode[] {
  return descriptors.map((descriptor) => {
    switch (descriptor.type) {
      case 'style':
        return (
          <style
            key={`font-style-${descriptor.id}`}
            id={descriptor.id}
            dangerouslySetInnerHTML={{ __html: descriptor.css }}
          />
        );
      case 'link':
        return (
          <link
            key={`font-link-${descriptor.href}`}
            rel={descriptor.rel}
            href={descriptor.href}
            as={descriptor.as}
            crossOrigin={descriptor.crossOrigin}
          />
        );
      default:
        return null;
    }
  });
}
