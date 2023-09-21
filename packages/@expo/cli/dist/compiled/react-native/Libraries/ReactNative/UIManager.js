var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _FabricUIManager = require("./FabricUIManager");
var _nullthrows = _interopRequireDefault(require("nullthrows"));
function isFabricReactTag(reactTag) {
  return reactTag % 2 === 0;
}
var UIManagerImpl = global.RN$Bridgeless === true ? require('./BridgelessUIManager') : require('./PaperUIManager');
var UIManager = Object.assign({}, UIManagerImpl, {
  measure: function measure(reactTag, callback) {
    if (isFabricReactTag(reactTag)) {
      var FabricUIManager = (0, _nullthrows.default)((0, _FabricUIManager.getFabricUIManager)());
      var shadowNode = FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measure(shadowNode, callback);
      } else {
        console.warn(`measure cannot find view with tag #${reactTag}`);
        callback();
      }
    } else {
      UIManagerImpl.measure(reactTag, callback);
    }
  },
  measureInWindow: function measureInWindow(reactTag, callback) {
    if (isFabricReactTag(reactTag)) {
      var FabricUIManager = (0, _nullthrows.default)((0, _FabricUIManager.getFabricUIManager)());
      var shadowNode = FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measureInWindow(shadowNode, callback);
      } else {
        console.warn(`measure cannot find view with tag #${reactTag}`);
        callback();
      }
    } else {
      UIManagerImpl.measureInWindow(reactTag, callback);
    }
  },
  measureLayout: function measureLayout(reactTag, ancestorReactTag, errorCallback, callback) {
    if (isFabricReactTag(reactTag)) {
      var FabricUIManager = (0, _nullthrows.default)((0, _FabricUIManager.getFabricUIManager)());
      var shadowNode = FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      var ancestorShadowNode = FabricUIManager.findShadowNodeByTag_DEPRECATED(ancestorReactTag);
      if (!shadowNode || !ancestorShadowNode) {
        return;
      }
      FabricUIManager.measureLayout(shadowNode, ancestorShadowNode, errorCallback, callback);
    } else {
      UIManagerImpl.measureLayout(reactTag, ancestorReactTag, errorCallback, callback);
    }
  },
  measureLayoutRelativeToParent: function measureLayoutRelativeToParent(reactTag, errorCallback, callback) {
    if (isFabricReactTag(reactTag)) {
      console.warn('RCTUIManager.measureLayoutRelativeToParent method is deprecated and it will not be implemented in newer versions of RN (Fabric) - T47686450');
      var FabricUIManager = (0, _nullthrows.default)((0, _FabricUIManager.getFabricUIManager)());
      var shadowNode = FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        FabricUIManager.measure(shadowNode, function (left, top, width, height, pageX, pageY) {
          callback(left, top, width, height);
        });
      }
    } else {
      UIManagerImpl.measureLayoutRelativeToParent(reactTag, errorCallback, callback);
    }
  },
  dispatchViewManagerCommand: function dispatchViewManagerCommand(reactTag, commandName, commandArgs) {
    if (isFabricReactTag(reactTag)) {
      var FabricUIManager = (0, _nullthrows.default)((0, _FabricUIManager.getFabricUIManager)());
      var shadowNode = FabricUIManager.findShadowNodeByTag_DEPRECATED(reactTag);
      if (shadowNode) {
        commandName = `${commandName}`;
        FabricUIManager.dispatchCommand(shadowNode, commandName, commandArgs);
      }
    } else {
      UIManagerImpl.dispatchViewManagerCommand(reactTag, commandName, commandArgs);
    }
  }
});
module.exports = UIManager;