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
exports.SplitViewStack = void 0;
const react_1 = __importStar(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_screens_1 = require("react-native-screens");
const IsWithinLayoutContext_1 = require("../layouts/IsWithinLayoutContext");
const Navigator_1 = require("../views/Navigator");
const COLUMN_ORDER = ['primary', 'supplementary', 'secondary'];
function getColumnIndex(column) {
    return COLUMN_ORDER.indexOf(column);
}
exports.SplitViewStack = (0, react_1.forwardRef)(function SplitViewStack({ columnChildren }, ref) {
    const hasSupplementary = columnChildren.length >= 2;
    const [visibleColumns, setVisibleColumns] = (0, react_1.useState)(['primary']);
    const visibleColumnsRef = (0, react_1.useRef)(visibleColumns);
    visibleColumnsRef.current = visibleColumns;
    const show = (0, react_1.useCallback)((column) => {
        if (column !== 'supplementary' && column !== 'secondary') {
            throw new Error(`SplitView.show(): Invalid column "${String(column)}". Only "supplementary" and "secondary" are valid arguments.`);
        }
        if (column === 'supplementary' && !hasSupplementary) {
            throw new Error('SplitView.show(): Cannot show "supplementary" column because no supplementary column exists.');
        }
        const current = visibleColumnsRef.current;
        // No-op if already visible
        if (current.includes(column)) {
            return;
        }
        const currentTop = current[current.length - 1];
        const targetIndex = getColumnIndex(column);
        const topIndex = getColumnIndex(currentTop);
        if (targetIndex <= topIndex) {
            throw new Error(`SplitView.show(): Cannot show "${column}" when "${currentTop}" is already visible on top.`);
        }
        if (column === 'secondary' && hasSupplementary && currentTop === 'primary') {
            throw new Error('SplitView.show(): Cannot skip "supplementary" column. Show it first before showing "secondary".');
        }
        const next = [...current, column];
        visibleColumnsRef.current = next;
        setVisibleColumns(next);
    }, [hasSupplementary]);
    (0, react_1.useImperativeHandle)(ref, () => ({ show }), [show]);
    const handleDismissed = (0, react_1.useCallback)((event) => {
        const count = event.nativeEvent.dismissCount;
        setVisibleColumns((current) => {
            if (current.length <= 1)
                return current;
            const next = current.slice(0, Math.max(1, current.length - count));
            visibleColumnsRef.current = next;
            return next;
        });
    }, []);
    const getColumnContent = (column) => {
        if (column === 'primary') {
            return columnChildren[0]?.props.children ?? null;
        }
        if (column === 'supplementary') {
            return columnChildren[1]?.props.children ?? null;
        }
        // secondary renders the Slot (router content)
        return (<IsWithinLayoutContext_1.IsWithinLayoutContext value>
          <Navigator_1.Slot />
        </IsWithinLayoutContext_1.IsWithinLayoutContext>);
    };
    return (<react_native_screens_1.ScreenStack style={{ flex: 1 }}>
        {visibleColumns.map((column, index) => (<react_native_screens_1.ScreenStackItem key={column} screenId={column} activityState={2} stackPresentation="push" stackAnimation="default" gestureEnabled={index > 0} onDismissed={index > 0 ? handleDismissed : undefined}>
            <react_native_safe_area_context_1.SafeAreaProvider>{getColumnContent(column)}</react_native_safe_area_context_1.SafeAreaProvider>
          </react_native_screens_1.ScreenStackItem>))}
      </react_native_screens_1.ScreenStack>);
});
//# sourceMappingURL=split-view-stack.js.map