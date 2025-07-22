import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import {
  NativeModalPortalContent,
  NativeModalPortalContentWrapper,
  NativeModalPortalHost,
} from './native';

interface PortalHostConfig {
  hostId: string;
  size: { width: number; height: number };
  contentSize?: { width: number; height: number };
  // The content offset is the space above the modal.
  // We are using it, to simulate correct positioning of the modal content for React Native.
  // If this was not done, touch events would not be correctly handled on Android.
  contentOffset: number;
  shouldUseContentHeight?: boolean;
  isRegistered?: boolean;
}
interface PortalContextType {
  getHost: (hostId: string) => PortalHostConfig | undefined;
  updateHost: (hostId: string, config: Partial<Omit<PortalHostConfig, 'hostId'>>) => void;
  removeHost: (hostId: string) => void;
  hostScreenHeight: number;
}

export const PortalContext = createContext<PortalContextType>({
  getHost: () => {
    throw new Error('PortalContext not initialized. This is likely a bug in Expo Router.');
  },
  removeHost: () => {
    throw new Error('PortalContext not initialized. This is likely a bug in Expo Router.');
  },
  updateHost: () => {
    throw new Error('PortalContext not initialized. This is likely a bug in Expo Router.');
  },
  // This will be used as a baseline for calculating the content offset.
  // Modal can have at most the same height as the host screen.
  hostScreenHeight: 0,
});

export const PortalContextProvider = (props: PropsWithChildren<{ hostScreenHeight: number }>) => {
  const [hostConfigs, setHostConfigs] = useState<Map<string, PortalHostConfig>>(() => new Map());

  const getHost = useCallback(
    (hostId: string) => {
      return hostConfigs.get(hostId);
    },
    [hostConfigs]
  );

  // TODO: ENG-16597: Optimize this to avoid unnecessary rerenders of the whole app
  const updateHost = useCallback(
    (hostId: string, config: Partial<Omit<PortalHostConfig, 'hostId'>>) => {
      setHostConfigs((prev) => {
        const updated = new Map(prev);
        const existingConfig = updated.get(hostId) ?? {
          hostId,
          size: { width: 0, height: 0 },
          contentSize: { width: 0, height: 0 },
          contentOffset: 0,
          shouldUseContentHeight: false,
          isRegistered: false,
        };
        updated.set(hostId, { ...existingConfig, ...config });
        return updated;
      });
    },
    []
  );

  const removeHost = useCallback((hostId: string) => {
    setHostConfigs((prev) => {
      const updated = new Map(prev);
      updated.delete(hostId);
      return updated;
    });
  }, []);

  return (
    <PortalContext.Provider
      value={{
        getHost,
        updateHost,
        removeHost,
        hostScreenHeight: props.hostScreenHeight,
      }}>
      {props.children}
    </PortalContext.Provider>
  );
};

export interface ModalPortalHostProps {
  hostId: string;
  // When set to true, the portal will use the content height instead of the full height.
  useContentHeight?: boolean;
  style?: ViewProps['style'];
  height: number;
  onRegistered?: (event: { nativeEvent: { hostId: string } }) => void;
  onLayout?: (event: { nativeEvent: { layout: { width: number; height: number } } }) => void;
}

export const ModalPortalHost = (props: ModalPortalHostProps) => {
  const { removeHost, updateHost, getHost, hostScreenHeight } = use(PortalContext);
  const prevHostId = useRef<string | undefined>(undefined);
  const prevShouldUseContentHeight = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (prevHostId.current) {
      throw new Error(
        `Changing hostId is not allowed. Previous: ${prevHostId.current}, New: ${props.hostId}`
      );
    }
    prevHostId.current = props.hostId;
    return () => {
      removeHost(props.hostId);
    };
  }, [props.hostId]);

  useEffect(() => {
    if (prevShouldUseContentHeight.current === undefined) {
      prevShouldUseContentHeight.current = props.useContentHeight;
      updateHost(props.hostId, { shouldUseContentHeight: props.useContentHeight });
    } else {
      throw new Error(`Changing useContentHeight is not allowed. Host: ${props.hostId}`);
    }
  }, [props.useContentHeight, updateHost]);

  const hostConfig = getHost(props.hostId);

  const selectedHeight = props.useContentHeight
    ? (hostConfig?.contentSize?.height ?? 0)
    : props.height;

  useEffect(() => {
    if (process.env.EXPO_OS === 'android') {
      const contentOffset = hostScreenHeight - selectedHeight;
      console.log('contentOffset', contentOffset);
      updateHost(props.hostId, {
        contentOffset,
      });
    }
  }, [hostScreenHeight, selectedHeight]);

  const style = StyleSheet.flatten([
    props.style,
    {
      height: selectedHeight + (hostConfig?.contentOffset ?? 0),
      marginTop: -(hostConfig?.contentOffset ?? 0),
    } as ViewProps['style'],
  ]);

  return (
    <NativeModalPortalHost
      style={style}
      hostId={props.hostId}
      onLayout={(e) => {
        updateHost(props.hostId, {
          size: {
            width: e.nativeEvent.layout.width,
            height: props.height,
          },
        });
        props.onLayout?.(e);
      }}
      onRegistered={({ nativeEvent }) => {
        updateHost(props.hostId, {
          isRegistered: true,
        });
        props.onRegistered?.({ nativeEvent });
      }}
      onUnregistered={() => {
        updateHost(props.hostId, {
          isRegistered: false,
        });
      }}
    />
  );
};

export const PortalContentHeightContext = createContext<{
  setHeight: (height: number | undefined) => void;
  contentOffset: number;
}>({
  setHeight: () => {},
  contentOffset: 0,
});

export interface ModalPortalContentProps {
  hostId: string;
  children: React.ReactNode;
}

export const ModalPortalContent = (props: ModalPortalContentProps) => {
  const { getHost, updateHost, hostScreenHeight } = use(PortalContext);
  const setContentHeight = useCallback(
    (height: number | undefined) => {
      updateHost(props.hostId, {
        contentSize: { width: 0, height: height ?? 0 },
      });
    },
    [props.hostId, updateHost]
  );

  const hostConfig = getHost(props.hostId);
  // At first render, the hostId might not be registered yet
  if (!hostConfig || !hostConfig.isRegistered) {
    // Returning null here to avoid rendering the content
    return null;
  }

  const hostSize = hostConfig?.size;
  // If the host size is not available, we cannot render the content
  // Otherwise layout glitches may occur
  if (!hostSize || (!hostSize.width && !hostSize.height)) {
    return null;
  }

  return (
    <NativeModalPortalContentWrapper hostId={props.hostId}>
      <NativeModalPortalContent
        style={{
          width: hostSize.width || undefined,
          height: hostScreenHeight,
        }}>
        <View>
          <PortalContentHeightContext
            value={{ setHeight: setContentHeight, contentOffset: hostConfig.contentOffset }}>
            {props.children}
          </PortalContentHeightContext>
        </View>
      </NativeModalPortalContent>
    </NativeModalPortalContentWrapper>
  );
};
