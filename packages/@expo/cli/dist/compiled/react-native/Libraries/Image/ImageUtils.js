Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertObjectFitToResizeMode = convertObjectFitToResizeMode;
function convertObjectFitToResizeMode(objectFit) {
  var objectFitMap = {
    contain: 'contain',
    cover: 'cover',
    fill: 'stretch',
    'scale-down': 'contain'
  };
  return objectFitMap[objectFit];
}
//# sourceMappingURL=ImageUtils.js.map