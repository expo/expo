'use client';

import React, {
  createContext,
  isValidElement,
  use,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

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

  const [nextScreenId, updateNextScreenId] = useNextScreenId();

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
    () =>
      convertActionsToActionsHandlers(
        convertChildrenArrayToActions(React.Children.toArray(menuElement?.props.children))
      ),
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
    <NativeLinkPreview
      nextScreenId={nextScreenId}
      onActionSelected={({ nativeEvent: { id } }) => {
        actionsHandlers[id]?.();
      }}
      onWillPreviewOpen={() => {
        router.prefetch(rest.href);
        setIsPreviewOpen(true);
        setIsCurrenPreviewOpen(true);
      }}
      onDidPreviewOpen={() => {
        updateNextScreenId(rest.href);
      }}
      onPreviewDidClose={() => {
        setIsPreviewOpen(false);
        setIsCurrenPreviewOpen(false);
      }}
      onPreviewTapped={() => {
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

export function LinkTrigger(props: PropsWithChildren) {
  if (React.Children.toArray(props.children).every((child) => !isValidElement(child))) {
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
