var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _EventEmitter = _interopRequireDefault(require("../vendor/emitter/EventEmitter"));
var BatchedBridge = require("../BatchedBridge/BatchedBridge");
var infoLog = require("../Utilities/infoLog");
var TaskQueue = require("./TaskQueue");
var invariant = require('invariant');
var _emitter = new _EventEmitter.default();
var DEBUG_DELAY = 0;
var DEBUG = false;
var InteractionManager = {
  Events: {
    interactionStart: 'interactionStart',
    interactionComplete: 'interactionComplete'
  },
  runAfterInteractions: function runAfterInteractions(task) {
    var tasks = [];
    var promise = new Promise(function (resolve) {
      _scheduleUpdate();
      if (task) {
        tasks.push(task);
      }
      tasks.push({
        run: resolve,
        name: 'resolve ' + (task && task.name || '?')
      });
      _taskQueue.enqueueTasks(tasks);
    });
    return {
      then: promise.then.bind(promise),
      cancel: function cancel() {
        _taskQueue.cancelTasks(tasks);
      }
    };
  },
  createInteractionHandle: function createInteractionHandle() {
    DEBUG && infoLog('InteractionManager: create interaction handle');
    _scheduleUpdate();
    var handle = ++_inc;
    _addInteractionSet.add(handle);
    return handle;
  },
  clearInteractionHandle: function clearInteractionHandle(handle) {
    DEBUG && infoLog('InteractionManager: clear interaction handle');
    invariant(!!handle, 'InteractionManager: Must provide a handle to clear.');
    _scheduleUpdate();
    _addInteractionSet.delete(handle);
    _deleteInteractionSet.add(handle);
  },
  addListener: _emitter.addListener.bind(_emitter),
  setDeadline: function setDeadline(deadline) {
    _deadline = deadline;
  }
};
var _interactionSet = new Set();
var _addInteractionSet = new Set();
var _deleteInteractionSet = new Set();
var _taskQueue = new TaskQueue({
  onMoreTasks: _scheduleUpdate
});
var _nextUpdateHandle = 0;
var _inc = 0;
var _deadline = -1;
function _scheduleUpdate() {
  if (!_nextUpdateHandle) {
    if (_deadline > 0) {
      _nextUpdateHandle = setTimeout(_processUpdate, 0 + DEBUG_DELAY);
    } else {
      _nextUpdateHandle = setImmediate(_processUpdate);
    }
  }
}
function _processUpdate() {
  _nextUpdateHandle = 0;
  var interactionCount = _interactionSet.size;
  _addInteractionSet.forEach(function (handle) {
    return _interactionSet.add(handle);
  });
  _deleteInteractionSet.forEach(function (handle) {
    return _interactionSet.delete(handle);
  });
  var nextInteractionCount = _interactionSet.size;
  if (interactionCount !== 0 && nextInteractionCount === 0) {
    _emitter.emit(InteractionManager.Events.interactionComplete);
  } else if (interactionCount === 0 && nextInteractionCount !== 0) {
    _emitter.emit(InteractionManager.Events.interactionStart);
  }
  if (nextInteractionCount === 0) {
    while (_taskQueue.hasTasksToProcess()) {
      _taskQueue.processNext();
      if (_deadline > 0 && BatchedBridge.getEventLoopRunningTime() >= _deadline) {
        _scheduleUpdate();
        break;
      }
    }
  }
  _addInteractionSet.clear();
  _deleteInteractionSet.clear();
}
module.exports = InteractionManager;
//# sourceMappingURL=InteractionManager.js.map