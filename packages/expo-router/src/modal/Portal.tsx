import { createContext, use, useCallback, useState, type PropsWithChildren } from 'react';
import { StyleSheet, type ViewProps } from 'react-native';

import {
  NativeModalPortalContent,
  NativeModalPortalContentWrapper,
  NativeModalPortalHost,
} from './native';

interface PortalContextType {
  hasHostId: (hostId: string) => boolean;
  addHostId: (hostId: string) => void;
  removeHostId: (hostId: string) => void;
}

export const PortalContext = createContext<PortalContextType>({
  hasHostId: () => false,
  addHostId: () => {},
  removeHostId: () => {},
});

export const PortalContextProvider = (props: PropsWithChildren) => {
  const [nativeIds, setNativeIds] = useState<Set<string>>(() => new Set());

  const hasHostId = useCallback(
    (hostId: string) => {
      return nativeIds.has(hostId);
    },
    [nativeIds]
  );

  const addHostId = useCallback((hostId: string) => {
    setNativeIds((prev) => new Set(prev).add(hostId));
  }, []);

  const removeHostId = useCallback((hostId: string) => {
    setNativeIds((prev) => {
      const updated = new Set(prev);
      updated.delete(hostId);
      return updated;
    });
  }, []);

  return (
    <PortalContext.Provider value={{ hasHostId, addHostId, removeHostId }}>
      {props.children}
    </PortalContext.Provider>
  );
};

export interface ModalPortalHostProps {
  hostId: string;
  // When set to true, the portal will use the content height instead of the full height.
  useContentHeight?: boolean;
  style?: ViewProps['style'];
}

export const ModalPortalHost = (props: ModalPortalHostProps) => {
  const { addHostId, removeHostId } = use(PortalContext);

  const style = StyleSheet.flatten([props.style, props.useContentHeight ? {} : { flex: 1 }]);
  return (
    <NativeModalPortalHost
      style={style}
      disableFullHeight={props.useContentHeight}
      hostId={props.hostId}
      onRegistered={({ nativeEvent }) => {
        addHostId(nativeEvent.hostId);
      }}
      onUnregistered={({ nativeEvent }) => {
        removeHostId(nativeEvent.hostId);
      }}
    />
  );
};

export interface ModalPortalContentProps {
  hostId: string;
  children: React.ReactNode;
}

export const ModalPortalContent = (props: ModalPortalContentProps) => {
  const { hasHostId } = use(PortalContext);
  const isHostFound = hasHostId(props.hostId);
  // At first render, the hostId might not be registered yet
  if (!isHostFound) {
    // Returning null here to avoid rendering the content before the
    return null;
  }
  return (
    <NativeModalPortalContentWrapper hostId={props.hostId}>
      {isHostFound ? (
        <NativeModalPortalContent style={styles.portalContent}>
          {props.children}
        </NativeModalPortalContent>
      ) : null}
    </NativeModalPortalContentWrapper>
  );
};

const styles = StyleSheet.create({
  portalContent: {
    position: 'absolute',
  },
});
