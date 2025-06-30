'use client';

import Constants from 'expo-constants';
import { Children, isValidElement } from 'react';

import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { LinkPreview, LinkWithPreview } from './LinkWithPreview';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkProps } from './useLinkHooks';

export function ExpoLink(props: LinkProps) {
  const isPreview = useIsPreview();
  if (isLinkWithPreview(props) && !isPreview && Constants?.expoConfig?.newArchEnabled !== false) {
    return <LinkWithPreview {...props} />;
  }
  return <BaseExpoRouterLink {...props} />;
}

function isLinkWithPreview(props: LinkProps): boolean {
  return Children.toArray(props.children).some(
    (child) => isValidElement(child) && child.type === LinkPreview
  );
}
