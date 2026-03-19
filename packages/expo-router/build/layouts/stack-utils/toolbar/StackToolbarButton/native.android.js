"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarButton = void 0;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const color_1 = require("../../../../color");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
/**
 * Native toolbar button component for Android bottom toolbar.
 * Renders as an IconButton with animated visibility.
 */
const NativeToolbarButton = (props) => {
    if (!props.source) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Stack.Toolbar.Button on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.');
        }
        return null;
    }
    const tintColor = props.imageRenderingMode === 'original'
        ? undefined
        : (props.tintColor ?? color_1.Color.android.dynamic.onSurface);
    return (<AnimatedItemContainer_1.AnimatedItemContainer visible={!props.hidden}>
      <jetpack_compose_1.IconButton onClick={props.onPress} enabled={!props.disabled}>
        <jetpack_compose_1.Icon source={props.source} tintColor={tintColor} size={24}/>
      </jetpack_compose_1.IconButton>
    </AnimatedItemContainer_1.AnimatedItemContainer>);
};
exports.NativeToolbarButton = NativeToolbarButton;
//# sourceMappingURL=native.android.js.map