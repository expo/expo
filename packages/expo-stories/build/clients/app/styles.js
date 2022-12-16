"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.styles = void 0;
var styleguide_native_1 = require("@expo/styleguide-native");
var react_native_1 = require("react-native");
exports.styles = react_native_1.StyleSheet.create({
    flexContainer: {
        flex: 1,
        backgroundColor: styleguide_native_1.lightTheme.background.default,
    },
    storyRow: {},
    storyButtonRow: {
        padding: styleguide_native_1.spacing[4],
    },
    storyTitle: {
        paddingVertical: styleguide_native_1.spacing[2],
        paddingHorizontal: styleguide_native_1.spacing[3],
        marginTop: styleguide_native_1.spacing[4],
        marginBottom: styleguide_native_1.spacing[1],
        fontSize: 20,
        fontWeight: '700',
    },
    storyButton: __assign({ borderRadius: 4, paddingVertical: styleguide_native_1.spacing[4], marginVertical: styleguide_native_1.spacing[2], backgroundColor: styleguide_native_1.lightTheme.button.primary.background }, styleguide_native_1.shadows.button),
    storyButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: styleguide_native_1.lightTheme.button.primary.foreground,
        textAlign: 'center',
    },
    refreshButton: {
        position: 'absolute',
        padding: styleguide_native_1.spacing[3],
        bottom: styleguide_native_1.spacing[6],
        left: 0,
        right: 0,
    },
    refreshLoader: {
        position: 'absolute',
        right: styleguide_native_1.spacing[4],
        bottom: 0,
        top: 0,
    },
    loadingContainer: __assign(__assign({}, react_native_1.StyleSheet.absoluteFillObject), { justifyContent: 'center', alignItems: 'center' }),
    listContainer: {
        paddingBottom: styleguide_native_1.spacing[24] + styleguide_native_1.spacing[6],
    },
    seeSelectionButtonContainer: {
        position: 'absolute',
        bottom: styleguide_native_1.spacing[24],
        left: 0,
        right: 0,
        paddingHorizontal: styleguide_native_1.spacing[6],
    },
    sectionHeaderContainer: {
        paddingTop: styleguide_native_1.spacing[6],
        paddingBottom: styleguide_native_1.spacing[2],
        paddingHorizontal: styleguide_native_1.spacing[3],
    },
    sectionHeader: {
        fontSize: 24,
        fontWeight: '700',
        color: styleguide_native_1.lightTheme.text.default,
    },
});
//# sourceMappingURL=styles.js.map