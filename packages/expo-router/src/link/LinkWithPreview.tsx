'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useRouter } from '../hooks';
import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { InternalLinkPreviewContext } from './InternalLinkPreviewContext';
import { LinkMenu, LinkPreview, LinkTrigger } from './elements';
import { resolveHref } from './href';
import type { Href } from '../types';
import { useLinkPreviewContext } from './preview/LinkPreviewContext';
import { NativeLinkPreview } from './preview/native';
import { useNextScreenId } from './preview/useNextScreenId';
import { LinkProps } from './useLinkHooks';
import { store } from '../global-state/router-store';
import { getFirstChildOfType } from '../utils/children';
import { shouldLinkExternally } from '../utils/url';

const isPad = Platform.OS === 'ios' && Platform.isPad;

interface LinkWithPreviewProps extends LinkProps {
  hrefForPreviewNavigation: Href;
}

export function LinkWithPreview({ children, ...rest }: LinkWithPreviewProps) {
  const router = useRouter();
  const { setOpenPreviewKey } = useLinkPreviewContext();
  const [isCurrentPreviewOpen, setIsCurrenPreviewOpen] = useState(false);

  const hrefWithoutQuery = resolveHref(rest.hrefForPreviewNavigation).split('?')[0];
  const prevHrefWithoutQuery = useRef(hrefWithoutQuery);

  useEffect(() => {
    if (isCurrentPreviewOpen) {
      if (prevHrefWithoutQuery.current !== hrefWithoutQuery) {
        throw new Error(
          'Link does not support changing the href prop after the preview has been opened. Please ensure that the href prop is stable and does not change between renders.'
        );
      }
    } else {
      prevHrefWithoutQuery.current = hrefWithoutQuery;
    }
  }, [hrefWithoutQuery]);

  const [{ nextScreenId, tabPath }, prefetch] = useNextScreenId();

  useEffect(() => {
    if (rest.replace) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error('Using replace links with preview is not supported');
      } else {
        console.warn('Using replace links with preview is not supported');
      }
    }
  }, [rest.href, rest.replace]);

  const triggerElement = React.useMemo(
    () => getFirstChildOfType(children, LinkTrigger),
    [children]
  );
  const menuElement = React.useMemo(() => getFirstChildOfType(children, LinkMenu), [children]);
  const previewElement = React.useMemo(
    () => getFirstChildOfType(children, LinkPreview),
    [children]
  );

  if ((previewElement || menuElement) && !triggerElement) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        'When you use Link.Preview, you must use Link.Trigger to specify the trigger element.'
      );
    } else {
      console.warn(
        'When you use Link.Preview, you must use Link.Trigger to specify the trigger element.'
      );
    }
  }

  const trigger = React.useMemo(
    () => triggerElement ?? <LinkTrigger>{children}</LinkTrigger>,
    [triggerElement, children]
  );

  const preview = React.useMemo(
    () => (shouldLinkExternally(String(rest.href)) || !previewElement ? null : previewElement),
    [previewElement, rest.href]
  );

  const isPreviewTapped = useRef(false);

  const tabPathValue = useMemo(
    () => ({
      path: tabPath,
    }),
    [tabPath]
  );

  const hasPreview = !!previewElement;

  if (rest.replace) {
    return <BaseExpoRouterLink children={children} {...rest} />;
  }

  const navigateUsingPreview = () => {
    const info = store.getRouteInfo();
    // If the href is the same and nextScreenId is not set, then we don't need to navigate
    // The screen is already on top of the stack
    if (hrefWithoutQuery !== info.pathname || nextScreenId) {
      router.push(rest.href, { __internal__PreviewKey: nextScreenId });
    }
  };

  return (
    <NativeLinkPreview
      nextScreenId={isPad ? undefined : nextScreenId}
      tabPath={isPad ? undefined : tabPathValue}
      onWillPreviewOpen={() => {
        if (hasPreview) {
          isPreviewTapped.current = false;
          prefetch(rest.hrefForPreviewNavigation);
          setIsCurrenPreviewOpen(true);
        }
      }}
      onPreviewWillClose={() => {
        if (hasPreview) {
          setIsCurrenPreviewOpen(false);
          // When preview was not tapped, then we need to enable the screen stack animation
          // Otherwise this will happen in StackNavigator, when new screen is opened
          if (!isPreviewTapped.current || isPad) {
            setOpenPreviewKey(undefined);
          }
        }
      }}
      onPreviewDidClose={() => {
        if (hasPreview && isPreviewTapped.current && isPad) {
          navigateUsingPreview();
        }
      }}
      onPreviewTapped={() => {
        isPreviewTapped.current = true;
        if (!isPad) {
          navigateUsingPreview();
        }
      }}
      style={{ display: 'contents' }}
      disableForceFlatten>
      <InternalLinkPreviewContext
        value={{ isVisible: isCurrentPreviewOpen, href: rest.hrefForPreviewNavigation }}>
        <BaseExpoRouterLink {...rest} children={trigger} ref={rest.ref} />
        {preview}
        {menuElement}
      </InternalLinkPreviewContext>
    </NativeLinkPreview>
  );
}
