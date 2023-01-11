import React from 'react';
import { useNavigation } from 'expo-router';

function formatLikeConsoleLog(args: any) {
  if (typeof args === 'string') {
    return args;
  }

  let str = '';
  if (Array.isArray(args)) {
    for (const arg of args) {
      if (str.length > 0) {
        str += ' ';
      }

      if (typeof arg === 'string') {
        str += arg;
      } else if (Array.isArray(arg)) {
        str += formatLikeConsoleLog(arg);
      } else {
        str += JSON.stringify(arg);
      }
    }
  }

  return str;
}

export function Head({ children }: { children?: React.ReactNode }): React.ReactElement {
  const navigation = useNavigation();

  const { renderableChildren, metaChildren } = React.useMemo(() => {
    const renderableChildren = [];
    const metaChildren = [];

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

    return { renderableChildren, metaChildren };
  }, [children]);

  const title = React.useMemo(() => {
    for (const child of metaChildren) {
      if (child.type === 'title') {
        return child.props.children;
      }
    }

    return undefined;
  }, [metaChildren]);

  React.useEffect(() => {
    if (title !== undefined) {
      navigation.setOptions({
        title: formatLikeConsoleLog(title),
      });
    }
  }, [title]);

  return <>{renderableChildren}</>;
}
