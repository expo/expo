var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var ReadOnlyNode = function () {
  function ReadOnlyNode() {
    (0, _classCallCheck2.default)(this, ReadOnlyNode);
  }
  (0, _createClass2.default)(ReadOnlyNode, [{
    key: "childNodes",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "firstChild",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "isConnected",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "lastChild",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "nextSibling",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "nodeName",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "nodeType",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "nodeValue",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "parentElement",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "parentNode",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "previousSibling",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "textContent",
    get: function get() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "compareDocumentPosition",
    value: function compareDocumentPosition(otherNode) {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "contains",
    value: function contains(otherNode) {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "getRootNode",
    value: function getRootNode() {
      throw new TypeError('Unimplemented');
    }
  }, {
    key: "hasChildNodes",
    value: function hasChildNodes() {
      throw new TypeError('Unimplemented');
    }
  }]);
  return ReadOnlyNode;
}();
exports.default = ReadOnlyNode;
ReadOnlyNode.ELEMENT_NODE = 1;
ReadOnlyNode.ATTRIBUTE_NODE = 2;
ReadOnlyNode.TEXT_NODE = 3;
ReadOnlyNode.CDATA_SECTION_NODE = 4;
ReadOnlyNode.ENTITY_REFERENCE_NODE = 5;
ReadOnlyNode.ENTITY_NODE = 6;
ReadOnlyNode.PROCESSING_INSTRUCTION_NODE = 7;
ReadOnlyNode.COMMENT_NODE = 8;
ReadOnlyNode.DOCUMENT_NODE = 9;
ReadOnlyNode.DOCUMENT_TYPE_NODE = 10;
ReadOnlyNode.DOCUMENT_FRAGMENT_NODE = 11;
ReadOnlyNode.NOTATION_NODE = 12;
ReadOnlyNode.DOCUMENT_POSITION_DISCONNECTED = 1;
ReadOnlyNode.DOCUMENT_POSITION_PRECEDING = 2;
ReadOnlyNode.DOCUMENT_POSITION_FOLLOWING = 4;
ReadOnlyNode.DOCUMENT_POSITION_CONTAINS = 8;
ReadOnlyNode.DOCUMENT_POSITION_CONTAINED_BY = 16;
ReadOnlyNode.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;