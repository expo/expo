import {
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
  type ReactNode,
  createContext,
  useContext,
} from 'react';

export type ServerDocumentData = {
  /* Attributes to add to the `<body>` element of the HTML document */
  bodyAttributes?: ComponentPropsWithoutRef<'body'>;
  /* Attributes to add to the root `<html>` element of the HTML document */
  htmlAttributes?: ComponentPropsWithoutRef<'html'>;

  /* React nodes to add to the `<body>` element of the HTML document */
  bodyNodes?: ReactNode;
  /* React nodes to add to the `<head>` element of the HTML document */
  headNodes?: ReactNode;
};

const ServerDocumentContext = createContext<ServerDocumentData | null>(null);

/**
 * Returns the server document data for server-side rendering, including `<html>`/`<body>`
 * attributes and additional nodes to add to `<head>`/`<body>` for metadata and assets.
 *
 * @example
 * ```tsx
 * import { useServerDocumentContext } from 'expo-router/html';
 *
 * export default function Root({ children }) {
 *   const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
 *   return (
 *     <html {...htmlAttributes}>
 *       <head>{headNodes}</head>
 *       <body {...bodyAttributes}>
 *         {children}
 *         {bodyNodes}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function useServerDocumentContext(): ServerDocumentData {
  return useContext(ServerDocumentContext) ?? {};
}

type ServerDocumentProps = PropsWithChildren<{ data: ServerDocumentData | null }>;

export function ServerDocument({ children, data }: ServerDocumentProps) {
  return <ServerDocumentContext.Provider value={data}>{children}</ServerDocumentContext.Provider>;
}
