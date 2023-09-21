Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBackgroundColor = getBackgroundColor;
exports.getBackgroundDarkColor = getBackgroundDarkColor;
exports.getBackgroundLightColor = getBackgroundLightColor;
exports.getDividerColor = getDividerColor;
exports.getErrorColor = getErrorColor;
exports.getErrorDarkColor = getErrorDarkColor;
exports.getFatalColor = getFatalColor;
exports.getFatalDarkColor = getFatalDarkColor;
exports.getHighlightColor = getHighlightColor;
exports.getLogColor = getLogColor;
exports.getTextColor = getTextColor;
exports.getWarningColor = getWarningColor;
exports.getWarningDarkColor = getWarningDarkColor;
exports.getWarningHighlightColor = getWarningHighlightColor;
function getBackgroundColor(opacity) {
  return `rgba(51, 51, 51, ${opacity == null ? 1 : opacity})`;
}
function getBackgroundLightColor(opacity) {
  return `rgba(69, 69, 69, ${opacity == null ? 1 : opacity})`;
}
function getBackgroundDarkColor(opacity) {
  return `rgba(34, 34, 34, ${opacity == null ? 1 : opacity})`;
}
function getWarningColor(opacity) {
  return `rgba(250, 186, 48, ${opacity == null ? 1 : opacity})`;
}
function getWarningDarkColor(opacity) {
  return `rgba(224, 167, 8, ${opacity == null ? 1 : opacity})`;
}
function getFatalColor(opacity) {
  return `rgba(243, 83, 105, ${opacity == null ? 1 : opacity})`;
}
function getFatalDarkColor(opacity) {
  return `rgba(208, 75, 95, ${opacity == null ? 1 : opacity})`;
}
function getErrorColor(opacity) {
  return `rgba(243, 83, 105, ${opacity == null ? 1 : opacity})`;
}
function getErrorDarkColor(opacity) {
  return `rgba(208, 75, 95, ${opacity == null ? 1 : opacity})`;
}
function getLogColor(opacity) {
  return `rgba(119, 119, 119, ${opacity == null ? 1 : opacity})`;
}
function getWarningHighlightColor(opacity) {
  return `rgba(252, 176, 29, ${opacity == null ? 1 : opacity})`;
}
function getDividerColor(opacity) {
  return `rgba(255, 255, 255, ${opacity == null ? 1 : opacity})`;
}
function getHighlightColor(opacity) {
  return `rgba(252, 176, 29, ${opacity == null ? 1 : opacity})`;
}
function getTextColor(opacity) {
  return `rgba(255, 255, 255, ${opacity == null ? 1 : opacity})`;
}