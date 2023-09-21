Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getDefaultHeaderHeight;
var _reactNative = require("react-native");
var formSheetModalHeight = 56;
function getDefaultHeaderHeight(layout, topInset, stackPresentation) {
  var headerHeight = _reactNative.Platform.OS === 'android' ? 56 : 64;
  var statusBarHeight = topInset;
  if (_reactNative.Platform.OS === 'ios') {
    var isLandscape = layout.width > layout.height;
    var isFromSheetModal = stackPresentation === 'modal' || stackPresentation === 'formSheet';
    if (isFromSheetModal && !isLandscape) {
      statusBarHeight = 0;
    }
    if (_reactNative.Platform.isPad || _reactNative.Platform.isTV) {
      headerHeight = isFromSheetModal ? formSheetModalHeight : 50;
    } else {
      if (isLandscape) {
        headerHeight = 32;
      } else {
        headerHeight = isFromSheetModal ? formSheetModalHeight : 44;
      }
    }
  }
  return headerHeight + statusBarHeight;
}