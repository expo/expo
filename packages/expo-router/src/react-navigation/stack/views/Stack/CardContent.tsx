import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  enabled: boolean;
  layout: { width: number; height: number };
  children: React.ReactNode;
};

// This component will render a page which overflows the screen
// if the container fills the body by comparing the size
// This lets the document.body handle scrolling of the content
// It's necessary for mobile browsers to be able to hide address bar on scroll
export function CardContent({ enabled, layout, style, ...rest }: Props) {
  const [fill, setFill] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === 'undefined' || !document.body) {
      // Only run when DOM is available
      return;
    }

    const width = document.body.clientWidth;
    const height = document.body.clientHeight;

    // Workaround for mobile Chrome, necessary when a navigation happens
    // when the address bar has already collapsed, which resulted in an
    // empty space at the bottom of the page (matching the height of the
    // address bar). To fix this, it's necessary to update the height of
    // the DOM with the current height of the window.
    // See https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
    const isFullHeight = height === layout.height;
    const id = '__react-navigation-stack-mobile-chrome-viewport-fix';

    let unsubscribe: (() => void) | undefined;

    if (isFullHeight && navigator.maxTouchPoints > 0) {
      const style =
        document.getElementById(id) ?? document.createElement('style');

      style.id = id;

      const updateStyle = () => {
        const vh = window.innerHeight * 0.01;

        style.textContent = [
          `:root { --vh: ${vh}px; }`,
          `body { height: calc(var(--vh, 1vh) * 100); }`,
        ].join('\n');
      };

      updateStyle();

      if (!document.head.contains(style)) {
        document.head.appendChild(style);
      }

      window.addEventListener('resize', updateStyle);

      unsubscribe = () => {
        window.removeEventListener('resize', updateStyle);
      };
    } else {
      // Remove the workaround if the stack does not occupy the whole
      // height of the page
      document.getElementById(id)?.remove();
    }

    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setFill(width === layout.width && height === layout.height);

    return unsubscribe;
  }, [layout.height, layout.width]);

  return (
    <View
      {...rest}
      pointerEvents="box-none"
      style={[enabled && fill ? styles.page : styles.card, style]}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    minHeight: '100%',
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
});
