'use client';

import React, {
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Platform } from 'react-native';

import { useRouter } from '../hooks';
import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { InternalLinkPreviewContext } from './InternalLinkPreviewContext';
import { LinkMenu, LinkPreview, LinkTrigger } from './elements';
import { useLinkPreviewContext } from './preview/LinkPreviewContext';
import { NativeLinkPreview, NativeLinkPreviewTrigger } from './preview/native';
import { useNextScreenId } from './preview/useNextScreenId';
import { LinkProps } from './useLinkHooks';
import { shouldLinkExternally } from '../utils/url';

const isPad = Platform.OS === 'ios' && Platform.isPad;

export function LinkWithPreview({ children, ...rest }: LinkProps) {
  const router = useRouter();
  const { setOpenPreviewKey } = useLinkPreviewContext();
  const [isCurrentPreviewOpen, setIsCurrenPreviewOpen] = useState(false);

  const hrefWithoutQuery = String(rest.href).split('?')[0];
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
  const highlightBorderRadius =
    rest.style && 'borderRadius' in rest.style ? rest.style.borderRadius : undefined;

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

  return (
    <NativeLinkPreview
      nextScreenId={isPad ? undefined : nextScreenId}
      tabPath={isPad ? undefined : tabPathValue}
      onWillPreviewOpen={() => {
        if (hasPreview) {
          isPreviewTapped.current = false;
          prefetch(rest.href);
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
          router.navigate(rest.href, { __internal__PreviewKey: nextScreenId });
        }
      }}
      onPreviewTapped={() => {
        isPreviewTapped.current = true;
        if (!isPad) {
          router.navigate(rest.href, { __internal__PreviewKey: nextScreenId });
        }
      }}>
      <InternalLinkPreviewContext value={{ isVisible: isCurrentPreviewOpen, href: rest.href }}>
        <NativeLinkPreviewTrigger style={{ borderRadius: highlightBorderRadius }}>
          <BaseExpoRouterLink {...rest} children={trigger} ref={rest.ref} />
        </NativeLinkPreviewTrigger>
        {preview}
        {menuElement}
      </InternalLinkPreviewContext>
    </NativeLinkPreview>
  );
}

function getFirstChildOfType<PropsT>(
  children: React.ReactNode | React.ReactNode[],
  type: (props: PropsT) => unknown
) {
  return React.Children.toArray(children).find(
    (child): child is ReactElement<PropsT> => isValidElement(child) && child.type === type
  );
}
