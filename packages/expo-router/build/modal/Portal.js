"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalPortalContent = exports.ModalPortalHost = exports.PortalContextProvider = exports.PortalContext = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("./native");
exports.PortalContext = (0, react_1.createContext)({
    hasHostId: () => false,
    addHostId: () => { },
    removeHostId: () => { },
});
const PortalContextProvider = (props) => {
    const [nativeIds, setNativeIds] = (0, react_1.useState)(() => new Set());
    const hasHostId = (0, react_1.useCallback)((hostId) => {
        return nativeIds.has(hostId);
    }, [nativeIds]);
    const addHostId = (0, react_1.useCallback)((hostId) => {
        setNativeIds((prev) => new Set(prev).add(hostId));
    }, []);
    const removeHostId = (0, react_1.useCallback)((hostId) => {
        setNativeIds((prev) => {
            const updated = new Set(prev);
            updated.delete(hostId);
            return updated;
        });
    }, []);
    return (<exports.PortalContext.Provider value={{ hasHostId, addHostId, removeHostId }}>
      {props.children}
    </exports.PortalContext.Provider>);
};
exports.PortalContextProvider = PortalContextProvider;
const ModalPortalHost = (props) => {
    const { addHostId, removeHostId } = (0, react_1.use)(exports.PortalContext);
    const style = react_native_1.StyleSheet.flatten([props.style, props.useContentHeight ? {} : { flex: 1 }]);
    return (<native_1.NativeModalPortalHost style={style} disableFullHeight={props.useContentHeight} hostId={props.hostId} onRegistered={({ nativeEvent }) => {
            addHostId(nativeEvent.hostId);
        }} onUnregistered={({ nativeEvent }) => {
            removeHostId(nativeEvent.hostId);
        }}/>);
};
exports.ModalPortalHost = ModalPortalHost;
const ModalPortalContent = (props) => {
    const { hasHostId } = (0, react_1.use)(exports.PortalContext);
    const isHostFound = hasHostId(props.hostId);
    // At first render, the hostId might not be registered yet
    if (!isHostFound) {
        // Returning null here to avoid rendering the content before the
        return null;
    }
    return (<native_1.NativeModalPortalContentWrapper hostId={props.hostId}>
      {isHostFound ? (<native_1.NativeModalPortalContent style={styles.portalContent}>
          {props.children}
        </native_1.NativeModalPortalContent>) : null}
    </native_1.NativeModalPortalContentWrapper>);
};
exports.ModalPortalContent = ModalPortalContent;
const styles = react_native_1.StyleSheet.create({
    portalContent: {
        position: 'absolute',
    },
});
//# sourceMappingURL=Portal.js.map