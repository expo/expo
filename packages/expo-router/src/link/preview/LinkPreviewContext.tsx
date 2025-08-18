import { createContext, PropsWithChildren, use, useState } from 'react';

const LinkPreviewContext = createContext<
  | {
      isStackAnimationDisabled: boolean;
      openPreviewKey: string | undefined;
      setOpenPreviewKey: (openPreviewKey: string | undefined) => void;
    }
  | undefined
>(undefined);

export function LinkPreviewContextProvider({ children }: PropsWithChildren) {
  const [openPreviewKey, setOpenPreviewKey] = useState<string | undefined>(undefined);
  const isStackAnimationDisabled = openPreviewKey !== undefined;
  return (
    <LinkPreviewContext.Provider
      value={{ isStackAnimationDisabled, openPreviewKey, setOpenPreviewKey }}>
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
