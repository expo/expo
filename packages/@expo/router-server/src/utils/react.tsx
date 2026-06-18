import type { ServerFontResourceDescriptor } from 'expo-font';
import type { CssAsset } from 'expo-server/private';
import { type ReactNode } from 'react';

import { getHydrationFlagScriptContents, getLoaderDataScriptContents } from './html';

type CreateNodeResult = {
  headNodes?: ReactNode[];
  bodyNodes?: ReactNode[];
};

/**
 * Renders the ordered CSS asset list as `<head>` nodes, walking the list in order so the caller
 * controls the cascade and the bundled/external source-order interleave is preserved. Each entry is
 * rendered by its `type`:
 * - `css`: a `<link rel="preload">` + `<link rel="stylesheet">` pair.
 * - `external`: a `<link rel="stylesheet">` preserving `media`.
 * - `inline`: a `<style>` tag carrying its HMR id (development only).
 */
export function createInjectedCssAsNodes(css: CssAsset[] = []): CreateNodeResult {
  return {
    headNodes: css.flatMap((asset, index) => {
      switch (asset.type) {
        case 'css':
          return [
            <link key={`css-preload-${asset.href}`} rel="preload" href={asset.href} as="style" />,
            <link key={`css-stylesheet-${asset.href}`} rel="stylesheet" href={asset.href} />,
          ];
        case 'external':
          return [
            <link
              key={`css-external-${asset.href}-${asset.media ?? ''}`}
              rel="stylesheet"
              href={asset.href}
              media={asset.media}
            />,
          ];
        case 'inline':
          return [
            <style
              key={asset.hmrId ? `inline-css-${asset.hmrId}` : `inline-css-${index}`}
              data-expo-css-hmr={asset.hmrId}
              dangerouslySetInnerHTML={{ __html: asset.source }}
            />,
          ];
      }
    }),
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

export function createFaviconAsNode(href: string): ReactNode {
  return <link key="favicon" rel="icon" href={href} />;
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
