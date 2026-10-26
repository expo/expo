import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { StackTitleProps } from '../layouts/stack-utils/StackTitle';
import type { StackToolbarProps } from '../layouts/stack-utils/toolbar';

type Registration<T> = { id: string; value: T };

type ToolbarState = {
  title?: StackTitleProps;
  left?: StackToolbarProps;
  right?: StackToolbarProps;
};

type ToolbarRegistrationContextValue = {
  setTitle: (id: string, value?: StackTitleProps) => void;
  setToolbar: (id: string, placement: 'left' | 'right', value?: StackToolbarProps) => void;
};

const ExpoUISplitViewToolbarRegistrationContext =
  createContext<ToolbarRegistrationContextValue | null>(null);
const ExpoUISplitViewToolbarStateContext = createContext<ToolbarState>({});

export function ExpoUISplitViewToolbarProvider({ children }: { children: ReactNode }) {
  const [title, setTitleRegistration] = useState<Registration<StackTitleProps>>();
  const [left, setLeftRegistration] = useState<Registration<StackToolbarProps>>();
  const [right, setRightRegistration] = useState<Registration<StackToolbarProps>>();

  const setTitle = useCallback((id: string, value?: StackTitleProps) => {
    setTitleRegistration((current) =>
      value ? { id, value } : current?.id === id ? undefined : current
    );
  }, []);
  const setToolbar = useCallback(
    (id: string, placement: 'left' | 'right', value?: StackToolbarProps) => {
      const update = (current?: Registration<StackToolbarProps>) =>
        value ? { id, value } : current?.id === id ? undefined : current;
      if (placement === 'left') {
        setLeftRegistration(update);
      } else {
        setRightRegistration(update);
      }
    },
    []
  );
  const registration = useMemo(() => ({ setTitle, setToolbar }), [setTitle, setToolbar]);
  const state = useMemo(
    () => ({ title: title?.value, left: left?.value, right: right?.value }),
    [left, right, title]
  );

  return (
    <ExpoUISplitViewToolbarRegistrationContext.Provider value={registration}>
      <ExpoUISplitViewToolbarStateContext.Provider value={state}>
        {children}
      </ExpoUISplitViewToolbarStateContext.Provider>
    </ExpoUISplitViewToolbarRegistrationContext.Provider>
  );
}

export function useExpoUISplitViewToolbar() {
  return useContext(ExpoUISplitViewToolbarRegistrationContext);
}

export function useExpoUISplitViewToolbarState() {
  return useContext(ExpoUISplitViewToolbarStateContext);
}
