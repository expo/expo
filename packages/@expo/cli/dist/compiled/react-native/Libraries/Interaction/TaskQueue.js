'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var infoLog = require("../Utilities/infoLog");
var invariant = require('invariant');
var DEBUG = false;
var TaskQueue = function () {
  function TaskQueue(_ref) {
    var onMoreTasks = _ref.onMoreTasks;
    (0, _classCallCheck2.default)(this, TaskQueue);
    this._onMoreTasks = onMoreTasks;
    this._queueStack = [{
      tasks: [],
      popable: false
    }];
  }
  (0, _createClass2.default)(TaskQueue, [{
    key: "enqueue",
    value: function enqueue(task) {
      this._getCurrentQueue().push(task);
    }
  }, {
    key: "enqueueTasks",
    value: function enqueueTasks(tasks) {
      var _this = this;
      tasks.forEach(function (task) {
        return _this.enqueue(task);
      });
    }
  }, {
    key: "cancelTasks",
    value: function cancelTasks(tasksToCancel) {
      this._queueStack = this._queueStack.map(function (queue) {
        return Object.assign({}, queue, {
          tasks: queue.tasks.filter(function (task) {
            return tasksToCancel.indexOf(task) === -1;
          })
        });
      }).filter(function (queue, idx) {
        return queue.tasks.length > 0 || idx === 0;
      });
    }
  }, {
    key: "hasTasksToProcess",
    value: function hasTasksToProcess() {
      return this._getCurrentQueue().length > 0;
    }
  }, {
    key: "processNext",
    value: function processNext() {
      var queue = this._getCurrentQueue();
      if (queue.length) {
        var task = queue.shift();
        try {
          if (typeof task === 'object' && task.gen) {
            DEBUG && infoLog('TaskQueue: genPromise for task ' + task.name);
            this._genPromise(task);
          } else if (typeof task === 'object' && task.run) {
            DEBUG && infoLog('TaskQueue: run task ' + task.name);
            task.run();
          } else {
            invariant(typeof task === 'function', 'Expected Function, SimpleTask, or PromiseTask, but got:\n' + JSON.stringify(task, null, 2));
            DEBUG && infoLog('TaskQueue: run anonymous task');
            task();
          }
        } catch (e) {
          e.message = 'TaskQueue: Error with task ' + (task.name || '') + ': ' + e.message;
          throw e;
        }
      }
    }
  }, {
    key: "_getCurrentQueue",
    value: function _getCurrentQueue() {
      var stackIdx = this._queueStack.length - 1;
      var queue = this._queueStack[stackIdx];
      if (queue.popable && queue.tasks.length === 0 && this._queueStack.length > 1) {
        this._queueStack.pop();
        DEBUG && infoLog('TaskQueue: popped queue: ', {
          stackIdx: stackIdx,
          queueStackSize: this._queueStack.length
        });
        return this._getCurrentQueue();
      } else {
        return queue.tasks;
      }
    }
  }, {
    key: "_genPromise",
    value: function _genPromise(task) {
      var _this2 = this;
      this._queueStack.push({
        tasks: [],
        popable: false
      });
      var stackIdx = this._queueStack.length - 1;
      var stackItem = this._queueStack[stackIdx];
      DEBUG && infoLog('TaskQueue: push new queue: ', {
        stackIdx: stackIdx
      });
      DEBUG && infoLog('TaskQueue: exec gen task ' + task.name);
      task.gen().then(function () {
        DEBUG && infoLog('TaskQueue: onThen for gen task ' + task.name, {
          stackIdx: stackIdx,
          queueStackSize: _this2._queueStack.length
        });
        stackItem.popable = true;
        _this2.hasTasksToProcess() && _this2._onMoreTasks();
      }).catch(function (ex) {
        setTimeout(function () {
          ex.message = `TaskQueue: Error resolving Promise in task ${task.name}: ${ex.message}`;
          throw ex;
        }, 0);
      });
    }
  }]);
  return TaskQueue;
}();
module.exports = TaskQueue;
//# sourceMappingURL=TaskQueue.js.map