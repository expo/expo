import { createContext, PropsWithChildren, use, useState } from 'react';

const LinkPreviewContext = createContext<
  | {
      isPreviewOpen: boolean;
      setIsPreviewOpen: (isOpen: boolean) => void;
    }
  | undefined
>(undefined);

export function LinkPreviewContextProvider({ children }: PropsWithChildren) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  return (
    <LinkPreviewContext.Provider value={{ isPreviewOpen, setIsPreviewOpen }}>
      {children}
    </LinkPreviewContext.Provider>
  );
}

export const useLinkPreviewContext = () => {
  const context = use(LinkPreviewContext);
  if (context == null) {
    throw new Error(
      'useLinkPreviewContext must be used within a LinkPreviewContextProvider. This is likely a bug in Expo Router.'
    );
  }
  return context;
};
