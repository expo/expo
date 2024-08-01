import { useNavigation as useUpstreamNavigation, NavigationProp } from '@react-navigation/native';
import React from 'react';

import { useContextKey } from './Route';
import { getNameFromFilePath } from './matchers';

/**
 * Return the navigation object for the current route.
 * @param parent Provide an absolute path like `/(root)` to the parent route or a relative path like `../../` to the parent route.
 * @returns the navigation object for the provided route.
 */
export function useNavigation<T = NavigationProp<ReactNavigation.RootParamList>>(
  parent?: string
): T {
  const navigation = useUpstreamNavigation<any>();

  const contextKey = useContextKey();
  const normalizedParent = React.useMemo(() => {
    if (!parent) {
      return null;
    }
    const normalized = getNameFromFilePath(parent);

    if (parent.startsWith('.')) {
      return relativePaths(contextKey, parent);
    }
    return normalized;
  }, [contextKey, parent]);

  if (normalizedParent != null) {
    const parentNavigation = navigation.getParent(normalizedParent);

    // TODO: Maybe print a list of parents...

    if (!parentNavigation) {
      throw new Error(
        `Could not find parent navigation with route "${parent}".` +
          (normalizedParent !== parent ? ` (normalized: ${normalizedParent})` : '')
      );
    }
    return parentNavigation;
  }
  return navigation;
}

export function resolveParentId(contextKey: string, parentId?: string | null): string | null {
  if (!parentId) {
    return null;
  }

  if (parentId.startsWith('.')) {
    return getNameFromFilePath(relativePaths(contextKey, parentId));
  }
  return getNameFromFilePath(parentId);
}

// Resolve a path like `../` relative to a path like `/foo/bar`
function relativePaths(from: string, to: string): string {
  const fromParts = from.split('/').filter(Boolean);
  const toParts = to.split('/').filter(Boolean);

  for (const part of toParts) {
    if (part === '..') {
      if (fromParts.length === 0) {
        throw new Error(`Cannot resolve path "${to}" relative to "${from}"`);
      }
      fromParts.pop();
    } else if (part === '.') {
      // Ignore
    } else {
      fromParts.push(part);
    }
  }

  return '/' + fromParts.join('/');
}
