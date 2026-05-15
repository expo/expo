import { type ComponentPropsWithoutRef, type PropsWithChildren, type ReactNode } from 'react';
export type ServerDocumentData = {
    bodyAttributes?: ComponentPropsWithoutRef<'body'>;
    htmlAttributes?: ComponentPropsWithoutRef<'html'>;
    bodyNodes?: ReactNode;
    headNodes?: ReactNode;
};
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
export declare function useServerDocumentContext(): ServerDocumentData;
type ServerDocumentProps = PropsWithChildren<{
    data: ServerDocumentData | null;
}>;
export declare function ServerDocument({ children, data }: ServerDocumentProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ServerDocument.d.ts.map