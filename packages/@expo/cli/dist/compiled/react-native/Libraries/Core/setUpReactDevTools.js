'use strict';

if (__DEV__) {
  var isWebSocketOpen = false;
  var ws = null;
  var reactDevTools = require('react-devtools-core');
  var connectToDevTools = function connectToDevTools() {
    if (ws !== null && isWebSocketOpen) {
      return;
    }
    if (!window.document) {
      var AppState = require('../AppState/AppState');
      var getDevServer = require('./Devtools/getDevServer');
      var isAppActive = function isAppActive() {
        return AppState.currentState !== 'background';
      };
      var devServer = getDevServer();
      var host = devServer.bundleLoadedFromServer ? devServer.url.replace(/https?:\/\//, '').replace(/\/$/, '').split(':')[0] : 'localhost';
      var port = window.__REACT_DEVTOOLS_PORT__ != null ? window.__REACT_DEVTOOLS_PORT__ : 8097;
      var WebSocket = require('../WebSocket/WebSocket');
      ws = new WebSocket('ws://' + host + ':' + port);
      ws.addEventListener('close', function (event) {
        isWebSocketOpen = false;
      });
      ws.addEventListener('open', function (event) {
        isWebSocketOpen = true;
      });
      var ReactNativeStyleAttributes = require('../Components/View/ReactNativeStyleAttributes');
      var devToolsSettingsManager = require('../DevToolsSettings/DevToolsSettingsManager');
      reactDevTools.connectToDevTools({
        isAppActive: isAppActive,
        resolveRNStyle: require('../StyleSheet/flattenStyle'),
        nativeStyleEditorValidAttributes: Object.keys(ReactNativeStyleAttributes),
        websocket: ws,
        devToolsSettingsManager: devToolsSettingsManager
      });
    }
  };
  var RCTNativeAppEventEmitter = require('../EventEmitter/RCTNativeAppEventEmitter');
  RCTNativeAppEventEmitter.addListener('RCTDevMenuShown', connectToDevTools);
  connectToDevTools();
}