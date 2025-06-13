'use client';

import React, {
  createContext,
  isValidElement,
  use,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { useRouter } from '../hooks';
import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { HrefPreview } from './preview/HrefPreview';
import { useLinkPreviewContext } from './preview/LinkPreviewContext';
import {
  LinkPreviewNativeActionView,
  LinkPreviewNativePreviewView,
  LinkPreviewNativeTriggerView,
  LinkPreviewNativeView,
} from './preview/native';
import { useScreenPreload } from './preview/useScreenPreload';
import { LinkProps } from './useLinkHooks';
import { shouldLinkExternally } from '../utils/url';
import { useIsPreview } from './preview/PreviewRouteContext';
import { Slot } from '../ui/Slot';

const InternalLinkPreviewContext = createContext<
  { isVisible: boolean; href: LinkProps['href'] } | undefined
>(undefined);

export function LinkWithPreview({ experimentalPreview, children, ...rest }: LinkProps) {
  const router = useRouter();
  const { setIsPreviewOpen } = useLinkPreviewContext();
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

  const { preload, updateNavigationKey, navigationKey } = useScreenPreload(hrefWithoutQuery);

  useEffect(() => {
    if (shouldLinkExternally(String(rest.href))) {
      console.warn('External links previews are not supported');
    }
    if (rest.replace) {
      console.warn('Using replace links with preview is not supported');
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

  if (previewElement && !triggerElement) {
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

  const actionsHandlers = React.useMemo(
    () => convertLinkMenuItemsToActionsHandlers(ensureArray(menuElement?.props.children)),
    [menuElement]
  );
  const preview = React.useMemo(
    () => previewElement ?? <LinkPreview />,
    [previewElement, rest.href]
  );

  if (shouldLinkExternally(String(rest.href)) || rest.replace) {
    return <BaseExpoRouterLink children={children} {...rest} />;
  }

  return (
    <LinkPreviewNativeView
      nextScreenId={navigationKey}
      onActionSelected={({ nativeEvent: { id } }) => {
        actionsHandlers[id]?.();
      }}
      onWillPreviewOpen={() => {
        preload();
        setIsPreviewOpen(true);
        setIsCurrenPreviewOpen(true);
      }}
      onDidPreviewOpen={() => {
        updateNavigationKey();
      }}
      onPreviewWillClose={() => {}}
      onPreviewDidClose={() => {
        setIsPreviewOpen(false);
        setIsCurrenPreviewOpen(false);
      }}
      onPreviewTapped={() => {
        router.navigate(rest.href, { __internal__PreviewKey: navigationKey });
      }}>
      <InternalLinkPreviewContext value={{ isVisible: isCurrentPreviewOpen, href: rest.href }}>
        <LinkPreviewNativeTriggerView>
          <BaseExpoRouterLink {...rest} children={trigger} ref={rest.ref} />
        </LinkPreviewNativeTriggerView>
        {preview}
        {menuElement}
      </InternalLinkPreviewContext>
    </LinkPreviewNativeView>
  );
}

function convertLinkMenuItemsToActionsHandlers(
  items: React.ReactElement<LinkMenuItemProps, string | React.JSXElementConstructor<any>>[]
) {
  return items
    .filter((item) => isValidElement(item) && item.type === LinkMenuItem)
    .reduce(
      (acc, item) => ({
        ...acc,
        [item.props.title]: item.props.onPress,
      }),
      {} as Record<string, () => void>
    );
}

function ensureArray<T>(maybeArray: T | T[] | undefined): T[] {
  if (maybeArray) {
    if (Array.isArray(maybeArray)) {
      return maybeArray;
    }
    return [maybeArray];
  }
  return [];
}

function getFirstChildOfType<PropsT>(
  children: React.ReactNode | React.ReactNode[],
  type: (props: PropsT) => unknown
) {
  return React.Children.toArray(children).find(
    (child): child is ReactElement<PropsT> => isValidElement(child) && child.type === type
  );
}

interface LinkMenuItemProps {
  title: string;
  onPress: () => void;
}

export function LinkMenuItem(_: LinkMenuItemProps) {
  return null;
}
interface LinkMenuProps {
  children: ReactElement<LinkMenuItemProps> | ReactElement<LinkMenuItemProps>[];
}

export function LinkMenu({ children }: LinkMenuProps) {
  if (useIsPreview() || !use(InternalLinkPreviewContext)) {
    return null;
  }
  return React.Children.map(children, (child) => {
    if (isValidElement(child) && child.type === LinkMenuItem) {
      return <LinkPreviewNativeActionView title={child.props.title} id={child.props.title} />;
    }
    return null;
  });
}

interface LinkPreviewProps {
  width?: number;
  height?: number;
  children?: React.ReactNode;
  Component?: ComponentType<{ isVisible: boolean }>;
}

export function LinkPreview({ children, Component, width, height }: LinkPreviewProps) {
  const internalPreviewContext = use(InternalLinkPreviewContext);
  if (useIsPreview() || !internalPreviewContext) {
    return null;
  }
  const { isVisible, href } = internalPreviewContext;
  const contentSize = {
    width: width ?? 0,
    height: height ?? 0,
  };
  let content: React.ReactNode;
  if (Component) {
    content = <Component isVisible={isVisible} />;
  } else if (children) {
    content = isVisible ? children : null;
  } else {
    content = isVisible ? <HrefPreview href={href} /> : null;
  }

  return (
    <LinkPreviewNativePreviewView
      style={{
        /* Setting default background here, so that the preview is not transparent */
        backgroundColor: '#fff',
      }}
      preferredContentSize={contentSize}>
      {content}
    </LinkPreviewNativePreviewView>
  );
}

export function LinkTrigger(props: PropsWithChildren) {
  if (React.Children.toArray(props.children).every((child) => !isValidElement(child))) {
    return props.children;
  }
  return <Slot {...props} />;
}
