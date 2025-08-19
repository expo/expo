'use client';

import Constants from 'expo-constants';
import React, { Children, isValidElement, type ComponentProps, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { LinkWithPreview } from './LinkWithPreview';
import { LinkMenu, LinkPreview, LinkTrigger } from './elements';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkProps } from './useLinkHooks';
import { shouldLinkExternally } from '../utils/url';

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
  let { children, asChild, style, ...rest } = props;
  if (React.Children.count(children) > 1) {
    const arrayChildren = React.Children.toArray(children).filter(
      (child) => !isValidElement(child) || (child.type !== LinkPreview && child.type !== LinkMenu)
    );
    children = arrayChildren.length === 1 ? arrayChildren[0] : children;
  } else {
    if (isValidElement(children) && children.type === LinkTrigger) {
      const trigger = children as ReactElement<ComponentProps<typeof LinkTrigger>>;
      children = trigger.props.children;
      style = StyleSheet.flatten([trigger.props.style, style]);
      asChild = asChild === undefined ? trigger.props.asChild : asChild;
    }
  }

  return <BaseExpoRouterLink {...rest} style={style} asChild={asChild} children={children} />;
}

function isLinkWithPreview(props: LinkProps): boolean {
  const isExternal = shouldLinkExternally(String(props.href));
  return Children.toArray(props.children).some(
    (child) =>
      isValidElement(child) &&
      ((!isExternal && child.type === LinkPreview) || child.type === LinkMenu)
  );
}
