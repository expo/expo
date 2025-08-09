'use client';

import React, {
  createContext,
  isValidElement,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

import { useRouter } from '../hooks';
import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { HrefPreview } from './preview/HrefPreview';
import { useLinkPreviewContext } from './preview/LinkPreviewContext';
import {
  NativeLinkPreview,
  NativeLinkPreviewAction,
  NativeLinkPreviewContent,
  NativeLinkPreviewTrigger,
} from './preview/native';
import { useNextScreenId } from './preview/useNextScreenId';
import { LinkProps } from './useLinkHooks';
import { shouldLinkExternally } from '../utils/url';
import { useIsPreview } from './preview/PreviewRouteContext';
import { Slot } from '../ui/Slot';

const InternalLinkPreviewContext = createContext<
  { isVisible: boolean; href: LinkProps['href'] } | undefined
>(undefined);

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

interface LinkMenuActionProps {
  /**
   * The title of the menu item.
   */
  title: string;
  /**
   * Optional SF Symbol displayed alongside the menu item.
   */
  icon?: SFSymbol;
  /**
   * If true, the menu item will be disabled and not selectable.
   *
   * https://developer.apple.com/documentation/uikit/uimenuelement/attributes/disabled
   */
  disabled?: boolean;
  /**
   * If true, the menu item will be displayed as destructive.
   *
   * https://developer.apple.com/documentation/uikit/uimenuelement/attributes/destructive
   */
  destructive?: boolean;
  /**
   * If true, the menu will be kept presented after the action is selected.
   *
   * This is marked as unstable, because when action is selected it will recreate the menu,
   * which will close all opened submenus and reset the scroll position.
   *
   * https://developer.apple.com/documentation/uikit/uimenuelement/attributes/keepsmenupresented
   */
  unstable_keepPresented?: boolean;
  /**
   * If true, the menu item will be displayed as selected.
   */
  isOn?: boolean;
  onPress: () => void;
}

export function LinkMenuAction(props: LinkMenuActionProps) {
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(InternalLinkPreviewContext)) {
    return null;
  }
  const { unstable_keepPresented, onPress, ...rest } = props;
  return (
    <NativeLinkPreviewAction
      {...rest}
      onSelected={onPress}
      keepPresented={unstable_keepPresented}
    />
  );
}

export interface LinkMenuProps {
  /**
   * The title of the menu item
   */
  title?: string;
  /**
   * Optional SF Symbol displayed alongside the menu item.
   */
  icon?: string;
  /**
   * If true, the menu will be displayed as a palette.
   * This means that the menu will be displayed as one row
   *
   * https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayaspalette
   */
  displayAsPalette?: boolean;
  /**
   * If true, the menu will be displayed inline.
   * This means that the menu will not be collapsed
   *
   * https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/displayinline
   */
  displayInline?: boolean;
  /**
   * If true, the menu item will be displayed as destructive.
   *
   * https://developer.apple.com/documentation/uikit/uimenu/options-swift.struct/destructive
   */
  destructive?: boolean;
  children: ReactElement<LinkMenuActionProps> | ReactElement<LinkMenuActionProps>[];
}

export const LinkMenu: FC<LinkMenuProps> = (props) => {
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(InternalLinkPreviewContext)) {
    return null;
  }
  const children = React.Children.toArray(props.children).filter(
    (child) => isValidElement(child) && (child.type === LinkMenuAction || child.type === LinkMenu)
  );
  return (
    <NativeLinkPreviewAction
      {...props}
      title={props.title ?? ''}
      onSelected={() => {}}
      children={children}
    />
  );
};

interface LinkPreviewProps {
  /**
   * Sets the preferred width of the preview.
   * If not set, full width of the screen will be used.
   *
   * This is only **preferred** width, the actual width may be different
   */
  width?: number;

  /**
   * Sets the preferred height of the preview.
   * If not set, full height of the screen will be used.
   *
   * This is only **preferred** height, the actual height may be different
   */
  height?: number;
  children?: React.ReactNode;
}

export function LinkPreview({ children, width, height }: LinkPreviewProps) {
  const internalPreviewContext = use(InternalLinkPreviewContext);
  if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !internalPreviewContext) {
    return null;
  }
  const { isVisible, href } = internalPreviewContext;
  const contentSize = {
    width: width ?? 0,
    height: height ?? 0,
  };
  let content: React.ReactNode;
  if (children) {
    content = isVisible ? children : null;
  } else {
    content = isVisible ? <HrefPreview href={href} /> : null;
  }

  return (
    <NativeLinkPreviewContent
      style={{
        /* Setting default background here, so that the preview is not transparent */
        backgroundColor: '#fff',
      }}
      preferredContentSize={contentSize}>
      {content}
    </NativeLinkPreviewContent>
  );
}

export function LinkTrigger(props: PropsWithChildren) {
  if (React.Children.count(props.children) > 1 || !isValidElement(props.children)) {
    // If onPress is passed, this means that Link passed props to this component.
    // We can assume that asChild is used, so we throw an error, because link will not work in this case.
    if (props && typeof props === 'object' && 'onPress' in props) {
      throw new Error(
        'When using Link.Trigger in an asChild Link, you must pass a single child element that will emit onPress event.'
      );
    }
    return props.children;
  }
  return <Slot {...props} />;
}

function getFirstChildOfType<PropsT>(
  children: React.ReactNode | React.ReactNode[],
  type: (props: PropsT) => unknown
) {
  return React.Children.toArray(children).find(
    (child): child is ReactElement<PropsT> => isValidElement(child) && child.type === type
  );
}
