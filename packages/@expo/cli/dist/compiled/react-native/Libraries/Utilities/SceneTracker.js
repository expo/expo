'use strict';

var _listeners = [];
var _activeScene = {
  name: 'default'
};
var SceneTracker = {
  setActiveScene: function setActiveScene(scene) {
    _activeScene = scene;
    _listeners.forEach(function (listener) {
      return listener(_activeScene);
    });
  },
  getActiveScene: function getActiveScene() {
    return _activeScene;
  },
  addActiveSceneChangedListener: function addActiveSceneChangedListener(callback) {
    _listeners.push(callback);
    return {
      remove: function remove() {
        _listeners = _listeners.filter(function (listener) {
          return callback !== listener;
        });
      }
    };
  }
};
module.exports = SceneTracker;
//# sourceMappingURL=SceneTracker.js.map