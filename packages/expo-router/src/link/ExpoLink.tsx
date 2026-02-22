'use client';

import React, { Children, isValidElement } from 'react';

import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { LinkWithPreview } from './LinkWithPreview';
import { LinkMenu, LinkPreview } from './elements';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkProps } from './useLinkHooks';
import { useZoomHref } from './zoom/useZoomHref';
import { shouldLinkExternally } from '../utils/url';
import { ZoomTransitionSourceContextProvider } from './zoom/zoom-transition-context-providers';

export function ExpoLink(props: LinkProps) {
  return (
    <ZoomTransitionSourceContextProvider linkProps={props}>
      <ExpoLinkImpl {...props} />
    </ZoomTransitionSourceContextProvider>
  );
}

function ExpoLinkImpl(props: LinkProps) {
  const isPreview = useIsPreview();
  const href = useZoomHref(props);
  const shouldUseLinkWithPreview =
    process.env.EXPO_OS === 'ios' && isLinkWithPreview(props) && !isPreview;
  if (shouldUseLinkWithPreview) {
    return <LinkWithPreview {...props} href={href} hrefForPreviewNavigation={props.href} />;
  }
  let children = props.children;
  if (React.Children.count(props.children) > 1) {
    const arrayChildren = React.Children.toArray(props.children).filter(
      (child) => !isValidElement(child) || (child.type !== LinkPreview && child.type !== LinkMenu)
    );
    children = arrayChildren.length === 1 ? arrayChildren[0] : props.children;
  }

  return <BaseExpoRouterLink {...props} href={href} children={children} />;
}

function isLinkWithPreview(props: LinkProps): boolean {
  const isExternal = shouldLinkExternally(String(props.href));
  return Children.toArray(props.children).some(
    (child) =>
      isValidElement(child) &&
      ((!isExternal && child.type === LinkPreview) || child.type === LinkMenu)
  );
}
