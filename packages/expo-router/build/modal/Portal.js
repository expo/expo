"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalPortalContent = exports.PortalContentHeightContext = exports.ModalPortalHost = exports.PortalContextProvider = exports.PortalContext = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("./native");
exports.PortalContext = (0, react_1.createContext)({
    getHost: () => {
        throw new Error('PortalContext not initialized. This is likely a bug in Expo Router.');
    },
    removeHost: () => {
        throw new Error('PortalContext not initialized. This is likely a bug in Expo Router.');
    },
    updateHost: () => {
        throw new Error('PortalContext not initialized. This is likely a bug in Expo Router.');
    },
});
const PortalContextProvider = (props) => {
    const [hostConfigs, setHostConfigs] = (0, react_1.useState)(() => new Map());
    const getHost = (0, react_1.useCallback)((hostId) => {
        return hostConfigs.get(hostId);
    }, [hostConfigs]);
    // TODO: ENG-16597: Optimize this to avoid unnecessary rerenders of the whole app
    const updateHost = (0, react_1.useCallback)((hostId, config) => {
        setHostConfigs((prev) => {
            const updated = new Map(prev);
            const existingConfig = updated.get(hostId) ?? {
                hostId,
                size: { width: 0, height: 0 },
                contentSize: { width: 0, height: 0 },
                shouldUseContentHeight: false,
                isRegistered: false,
            };
            updated.set(hostId, { ...existingConfig, ...config });
            return updated;
        });
    }, []);
    const removeHost = (0, react_1.useCallback)((hostId) => {
        setHostConfigs((prev) => {
            const updated = new Map(prev);
            updated.delete(hostId);
            return updated;
        });
    }, []);
    return (<exports.PortalContext.Provider value={{
            getHost,
            updateHost,
            removeHost,
        }}>
      {props.children}
    </exports.PortalContext.Provider>);
};
exports.PortalContextProvider = PortalContextProvider;
const ModalPortalHost = (props) => {
    const { removeHost, updateHost, getHost } = (0, react_1.use)(exports.PortalContext);
    const prevHostId = (0, react_1.useRef)(undefined);
    const prevShouldUseContentHeight = (0, react_1.useRef)(undefined);
    (0, react_1.useEffect)(() => {
        if (prevHostId.current) {
            throw new Error(`Changing hostId is not allowed. Previous: ${prevHostId.current}, New: ${props.hostId}`);
        }
        prevHostId.current = props.hostId;
        return () => {
            removeHost(props.hostId);
        };
    }, [props.hostId]);
    (0, react_1.useEffect)(() => {
        if (prevShouldUseContentHeight.current === undefined) {
            prevShouldUseContentHeight.current = props.useContentHeight;
            updateHost(props.hostId, { shouldUseContentHeight: props.useContentHeight });
        }
        else {
            throw new Error(`Changing useContentHeight is not allowed. Host: ${props.hostId}`);
        }
    }, [props.useContentHeight, updateHost]);
    const hostConfig = getHost(props.hostId);
    const style = react_native_1.StyleSheet.flatten([
        props.style,
        props.useContentHeight ? { height: hostConfig?.contentSize?.height } : {},
    ]);
    return (<native_1.NativeModalPortalHost style={style} hostId={props.hostId} onLayout={(e) => {
            updateHost(props.hostId, {
                size: e.nativeEvent.layout,
            });
            props.onLayout?.(e);
        }} onRegistered={({ nativeEvent }) => {
            updateHost(props.hostId, {
                isRegistered: true,
            });
            props.onRegistered?.({ nativeEvent });
        }} onUnregistered={() => {
            updateHost(props.hostId, {
                isRegistered: false,
            });
        }}/>);
};
exports.ModalPortalHost = ModalPortalHost;
exports.PortalContentHeightContext = (0, react_1.createContext)({
    setHeight: () => { },
});
const ModalPortalContent = (props) => {
    const { getHost, updateHost } = (0, react_1.use)(exports.PortalContext);
    const setContentHeight = (0, react_1.useCallback)((height) => {
        updateHost(props.hostId, {
            contentSize: { width: 0, height: height ?? 0 },
        });
    }, [props.hostId, updateHost]);
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
    return (<native_1.NativeModalPortalContentWrapper hostId={props.hostId}>
      <native_1.NativeModalPortalContent style={{
            // Using position absolute, to "extract" the content from parent layout and position in host
            position: 'absolute',
            width: hostSize.width || undefined,
            height: hostConfig.shouldUseContentHeight ? undefined : hostSize.height,
        }}>
        <exports.PortalContentHeightContext value={{ setHeight: setContentHeight }}>
          {props.children}
        </exports.PortalContentHeightContext>
      </native_1.NativeModalPortalContent>
    </native_1.NativeModalPortalContentWrapper>);
};
exports.ModalPortalContent = ModalPortalContent;
//# sourceMappingURL=Portal.js.map