'use client';

import React, {
  createContext,
  isValidElement,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { StyleSheet, Text } from 'react-native';

import { useRouter } from '../hooks';
import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import { HrefPreview } from './preview/HrefPreview';
import { useLinkPreviewContext } from './preview/LinkPreviewContext';
import {
  NativeLinkPreview,
  NativeLinkPreviewAction,
  NativeLinkPreviewContent,
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
  useEffect(() => {
    if (shouldLinkExternally(String(rest.href))) {
      throw new Error('External links previews are not supported');
    }
    if (rest.replace) {
      throw new Error('Using replace links with preview is not supported');
    }
  }, [rest.href, rest.replace]);
  return (
    <BaseExpoRouterLink {...rest} asChild>
      <InnerLinkWithPreview href={rest.href} asChild={rest.asChild}>
        {children}
      </InnerLinkWithPreview>
    </BaseExpoRouterLink>
  );
}

type InnerLinkProps = Pick<LinkProps, 'href' | 'asChild' | 'children' | 'style'> & {
  onPress?: () => void;
  onClick?: () => void;
};

function InnerLinkWithPreview({
  children,
  asChild,
  href,
  style,
  onPress,
  onClick,
}: InnerLinkProps) {
  const router = useRouter();
  const { setIsPreviewOpen } = useLinkPreviewContext();
  const [isCurrentPreviewOpen, setIsCurrenPreviewOpen] = useState(false);

  const hrefWithoutQuery = String(href).split('?')[0];
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

  const [nextScreenId, updateNextScreenId] = useNextScreenId();

  const triggerElement = React.useMemo(
    () => getFirstChildOfType(children, LinkTrigger),
    [children]
  );
  const menuElement = React.useMemo(() => getFirstChildOfType(children, LinkMenu), [children]);
  const actionsHandlers = React.useMemo(
    () =>
      convertActionsToActionsHandlers(
        convertChildrenArrayToActions(React.Children.toArray(menuElement?.props.children))
      ),
    [menuElement]
  );
  const previewElement = React.useMemo(
    () => getFirstChildOfType(children, LinkPreview),
    [children]
  );

  if (!previewElement) {
    throw new Error('No <Link.Preview> found. This is likely a bug in expo-router.');
  }
  if (!triggerElement) {
    throw new Error(
      'When you use <Link.Preview>, you must use <Link.Trigger> to specify the trigger element.'
    );
  }

  const componentStyle = useMemo(
    // `style` will be passed through the slot in BaseExpoRouterLink, because asChild is used
    () => StyleSheet.flatten([style, triggerElement.props.style]),
    [style, triggerElement.props.style]
  );

  const triggerComponentStyle = useMemo(() => {
    // If asChild is used, then the style should be applied directly to the child element
    // Component styles will be applied to native element
    if (asChild) {
      return {};
    }
    // When flex is set on Link.Trigger or Link then the trigger should fill the available space
    if (componentStyle.flex !== undefined) {
      return StyleSheet.flatten([componentStyle, { flex: 1 }]);
    }
    return componentStyle;
  }, [componentStyle]);

  const nativeLinkPreviewStyle = useMemo(() => {
    // Is asChild is used, then the style should be applied to the native element
    if (asChild) {
      return componentStyle;
    }
    // When flex is set on Link.Trigger or Link then the native element should have the flex,
    // because it is the outer container
    if (componentStyle && componentStyle.flex !== undefined) {
      return {
        flex: componentStyle.flex,
      };
    }
    // Otherwise, styles will be applied to the Text element
    return {};
  }, [asChild, componentStyle]);

  // Copying the behavior of BaseExpoRouterLink
  const Component = asChild ? Slot : Text;

  return (
    <NativeLinkPreview
      style={nativeLinkPreviewStyle}
      nextScreenId={nextScreenId}
      onActionSelected={({ nativeEvent: { id } }) => {
        actionsHandlers[id]?.();
      }}
      onWillPreviewOpen={() => {
        router.prefetch(href);
        setIsPreviewOpen(true);
        setIsCurrenPreviewOpen(true);
      }}
      onDidPreviewOpen={() => {
        updateNextScreenId(href);
      }}
      onPreviewDidClose={() => {
        setIsPreviewOpen(false);
        setIsCurrenPreviewOpen(false);
      }}
      onPreviewTapped={() => {
        router.navigate(href, { __internal__PreviewKey: nextScreenId });
      }}>
      <InternalLinkPreviewContext value={{ isVisible: isCurrentPreviewOpen, href }}>
        <Component
          {...triggerElement.props}
          // @ts-expect-error
          style={triggerComponentStyle ?? undefined}
          onPress={onPress}
          onClick={onClick}
        />
        {previewElement}
        {menuElement}
      </InternalLinkPreviewContext>
    </NativeLinkPreview>
  );
}

interface LinkMenuAction {
  /**
   * The title of the menu item.
   */
  title: string;
  onPress: () => void;
}

export function LinkMenuAction(_: LinkMenuAction) {
  return null;
}
interface LinkMenuProps {
  children: ReactElement<LinkMenuAction> | ReactElement<LinkMenuAction>[];
}

export function LinkMenu({ children }: LinkMenuProps) {
  if (useIsPreview() || !use(InternalLinkPreviewContext)) {
    return null;
  }
  return convertChildrenArrayToActions(React.Children.toArray(children)).map((action) => {
    return <NativeLinkPreviewAction key={action.id} title={action.title} id={action.id} />;
  });
}

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
  if (useIsPreview() || !internalPreviewContext) {
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

interface LinkTriggerProps {
  children?: React.ReactNode;
  style?: LinkProps['style'];
  className?: LinkProps['className'];
}

export function LinkTrigger(_: LinkTriggerProps): React.ReactNode {
  return null;
}

function getFirstChildOfType<PropsT>(
  children: React.ReactNode | React.ReactNode[],
  type: (props: PropsT) => unknown
) {
  return React.Children.toArray(children).find(
    (child): child is ReactElement<PropsT> => isValidElement(child) && child.type === type
  );
}

function convertActionsToActionsHandlers(
  items: { id: string; title: string; onPress: () => void }[] | undefined
) {
  return (items ?? []).reduce(
    (acc, item) => ({
      ...acc,
      [item.id]: item.onPress,
    }),
    {} as Record<string, () => void>
  );
}

function convertChildrenArrayToActions(children: ReturnType<typeof React.Children.toArray>) {
  return children
    .filter(
      (item): item is ReactElement<LinkMenuAction> =>
        isValidElement(item) && item.type === LinkMenuAction
    )
    .map((child, index) => ({
      id: `${child.props.title}-${index}`,
      title: child.props.title,
      onPress: child.props.onPress,
    }));
}
