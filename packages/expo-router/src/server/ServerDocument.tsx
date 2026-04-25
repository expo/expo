import React, { type ComponentType, createContext, type PropsWithChildren, useContext } from 'react';

export type ServerDocumentProps = PropsWithChildren<{
  bodyAttributes?: React.ComponentPropsWithoutRef<'body'>;
  bodyNodes?: React.ReactNode;
  headNodes?: React.ReactNode;
  htmlAttributes?: React.ComponentPropsWithoutRef<'html'>;
}>;

export type ServerDocumentComponent = ComponentType<ServerDocumentProps>;

export type ServerDocumentPayload = Omit<ServerDocumentProps, 'children'>;

const ServerDocumentContext = createContext<ServerDocumentPayload | null>(null);

export function useServerDocumentContext(): ServerDocumentPayload {
  return useContext(ServerDocumentContext) ?? {};
}

export function ServerDocument({
  Root,
  children,
  payload,
}: PropsWithChildren<{
  payload: ServerDocumentPayload;
  Root: ServerDocumentComponent;
}>) {
  return (
    <ServerDocumentContext.Provider value={payload}>
      <Root {...payload}>{children}</Root>
    </ServerDocumentContext.Provider>
  );
}
