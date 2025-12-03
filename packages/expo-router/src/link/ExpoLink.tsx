'use client';

import Constants from 'expo-constants';
import React, { Children, isValidElement } from 'react';

import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { LinkWithPreview } from './LinkWithPreview';
import { LinkMenu, LinkPreview } from './elements';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkProps } from './useLinkHooks';
import { useZoomTransitionPrimitives } from './zoom/useZoomTransitionPrimitives';
import { shouldLinkExternally } from '../utils/url';
import { ZoomTransitionSourceContext } from './zoom/zoom-transition-context';

export function ExpoLink(props: LinkProps) {
  const isPreview = useIsPreview();
  const { zoomTransitionSourceContextValue, href } = useZoomTransitionPrimitives(props);
  const shouldUseLinkWithPreview =
    process.env.EXPO_OS === 'ios' &&
    isLinkWithPreview(props) &&
    !isPreview &&
    Constants?.expoConfig?.newArchEnabled !== false;
  if (shouldUseLinkWithPreview) {
    return (
      <ZoomTransitionSourceContext value={zoomTransitionSourceContextValue}>
        <LinkWithPreview {...props} href={href} hrefForPreviewNavigation={props.href} />
      </ZoomTransitionSourceContext>
    );
  }
  let children = props.children;
  if (React.Children.count(props.children) > 1) {
    const arrayChildren = React.Children.toArray(props.children).filter(
      (child) => !isValidElement(child) || (child.type !== LinkPreview && child.type !== LinkMenu)
    );
    children = arrayChildren.length === 1 ? arrayChildren[0] : props.children;
  }

  return (
    <ZoomTransitionSourceContext value={zoomTransitionSourceContextValue}>
      <BaseExpoRouterLink {...props} href={href} children={children} />
    </ZoomTransitionSourceContext>
  );
}

function isLinkWithPreview(props: LinkProps): boolean {
  const isExternal = shouldLinkExternally(String(props.href));
  return Children.toArray(props.children).some(
    (child) =>
      isValidElement(child) &&
      ((!isExternal && child.type === LinkPreview) || child.type === LinkMenu)
  );
}
