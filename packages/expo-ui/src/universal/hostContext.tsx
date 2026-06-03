import { createContext, useContext, useId, useMemo } from 'react';
import type { ComponentType, ReactNode } from 'react';

export type HostBoundaryKind = 'react-native' | 'native-ui';

export type HostBoundaryOwner = 'root' | 'Host' | 'RNHostView';

export type HostBoundaryFrame = {
  id: string;
  kind: HostBoundaryKind;
  owner: HostBoundaryOwner;
};

export type HostBoundaryState = {
  frames: HostBoundaryFrame[];
};

export type HostBoundaryProviderProps = {
  children?: ReactNode;
  id?: string;
  kind: HostBoundaryKind;
  owner: HostBoundaryOwner;
};

const rootHostBoundaryFrame: HostBoundaryFrame = {
  id: 'root',
  kind: 'react-native',
  owner: 'root',
};

export const rootHostBoundaryState: HostBoundaryState = {
  frames: [rootHostBoundaryFrame],
};

export const HostBoundaryContext = createContext<HostBoundaryState>(rootHostBoundaryState);

export function getHostBoundaryFrame(state: HostBoundaryState): HostBoundaryFrame | undefined {
  return state.frames[state.frames.length - 1];
}

export function useHostBoundaryState(): HostBoundaryState {
  return useContext(HostBoundaryContext);
}

export function useHostBoundaryFrame(): HostBoundaryFrame | undefined {
  return getHostBoundaryFrame(useHostBoundaryState());
}

export function useIsInsideNativeHost(): boolean {
  return useHostBoundaryFrame()?.kind === 'native-ui';
}

export function HostBoundaryProvider({ children, id, kind, owner }: HostBoundaryProviderProps) {
  const parentState = useHostBoundaryState();
  const generatedId = useId();
  const frameId = id ?? generatedId;

  const state = useMemo<HostBoundaryState>(
    () => ({
      frames: [
        ...parentState.frames,
        {
          id: frameId,
          kind,
          owner,
        },
      ],
    }),
    [frameId, kind, owner, parentState.frames]
  );

  return <HostBoundaryContext.Provider value={state}>{children}</HostBoundaryContext.Provider>;
}

function withHostBoundary<P extends object>(
  Component: ComponentType<P>,
  kind: HostBoundaryKind,
  owner: HostBoundaryOwner
) {
  return function ComponentWithBoundary(props: P) {
    return (
      <HostBoundaryProvider kind={kind} owner={owner}>
        <Component {...props} />
      </HostBoundaryProvider>
    );
  };
}

export function withNativeHostBoundary<P extends object>(NativeHost: ComponentType<P>) {
  return withHostBoundary(NativeHost, 'native-ui', 'Host');
}

export function withReactNativeHostBoundary<P extends object>(RNHost: ComponentType<P>) {
  return withHostBoundary(RNHost, 'react-native', 'RNHostView');
}
