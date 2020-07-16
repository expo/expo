import * as React from 'react';

export const SNACK_URL = 'https://snack.expo.io';
// export const SNACK_URL = 'http://snack.expo.test';

function getFullUrl(url) {
  if (url.startsWith('http')) {
    return url;
  } else if (typeof document !== 'undefined') {
    return document.location.origin + document.location.pathname + url;
  } else {
    return url;
  }
}

function getText(element) {
  const { children } = element.props;
  if (!children) {
    return '';
  } else if (typeof children === 'string') {
    return children;
  } else {
    return React.Children.map(children, getText).join();
  }
}

function getAssets(element) {
  const { name, children, props } = element.props;
  if (!children) {
    return [];
  } else if (typeof children === 'string') {
    if (name === 'a' && props && typeof props.href === 'string') {
      return [{ path: children, url: getFullUrl(props.href) }];
    } else {
      return [];
    }
  } else {
    return React.Children.toArray(children)
      .map(getAssets)
      .flat();
  }
}

/**
 * Parses the inline snack elements and converts it to a snack `files` object.
 * The returned `children` contains those elements that should be rendered
 * to the screen, excluding any asset-definitions or hidden files.
 *
 * @example
 *
 * <!-- Assets -->
 * [assets/logo.png](https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/2f7d32b1787708aba49b3586082d327b)
 *
 * <!-- App.js -->
 * ```js
 * import * as React from 'react';
 * ...
 * ```
 */
export function getInlineSnackContent(children) {
  const files = {};
  const entry = 'App.js';
  const visibleChildren = [];

  React.Children.forEach(children, child => {
    if (child.props.name === 'pre') {
      visibleChildren.push(child);
      files[entry] = files[entry] || { type: 'CODE', contents: '' };
      files[entry].contents += getText(child);
    } else {
      getAssets(child).forEach(asset => {
        files[asset.path] = {
          type: 'ASSET',
          contents: asset.url,
        };
      });
    }
  });

  return {
    files,
    children: visibleChildren,
  };
}
