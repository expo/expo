Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = splitLayoutProps;
function splitLayoutProps(props) {
  var outer = null;
  var inner = null;
  if (props != null) {
    outer = {};
    inner = {};
    for (var prop of Object.keys(props)) {
      switch (prop) {
        case 'margin':
        case 'marginHorizontal':
        case 'marginVertical':
        case 'marginBottom':
        case 'marginTop':
        case 'marginLeft':
        case 'marginRight':
        case 'flex':
        case 'flexGrow':
        case 'flexShrink':
        case 'flexBasis':
        case 'alignSelf':
        case 'height':
        case 'minHeight':
        case 'maxHeight':
        case 'width':
        case 'minWidth':
        case 'maxWidth':
        case 'position':
        case 'left':
        case 'right':
        case 'bottom':
        case 'top':
        case 'transform':
        case 'rowGap':
        case 'columnGap':
        case 'gap':
          outer[prop] = props[prop];
          break;
        default:
          inner[prop] = props[prop];
          break;
      }
    }
  }
  return {
    outer: outer,
    inner: inner
  };
}
//# sourceMappingURL=splitLayoutProps.js.map