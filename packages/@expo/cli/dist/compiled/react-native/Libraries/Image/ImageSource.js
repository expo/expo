'use strict';
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getImageSourceProperties = getImageSourceProperties;
function getImageSourceProperties(imageSource) {
  var object = {};
  if (imageSource.body != null) {
    object.body = imageSource.body;
  }
  if (imageSource.bundle != null) {
    object.bundle = imageSource.bundle;
  }
  if (imageSource.cache != null) {
    object.cache = imageSource.cache;
  }
  if (imageSource.headers != null) {
    object.headers = imageSource.headers;
  }
  if (imageSource.height != null) {
    object.height = imageSource.height;
  }
  if (imageSource.method != null) {
    object.method = imageSource.method;
  }
  if (imageSource.scale != null) {
    object.scale = imageSource.scale;
  }
  if (imageSource.uri != null) {
    object.uri = imageSource.uri;
  }
  if (imageSource.width != null) {
    object.width = imageSource.width;
  }
  return object;
}