import { createContext, PropsWithChildren, use, useMemo, useState } from 'react';

const LinkPreviewContext = createContext<
  | {
      isPreviewOpen: boolean;
      setIsPreviewOpen: (isOpen: boolean) => void;
    }
  | undefined
>(undefined);

export function LinkPreviewContextProvider({ children }: PropsWithChildren) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const value = useMemo(() => ({ isPreviewOpen, setIsPreviewOpen }), [isPreviewOpen]);
  return <LinkPreviewContext.Provider value={value}>{children}</LinkPreviewContext.Provider>;
}

export const useLinkPreviewContext = () => {
  const context = use(LinkPreviewContext);
  if (context === undefined) {
    throw new Error(
      'Internal Expo router issue. useLinkPreviewContext must be used within a LinkPreviewContextProvider'
    );
  }
  return context;
};
