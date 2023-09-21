'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _jsxRuntime = require("react/jsx-runtime");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ScrollView = require('../Components/ScrollView/ScrollView');
var TouchableHighlight = require('../Components/Touchable/TouchableHighlight');
var View = require('../Components/View/View');
var FlatList = require('../Lists/FlatList');
var XHRInterceptor = require('../Network/XHRInterceptor');
var StyleSheet = require('../StyleSheet/StyleSheet');
var Text = require('../Text/Text');
var WebSocketInterceptor = require('../WebSocket/WebSocketInterceptor');
var React = require('react');
var LISTVIEW_CELL_HEIGHT = 15;
var nextXHRId = 0;
function getStringByValue(value) {
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string' && value.length > 500) {
    return String(value).substr(0, 500).concat('\n***TRUNCATED TO 500 CHARACTERS***');
  }
  return value;
}
function getTypeShortName(type) {
  if (type === 'XMLHttpRequest') {
    return 'XHR';
  } else if (type === 'WebSocket') {
    return 'WS';
  }
  return '';
}
function keyExtractor(request) {
  return String(request.id);
}
var NetworkOverlay = function (_React$Component) {
  (0, _inherits2.default)(NetworkOverlay, _React$Component);
  var _super = _createSuper(NetworkOverlay);
  function NetworkOverlay() {
    var _this;
    (0, _classCallCheck2.default)(this, NetworkOverlay);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _this._requestsListViewScrollMetrics = {
      offset: 0,
      visibleLength: 0,
      contentLength: 0
    };
    _this._socketIdMap = {};
    _this._xhrIdMap = {};
    _this.state = {
      detailRowId: null,
      requests: []
    };
    _this._renderItem = function (_ref) {
      var item = _ref.item,
        index = _ref.index;
      var tableRowViewStyle = [styles.tableRow, index % 2 === 1 ? styles.tableRowOdd : styles.tableRowEven, index === _this.state.detailRowId && styles.tableRowPressed];
      var urlCellViewStyle = styles.urlCellView;
      var methodCellViewStyle = styles.methodCellView;
      return (0, _jsxRuntime.jsx)(TouchableHighlight, {
        onPress: function onPress() {
          _this._pressRow(index);
        },
        children: (0, _jsxRuntime.jsx)(View, {
          children: (0, _jsxRuntime.jsxs)(View, {
            style: tableRowViewStyle,
            children: [(0, _jsxRuntime.jsx)(View, {
              style: urlCellViewStyle,
              children: (0, _jsxRuntime.jsx)(Text, {
                style: styles.cellText,
                numberOfLines: 1,
                children: item.url
              })
            }), (0, _jsxRuntime.jsx)(View, {
              style: methodCellViewStyle,
              children: (0, _jsxRuntime.jsx)(Text, {
                style: styles.cellText,
                numberOfLines: 1,
                children: getTypeShortName(item.type)
              })
            })]
          })
        })
      });
    };
    _this._indicateAdditionalRequests = function () {
      if (_this._requestsListView) {
        var distanceFromEndThreshold = LISTVIEW_CELL_HEIGHT * 2;
        var _this$_requestsListVi = _this._requestsListViewScrollMetrics,
          offset = _this$_requestsListVi.offset,
          visibleLength = _this$_requestsListVi.visibleLength,
          contentLength = _this$_requestsListVi.contentLength;
        var distanceFromEnd = contentLength - visibleLength - offset;
        var isCloseToEnd = distanceFromEnd <= distanceFromEndThreshold;
        if (isCloseToEnd) {
          _this._requestsListView.scrollToEnd();
        } else {
          _this._requestsListView.flashScrollIndicators();
        }
      }
    };
    _this._captureRequestsListView = function (listRef) {
      _this._requestsListView = listRef;
    };
    _this._requestsListViewOnScroll = function (e) {
      _this._requestsListViewScrollMetrics.offset = e.nativeEvent.contentOffset.y;
      _this._requestsListViewScrollMetrics.visibleLength = e.nativeEvent.layoutMeasurement.height;
      _this._requestsListViewScrollMetrics.contentLength = e.nativeEvent.contentSize.height;
    };
    _this._scrollDetailToTop = function () {
      if (_this._detailScrollView) {
        _this._detailScrollView.scrollTo({
          y: 0,
          animated: false
        });
      }
    };
    _this._closeButtonClicked = function () {
      _this.setState({
        detailRowId: null
      });
    };
    return _this;
  }
  (0, _createClass2.default)(NetworkOverlay, [{
    key: "_enableXHRInterception",
    value: function _enableXHRInterception() {
      var _this2 = this;
      if (XHRInterceptor.isInterceptorEnabled()) {
        return;
      }
      XHRInterceptor.setOpenCallback(function (method, url, xhr) {
        xhr._index = nextXHRId++;
        var xhrIndex = _this2.state.requests.length;
        _this2._xhrIdMap[xhr._index] = xhrIndex;
        var _xhr = {
          id: xhrIndex,
          type: 'XMLHttpRequest',
          method: method,
          url: url
        };
        _this2.setState({
          requests: _this2.state.requests.concat(_xhr)
        }, _this2._indicateAdditionalRequests);
      });
      XHRInterceptor.setRequestHeaderCallback(function (header, value, xhr) {
        var xhrIndex = _this2._getRequestIndexByXHRID(xhr._index);
        if (xhrIndex === -1) {
          return;
        }
        _this2.setState(function (_ref2) {
          var requests = _ref2.requests;
          var networkRequestInfo = requests[xhrIndex];
          if (!networkRequestInfo.requestHeaders) {
            networkRequestInfo.requestHeaders = {};
          }
          networkRequestInfo.requestHeaders[header] = value;
          return {
            requests: requests
          };
        });
      });
      XHRInterceptor.setSendCallback(function (data, xhr) {
        var xhrIndex = _this2._getRequestIndexByXHRID(xhr._index);
        if (xhrIndex === -1) {
          return;
        }
        _this2.setState(function (_ref3) {
          var requests = _ref3.requests;
          var networkRequestInfo = requests[xhrIndex];
          networkRequestInfo.dataSent = data;
          return {
            requests: requests
          };
        });
      });
      XHRInterceptor.setHeaderReceivedCallback(function (type, size, responseHeaders, xhr) {
        var xhrIndex = _this2._getRequestIndexByXHRID(xhr._index);
        if (xhrIndex === -1) {
          return;
        }
        _this2.setState(function (_ref4) {
          var requests = _ref4.requests;
          var networkRequestInfo = requests[xhrIndex];
          networkRequestInfo.responseContentType = type;
          networkRequestInfo.responseSize = size;
          networkRequestInfo.responseHeaders = responseHeaders;
          return {
            requests: requests
          };
        });
      });
      XHRInterceptor.setResponseCallback(function (status, timeout, response, responseURL, responseType, xhr) {
        var xhrIndex = _this2._getRequestIndexByXHRID(xhr._index);
        if (xhrIndex === -1) {
          return;
        }
        _this2.setState(function (_ref5) {
          var requests = _ref5.requests;
          var networkRequestInfo = requests[xhrIndex];
          networkRequestInfo.status = status;
          networkRequestInfo.timeout = timeout;
          networkRequestInfo.response = response;
          networkRequestInfo.responseURL = responseURL;
          networkRequestInfo.responseType = responseType;
          return {
            requests: requests
          };
        });
      });
      XHRInterceptor.enableInterception();
    }
  }, {
    key: "_enableWebSocketInterception",
    value: function _enableWebSocketInterception() {
      var _this3 = this;
      if (WebSocketInterceptor.isInterceptorEnabled()) {
        return;
      }
      WebSocketInterceptor.setConnectCallback(function (url, protocols, options, socketId) {
        var socketIndex = _this3.state.requests.length;
        _this3._socketIdMap[socketId] = socketIndex;
        var _webSocket = {
          id: socketIndex,
          type: 'WebSocket',
          url: url,
          protocols: protocols
        };
        _this3.setState({
          requests: _this3.state.requests.concat(_webSocket)
        }, _this3._indicateAdditionalRequests);
      });
      WebSocketInterceptor.setCloseCallback(function (statusCode, closeReason, socketId) {
        var socketIndex = _this3._socketIdMap[socketId];
        if (socketIndex === undefined) {
          return;
        }
        if (statusCode !== null && closeReason !== null) {
          _this3.setState(function (_ref6) {
            var requests = _ref6.requests;
            var networkRequestInfo = requests[socketIndex];
            networkRequestInfo.status = statusCode;
            networkRequestInfo.closeReason = closeReason;
            return {
              requests: requests
            };
          });
        }
      });
      WebSocketInterceptor.setSendCallback(function (data, socketId) {
        var socketIndex = _this3._socketIdMap[socketId];
        if (socketIndex === undefined) {
          return;
        }
        _this3.setState(function (_ref7) {
          var requests = _ref7.requests;
          var networkRequestInfo = requests[socketIndex];
          if (!networkRequestInfo.messages) {
            networkRequestInfo.messages = '';
          }
          networkRequestInfo.messages += 'Sent: ' + JSON.stringify(data) + '\n';
          return {
            requests: requests
          };
        });
      });
      WebSocketInterceptor.setOnMessageCallback(function (socketId, message) {
        var socketIndex = _this3._socketIdMap[socketId];
        if (socketIndex === undefined) {
          return;
        }
        _this3.setState(function (_ref8) {
          var requests = _ref8.requests;
          var networkRequestInfo = requests[socketIndex];
          if (!networkRequestInfo.messages) {
            networkRequestInfo.messages = '';
          }
          networkRequestInfo.messages += 'Received: ' + JSON.stringify(message) + '\n';
          return {
            requests: requests
          };
        });
      });
      WebSocketInterceptor.setOnCloseCallback(function (socketId, message) {
        var socketIndex = _this3._socketIdMap[socketId];
        if (socketIndex === undefined) {
          return;
        }
        _this3.setState(function (_ref9) {
          var requests = _ref9.requests;
          var networkRequestInfo = requests[socketIndex];
          networkRequestInfo.serverClose = message;
          return {
            requests: requests
          };
        });
      });
      WebSocketInterceptor.setOnErrorCallback(function (socketId, message) {
        var socketIndex = _this3._socketIdMap[socketId];
        if (socketIndex === undefined) {
          return;
        }
        _this3.setState(function (_ref10) {
          var requests = _ref10.requests;
          var networkRequestInfo = requests[socketIndex];
          networkRequestInfo.serverError = message;
          return {
            requests: requests
          };
        });
      });
      WebSocketInterceptor.enableInterception();
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      this._enableXHRInterception();
      this._enableWebSocketInterception();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      XHRInterceptor.disableInterception();
      WebSocketInterceptor.disableInterception();
    }
  }, {
    key: "_renderItemDetail",
    value: function _renderItemDetail(id) {
      var _this4 = this;
      var requestItem = this.state.requests[id];
      var details = Object.keys(requestItem).map(function (key) {
        if (key === 'id') {
          return;
        }
        return (0, _jsxRuntime.jsxs)(View, {
          style: styles.detailViewRow,
          children: [(0, _jsxRuntime.jsx)(Text, {
            style: [styles.detailViewText, styles.detailKeyCellView],
            children: key
          }), (0, _jsxRuntime.jsx)(Text, {
            style: [styles.detailViewText, styles.detailValueCellView],
            children: getStringByValue(requestItem[key])
          })]
        }, key);
      });
      return (0, _jsxRuntime.jsxs)(View, {
        children: [(0, _jsxRuntime.jsx)(TouchableHighlight, {
          style: styles.closeButton,
          onPress: this._closeButtonClicked,
          children: (0, _jsxRuntime.jsx)(View, {
            children: (0, _jsxRuntime.jsx)(Text, {
              style: styles.closeButtonText,
              children: "v"
            })
          })
        }), (0, _jsxRuntime.jsx)(ScrollView, {
          style: styles.detailScrollView,
          ref: function ref(scrollRef) {
            return _this4._detailScrollView = scrollRef;
          },
          children: details
        })]
      });
    }
  }, {
    key: "_pressRow",
    value: function _pressRow(rowId) {
      this.setState({
        detailRowId: rowId
      }, this._scrollDetailToTop);
    }
  }, {
    key: "_getRequestIndexByXHRID",
    value: function _getRequestIndexByXHRID(index) {
      if (index === undefined) {
        return -1;
      }
      var xhrIndex = this._xhrIdMap[index];
      if (xhrIndex === undefined) {
        return -1;
      } else {
        return xhrIndex;
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$state = this.state,
        requests = _this$state.requests,
        detailRowId = _this$state.detailRowId;
      return (0, _jsxRuntime.jsxs)(View, {
        style: styles.container,
        children: [detailRowId != null && this._renderItemDetail(detailRowId), (0, _jsxRuntime.jsx)(View, {
          style: styles.listViewTitle,
          children: requests.length > 0 && (0, _jsxRuntime.jsxs)(View, {
            style: styles.tableRow,
            children: [(0, _jsxRuntime.jsx)(View, {
              style: styles.urlTitleCellView,
              children: (0, _jsxRuntime.jsx)(Text, {
                style: styles.cellText,
                numberOfLines: 1,
                children: "URL"
              })
            }), (0, _jsxRuntime.jsx)(View, {
              style: styles.methodTitleCellView,
              children: (0, _jsxRuntime.jsx)(Text, {
                style: styles.cellText,
                numberOfLines: 1,
                children: "Type"
              })
            })]
          })
        }), (0, _jsxRuntime.jsx)(FlatList, {
          ref: this._captureRequestsListView,
          onScroll: this._requestsListViewOnScroll,
          style: styles.listView,
          data: requests,
          renderItem: this._renderItem,
          keyExtractor: keyExtractor,
          extraData: this.state
        })]
      });
    }
  }]);
  return NetworkOverlay;
}(React.Component);
var styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 5,
    paddingRight: 5
  },
  listViewTitle: {
    height: 20
  },
  listView: {
    flex: 1,
    height: 60
  },
  tableRow: {
    flexDirection: 'row',
    flex: 1,
    height: LISTVIEW_CELL_HEIGHT
  },
  tableRowEven: {
    backgroundColor: '#555'
  },
  tableRowOdd: {
    backgroundColor: '#000'
  },
  tableRowPressed: {
    backgroundColor: '#3B5998'
  },
  cellText: {
    color: 'white',
    fontSize: 12
  },
  methodTitleCellView: {
    height: 18,
    borderColor: '#DCD7CD',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    flex: 1
  },
  urlTitleCellView: {
    height: 18,
    borderColor: '#DCD7CD',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
    backgroundColor: '#444',
    flex: 5,
    paddingLeft: 3
  },
  methodCellView: {
    height: 15,
    borderColor: '#DCD7CD',
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  urlCellView: {
    height: 15,
    borderColor: '#DCD7CD',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
    flex: 5,
    paddingLeft: 3
  },
  detailScrollView: {
    flex: 1,
    height: 180,
    marginTop: 5,
    marginBottom: 5
  },
  detailKeyCellView: {
    flex: 1.3
  },
  detailValueCellView: {
    flex: 2
  },
  detailViewRow: {
    flexDirection: 'row',
    paddingHorizontal: 3
  },
  detailViewText: {
    color: 'white',
    fontSize: 11
  },
  closeButtonText: {
    color: 'white',
    fontSize: 10
  },
  closeButton: {
    marginTop: 5,
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
module.exports = NetworkOverlay;