'use client';

import React, {
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';

import { useRouter } from '../hooks';
import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { InternalLinkPreviewContext } from './InternalLinkPreviewContext';
import { LinkMenu, LinkPreview, LinkTrigger } from './elements';
import { useLinkPreviewContext } from './preview/LinkPreviewContext';
import { NativeLinkPreview, NativeLinkPreviewTrigger } from './preview/native';
import { useNextScreenId } from './preview/useNextScreenId';
import { LinkProps } from './useLinkHooks';
import { shouldLinkExternally } from '../utils/url';

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
    if (shouldLinkExternally(String(rest.href))) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error('External links previews are not supported');
      } else {
        console.warn('External links previews are not supported');
      }
    }
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

  const preview = React.useMemo(() => previewElement ?? null, [previewElement, rest.href]);

  const isPreviewTapped = useRef(false);

  const tabPathValue = useMemo(
    () => ({
      path: tabPath,
    }),
    [tabPath]
  );

  if (shouldLinkExternally(String(rest.href)) || rest.replace) {
    return <BaseExpoRouterLink children={children} {...rest} />;
  }

  return (
    <NativeLinkPreview
      nextScreenId={nextScreenId}
      tabPath={tabPathValue}
      onWillPreviewOpen={() => {
        isPreviewTapped.current = false;
        prefetch(rest.href);
        setIsCurrenPreviewOpen(true);
      }}
      onPreviewWillClose={() => {
        setIsCurrenPreviewOpen(false);
        // When preview was not tapped, then we need to enable the screen stack animation
        // Otherwise this will happen in StackNavigator, when new screen is opened
        if (!isPreviewTapped.current) {
          setOpenPreviewKey(undefined);
        }
      }}
      onPreviewTapped={() => {
        isPreviewTapped.current = true;
        router.navigate(rest.href, { __internal__PreviewKey: nextScreenId });
      }}>
      <InternalLinkPreviewContext value={{ isVisible: isCurrentPreviewOpen, href: rest.href }}>
        <NativeLinkPreviewTrigger>
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
