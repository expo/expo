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

export function useServerDocumentContext(): ServerDocumentData {
  return useContext(ServerDocumentContext) ?? {};
}

type ServerDocumentProps = PropsWithChildren<{ data: ServerDocumentData | null }>;

export function ServerDocument({ children, data }: ServerDocumentProps) {
  return <ServerDocumentContext.Provider value={data}>{children}</ServerDocumentContext.Provider>;
}
