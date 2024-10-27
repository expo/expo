import { useIsFocused } from '@react-navigation/core';
import React from 'react';

import { ExpoHead, UserActivity } from './ExpoHeadModule';
import { getStaticUrlFromExpoRouter } from './url';
import { useLocalSearchParams, useUnstableGlobalHref, usePathname, useSegments } from '../hooks';

function urlToId(url: string) {
  return url.replace(/[^a-zA-Z0-9]/g, '-');
}

function getLastSegment(path: string) {
  // Remove the extension
  const lastSegment = path.split('/').pop() ?? '';
  return lastSegment.replace(/\.[^/.]+$/, '').split('?')[0];
}

// TODO: Use Head Provider to collect all props so only one Head is rendered for a given route.

function useAddressableLink() {
  const pathname = useUnstableGlobalHref();
  const params = useLocalSearchParams<any>();
  const url = getStaticUrlFromExpoRouter(pathname);
  return { url, pathname, params };
}

type MetaNode =
  | React.ReactPortal
  | React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;

function useMetaChildren(children: React.ReactNode) {
  return React.useMemo(() => {
    const renderableChildren: React.ReactNode[] = [];
    const metaChildren: MetaNode[] = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return;
      }
      if (typeof child.type === 'string') {
        metaChildren.push(child);
      } else {
        renderableChildren.push(child);
      }
    });

    return { children: renderableChildren, metaChildren };
  }, [children]);
}

type SerializedMeta = {
  type: string;
  props: Record<string, string | undefined>;
};

function serializedMetaChildren(meta: MetaNode[]): SerializedMeta[] {
  const validMeta = meta.filter((child) => child.type === 'meta' || child.type === 'title');

  return validMeta.map((child) => {
    if (child.type === 'title') {
      return {
        type: 'title',
        props: {
          children: typeof child.props.children === 'string' ? child.props.children : undefined,
        },
      };
    }
    return {
      type: 'meta',
      props: {
        property: typeof child.props.property === 'string' ? child.props.property : undefined,
        content: typeof child.props.content === 'string' ? child.props.content : undefined,
      },
    };
  });
}

function useActivityFromMetaChildren(meta: MetaNode[]) {
  const { url: href, pathname } = useAddressableLink();

  const previousMeta = React.useRef<SerializedMeta[]>([]);
  const cachedActivity = React.useRef<Partial<UserActivity>>({});

  const sortedMeta = React.useMemo(() => serializedMetaChildren(meta), [meta]);

  const url = React.useMemo(() => {
    const urlMeta = sortedMeta.find(
      (child) => child.type === 'meta' && child.props.property === 'og:url'
    );

    if (urlMeta) {
      // Support =`/foo/bar` -> `https://example.com/foo/bar`
      if (urlMeta.props.content?.startsWith('/')) {
        return getStaticUrlFromExpoRouter(urlMeta.props.content);
      }
      return urlMeta.props.content;
    }
    return href;
  }, [sortedMeta, href]);

  const title = React.useMemo(() => {
    const titleTag = sortedMeta.find((child) => child.type === 'title');
    if (titleTag) {
      return titleTag.props.children ?? '';
    }
    const titleMeta = sortedMeta.find(
      (child) => child.type === 'meta' && child.props.property === 'og:title'
    );
    if (titleMeta) {
      return titleMeta.props.content ?? '';
    }

    return getLastSegment(pathname);
  }, [sortedMeta, pathname]);

  const activity = React.useMemo(() => {
    if (
      !!previousMeta.current &&
      !!cachedActivity.current &&
      deepObjectCompare(previousMeta.current, sortedMeta)
    ) {
      return cachedActivity.current;
    }
    previousMeta.current = sortedMeta;

    const userActivity: Partial<UserActivity> = {};

    sortedMeta.forEach((child) => {
      if (
        // <meta />
        child.type === 'meta'
      ) {
        const { property, content } = child.props;

        switch (property) {
          case 'og:description':
            userActivity.description = content;
            break;
          // Custom properties
          case 'expo:handoff':
            userActivity.isEligibleForHandoff = isTruthy(content);
            break;
          case 'expo:spotlight':
            userActivity.isEligibleForSearch = isTruthy(content);
            break;
        }

        // // <meta name="keywords" content="foo,bar,baz" />
        // if (["keywords"].includes(name)) {
        //   userActivity.keywords = Array.isArray(content)
        //     ? content
        //     : content.split(",");
        // }
      }
    });

    cachedActivity.current = userActivity;
    return userActivity;
  }, [meta, pathname, href]);

  const parsedActivity: UserActivity = {
    keywords: [title],
    ...activity,
    title,
    webpageURL: url,
    activityType: ExpoHead!.activities.INDEXED_ROUTE,
    userInfo: {
      // TODO: This may need to be  versioned in the future, e.g. `_v1` if we change the format.
      href,
    },
  };

  return parsedActivity;
}

function isTruthy(value: any): boolean {
  return [true, 'true'].includes(value);
}

function HeadNative(props: { children?: React.ReactNode }) {
  const isFocused = useIsFocused();
  if (!isFocused) {
    return <UnfocusedHead />;
  }
  return <FocusedHead {...props} />;
}

function UnfocusedHead(props: { children?: React.ReactNode }): JSX.Element {
  const { children } = useMetaChildren(props.children);
  return <>{children}</>;
}

function FocusedHead(props: { children?: React.ReactNode }): JSX.Element {
  const { metaChildren, children } = useMetaChildren(props.children);
  const activity = useActivityFromMetaChildren(metaChildren);
  useRegisterCurrentActivity(activity);
  return <>{children}</>;
}

// segments => activity
const activities: Map<string, UserActivity> = new Map();

function useRegisterCurrentActivity(activity: UserActivity) {
  // ID is tied to Expo Router and agnostic of URLs to ensure dynamic parameters are not considered.
  // Using all segments ensures that cascading routes are considered.
  const activityId = urlToId(usePathname() || '/');
  const cascadingId = urlToId(useSegments().join('-') || '-');
  const activityIds = Array.from(activities.keys());
  const cascadingActivity: UserActivity = React.useMemo(() => {
    // Get all nested activities together, then update the id to match the current pathname.
    // This enables cases like `/user/[name]/post/[id]` to match all nesting, while still having a URL-specific ID, i.e. `/user/evanbacon/post/123`
    const cascadingActivity = activities.has(cascadingId)
      ? {
          ...activities.get(cascadingId),
          ...activity,
          id: activityId,
        }
      : {
          ...activity,
          id: activityId,
        };
    activities.set(cascadingId, cascadingActivity);

    return cascadingActivity;
  }, [cascadingId, activityId, activity, activityIds]);

  const previousActivity = React.useRef<UserActivity | null>(null);

  React.useEffect(() => {
    if (!cascadingActivity) {
      return () => {};
    }
    if (
      !!previousActivity.current &&
      deepObjectCompare(previousActivity.current, cascadingActivity)
    ) {
      return () => {};
    }

    previousActivity.current = cascadingActivity;
    if (!cascadingActivity.id) {
      throw new Error('Activity must have an ID');
    }

    // If no features are enabled, then skip registering the activity
    if (cascadingActivity.isEligibleForHandoff || cascadingActivity.isEligibleForSearch) {
      ExpoHead?.createActivity(cascadingActivity);
    }

    return () => {};
  }, [cascadingActivity]);

  React.useEffect(() => {
    return () => {
      if (activityId) {
        ExpoHead?.suspendActivity(activityId);
      }
    };
  }, [activityId]);
}

function deepObjectCompare(a: any, b: any) {
  if (typeof a !== typeof b) {
    return false;
  }
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }
    if (Array.isArray(a)) {
      if (a.length !== b.length) {
        return false;
      }
      return a.every((item, index) => deepObjectCompare(item, b[index]));
    }
    // handle null
    if (a === null || b === null) {
      return a === b;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every((key) => deepObjectCompare(a[key], b[key]));
  }
  return a === b;
}

HeadNative.Provider = React.Fragment;

function HeadShim(props: React.PropsWithChildren) {
  return null;
}

HeadShim.Provider = React.Fragment;

// Native Head is only enabled in bare iOS apps.
export const Head: ((props: React.PropsWithChildren) => React.ReactNode) & {
  Provider: React.ComponentType;
} = ExpoHead ? HeadNative : HeadShim;
