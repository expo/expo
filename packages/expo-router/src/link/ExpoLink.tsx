'use client';

import Constants from 'expo-constants';
import React, { Children, isValidElement } from 'react';

import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { LinkWithPreview } from './LinkWithPreview';
import { LinkMenu, LinkPreview } from './elements';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkProps } from './useLinkHooks';

export function ExpoLink(props: LinkProps) {
  const isPreview = useIsPreview();
  if (
    process.env.EXPO_OS === 'ios' &&
    isLinkWithPreview(props) &&
    !isPreview &&
    Constants?.expoConfig?.newArchEnabled !== false
  ) {
    return <LinkWithPreview {...props} />;
  }
  let children = props.children;
  if (React.Children.count(props.children) > 1) {
    const arrayChildren = React.Children.toArray(props.children).filter(
      (child) => !isValidElement(child) || (child.type !== LinkPreview && child.type !== LinkMenu)
    );
    children = arrayChildren.length === 1 ? arrayChildren[0] : props.children;
  }

  return <BaseExpoRouterLink {...props} children={children} />;
}

function isLinkWithPreview(props: LinkProps): boolean {
  return Children.toArray(props.children).some(
    (child) => isValidElement(child) && (child.type === LinkPreview || child.type === LinkMenu)
  );
}
