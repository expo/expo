import { createContext, useContext, useState } from 'react';

type RootModalContextValue = {
  root: true;
  routes: never[];
  addModal: (name: string) => void;
  removeModal: (name: string) => void;
};

export const RootModalContext = createContext<RootModalContextValue>({
  root: true,
  routes: [],
  addModal: () => {},
  removeModal: () => {},
});

export function RootModalProvider({ children }: { children: React.ReactNode }) {
  const parent = useContext(RootModalContext);

  const [state, setState] = useState<RootModalContextValue>(() => ({
    root: false,
    routes: [],
    addModal: (name: string) => {
      return parent.root ? setState((state) => ({ ...state })) : parent.addModal(name);
    },
    removeModal: (name: string) => {
      return parent.root ? setState((state) => ({ ...state })) : parent.addModal(name);
    },
  }));

  return <RootModalContext.Provider value={state}>{children}</RootModalContext.Provider>;
}
