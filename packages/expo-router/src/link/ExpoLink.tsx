'use client';

import Constants from 'expo-constants';
import React, { Children, isValidElement } from 'react';

import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { LinkWithPreview } from './LinkWithPreview';
import { LinkMenu, LinkPreview } from './elements';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkProps } from './useLinkHooks';
import { useZoomTransitionPrimitives } from './useZoomTransitionPrimitives';
import { shouldLinkExternally } from '../utils/url';

export function ExpoLink(props: LinkProps) {
  const isPreview = useIsPreview();
  const { ZoomTransitionWrapper, href } = useZoomTransitionPrimitives(props);
  const shouldUseLinkWithPreview =
    process.env.EXPO_OS === 'ios' &&
    isLinkWithPreview(props) &&
    !isPreview &&
    Constants?.expoConfig?.newArchEnabled !== false;
  if (shouldUseLinkWithPreview) {
    return (
      <ZoomTransitionWrapper>
        <LinkWithPreview {...props} href={href} hrefForPreviewNavigation={props.href} />
      </ZoomTransitionWrapper>
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
    <ZoomTransitionWrapper>
      <BaseExpoRouterLink {...props} href={href} children={children} />
    </ZoomTransitionWrapper>
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
