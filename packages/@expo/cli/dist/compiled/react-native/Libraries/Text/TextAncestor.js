'use strict';

var React = require('react');
var TextAncestorContext = React.createContext(false);
if (__DEV__) {
  TextAncestorContext.displayName = 'TextAncestorContext';
}
module.exports = TextAncestorContext;