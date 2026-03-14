"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkWithMenuDialog = LinkWithMenuDialog;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const BaseExpoRouterLink_1 = require("./BaseExpoRouterLink");
const elements_1 = require("./elements");
const children_1 = require("../utils/children");
function extractActions(menuElement) {
    const actions = [];
    react_1.Children.toArray(menuElement.props.children).forEach((child) => {
        if ((0, react_1.isValidElement)(child) && child.type === elements_1.LinkMenuAction) {
            const props = child.props;
            if (!props.hidden) {
                actions.push(props);
            }
        }
        // Skip LinkMenu children (nested submenus) — only collect flat actions
    });
    return actions;
}
function getActionLabel(action) {
    if (typeof action.children === 'string') {
        return action.children;
    }
    return action.title;
}
function LinkWithMenuDialog({ children, onLongPress, ...rest }) {
    const [isModalVisible, setIsModalVisible] = (0, react_1.useState)(false);
    const triggerElement = (0, react_1.useMemo)(() => (0, children_1.getFirstChildOfType)(children, elements_1.LinkTrigger), [children]);
    const menuElement = (0, react_1.useMemo)(() => (0, children_1.getFirstChildOfType)(children, elements_1.LinkMenu), [children]);
    const trigger = (0, react_1.useMemo)(() => triggerElement ?? (0, children_1.getAllChildrenNotOfType)(children, elements_1.LinkMenu), [triggerElement, children]);
    const actions = (0, react_1.useMemo)(() => (menuElement ? extractActions(menuElement) : []), [menuElement]);
    const menuTitle = menuElement?.props.title;
    const handleLongPress = (e) => {
        if (actions.length > 0) {
            setIsModalVisible(true);
        }
        onLongPress?.(e);
    };
    return (<>
      <BaseExpoRouterLink_1.BaseExpoRouterLink {...rest} onLongPress={handleLongPress} children={trigger}/>
      <react_native_1.Modal visible={isModalVisible} transparent statusBarTranslucent animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
        <react_native_1.Pressable testID="menu-dialog-backdrop" style={styles.backdrop} accessibilityRole="none" onPress={() => setIsModalVisible(false)}>
          {/* onStartShouldSetResponder prevents backdrop onPress when tapping inside the dialog */}
          <react_native_1.View style={styles.dialog} accessibilityRole="menu" onStartShouldSetResponder={() => true}>
            {menuTitle ? <react_native_1.Text style={styles.title}>{menuTitle}</react_native_1.Text> : null}
            {actions.map((action, index) => {
            const label = getActionLabel(action);
            return (<react_native_1.Pressable key={index} disabled={action.disabled} accessibilityRole="menuitem" accessibilityLabel={label} accessibilityState={{ disabled: action.disabled }} onPress={() => {
                    setIsModalVisible(false);
                    action.onPress?.();
                }} style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}>
                  <react_native_1.Text style={[
                    styles.actionText,
                    action.destructive && styles.destructiveText,
                    action.disabled && styles.disabledText,
                ]}>
                    {label}
                  </react_native_1.Text>
                </react_native_1.Pressable>);
        })}
          </react_native_1.View>
        </react_native_1.Pressable>
      </react_native_1.Modal>
    </>);
}
const styles = react_native_1.StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dialog: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 8,
        minWidth: 240,
        maxWidth: '80%',
        elevation: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: react_native_1.StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
    },
    actionItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    actionItemPressed: {
        backgroundColor: '#f0f0f0',
    },
    actionText: {
        fontSize: 16,
        color: '#212121',
    },
    destructiveText: {
        color: '#FF3B30',
    },
    disabledText: {
        opacity: 0.38,
    },
});
//# sourceMappingURL=LinkWithMenuDialog.js.map