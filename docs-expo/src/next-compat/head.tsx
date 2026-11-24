import {
  Children,
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const SERVER_NODE_ATTRIBUTE = 'data-server-head';

/**
 * Holds the head elements that React cannot move to the document head during the static
 * render. `src/app/+html.tsx` provides it and renders its contents with `ServerHeadOutlet`.
 * It has no value in the browser.
 */
export const ServerHeadContext = createContext<ReactElement[] | null>(null);

// React 19 moves these elements to the document head, during the static render and in the
// browser. It leaves an inline `<script>` in its position.
function isHoistable(element: ReactElement) {
  return element.type === 'title' || element.type === 'meta' || element.type === 'link';
}

function flatten(children: ReactNode): ReactElement[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<PropsWithChildren>(child)) {
      return [];
    }
    return child.type === Fragment ? flatten(child.props.children) : [child];
  });
}

/**
 * The `next/head` component.
 *
 * `expo-router/head` is not used here. In SDK 58 its tags are not part of the static HTML.
 *
 * An element that React does not move, such as a JSON-LD `<script>`, must not stay in its
 * position: it would change which elements are siblings, and CSS sibling selectors would
 * give a different result than in the Next.js build. The static render sends such an
 * element to `ServerHeadOutlet`. The browser renders it in the document head.
 */
export default function Head({ children }: PropsWithChildren) {
  const serverNodes = useContext(ServerHeadContext);
  const [isMounted, setMounted] = useState(false);
  const elements = flatten(children);
  const hoistable = elements.filter(isHoistable);
  const other = elements.filter(element => !isHoistable(element));

  if (serverNodes) {
    serverNodes.push(...other);
  }

  useEffect(() => {
    document.querySelectorAll(`[${SERVER_NODE_ATTRIBUTE}]`).forEach(node => node.remove());
    setMounted(true);
  }, []);

  return (
    <>
      {hoistable}
      {isMounted && other.length > 0 && createPortal(other, document.head)}
    </>
  );
}

/** Renders the elements that `Head` collected. Put it after the app in the HTML body. */
export function ServerHeadOutlet() {
  const serverNodes = useContext(ServerHeadContext) ?? [];
  return (
    <>
      {serverNodes.map((node, index) =>
        cloneElement(node as ReactElement<Record<string, unknown>>, {
          key: index,
          [SERVER_NODE_ATTRIBUTE]: '',
        })
      )}
    </>
  );
}
