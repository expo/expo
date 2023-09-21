'use strict';

var normalizeColor = require('@react-native/normalize-colors');
var colorPropType = function colorPropType(isRequired, props, propName, componentName, location, propFullName) {
  var color = props[propName];
  if (color == null) {
    if (isRequired) {
      return new Error('Required ' + location + ' `' + (propFullName || propName) + '` was not specified in `' + componentName + '`.');
    }
    return;
  }
  if (typeof color === 'number') {
    return;
  }
  if (typeof color === 'string' && normalizeColor(color) === null) {
    return new Error('Invalid ' + location + ' `' + (propFullName || propName) + '` supplied to `' + componentName + '`: ' + color + '\n' + `Valid color formats are
  - '#f0f' (#rgb)
  - '#f0fc' (#rgba)
  - '#ff00ff' (#rrggbb)
  - '#ff00ff00' (#rrggbbaa)
  - 'rgb(255, 255, 255)'
  - 'rgba(255, 255, 255, 1.0)'
  - 'hsl(360, 100%, 100%)'
  - 'hsla(360, 100%, 100%, 1.0)'
  - 'transparent'
  - 'red'
  - 0xff00ff00 (0xrrggbbaa)
`);
  }
};
var ColorPropType = colorPropType.bind(null, false);
ColorPropType.isRequired = colorPropType.bind(null, true);
module.exports = ColorPropType;