var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.URLSearchParams = exports.URL = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _NativeBlobModule = _interopRequireDefault(require("./NativeBlobModule"));
var _Symbol$iterator;
var BLOB_URL_PREFIX = null;
if (_NativeBlobModule.default && typeof _NativeBlobModule.default.getConstants().BLOB_URI_SCHEME === 'string') {
  var constants = _NativeBlobModule.default.getConstants();
  BLOB_URL_PREFIX = constants.BLOB_URI_SCHEME + ':';
  if (typeof constants.BLOB_URI_HOST === 'string') {
    BLOB_URL_PREFIX += `//${constants.BLOB_URI_HOST}/`;
  }
}
_Symbol$iterator = Symbol.iterator;
var URLSearchParams = function () {
  function URLSearchParams(params) {
    var _this = this;
    (0, _classCallCheck2.default)(this, URLSearchParams);
    this._searchParams = [];
    if (typeof params === 'object') {
      Object.keys(params).forEach(function (key) {
        return _this.append(key, params[key]);
      });
    }
  }
  (0, _createClass2.default)(URLSearchParams, [{
    key: "append",
    value: function append(key, value) {
      this._searchParams.push([key, value]);
    }
  }, {
    key: "delete",
    value: function _delete(name) {
      throw new Error('URLSearchParams.delete is not implemented');
    }
  }, {
    key: "get",
    value: function get(name) {
      throw new Error('URLSearchParams.get is not implemented');
    }
  }, {
    key: "getAll",
    value: function getAll(name) {
      throw new Error('URLSearchParams.getAll is not implemented');
    }
  }, {
    key: "has",
    value: function has(name) {
      throw new Error('URLSearchParams.has is not implemented');
    }
  }, {
    key: "set",
    value: function set(name, value) {
      throw new Error('URLSearchParams.set is not implemented');
    }
  }, {
    key: "sort",
    value: function sort() {
      throw new Error('URLSearchParams.sort is not implemented');
    }
  }, {
    key: _Symbol$iterator,
    value: function value() {
      return this._searchParams[Symbol.iterator]();
    }
  }, {
    key: "toString",
    value: function toString() {
      if (this._searchParams.length === 0) {
        return '';
      }
      var last = this._searchParams.length - 1;
      return this._searchParams.reduce(function (acc, curr, index) {
        return acc + encodeURIComponent(curr[0]) + '=' + encodeURIComponent(curr[1]) + (index === last ? '' : '&');
      }, '');
    }
  }]);
  return URLSearchParams;
}();
exports.URLSearchParams = URLSearchParams;
function validateBaseUrl(url) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)*(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/.test(url);
}
var URL = function () {
  function URL(url, base) {
    (0, _classCallCheck2.default)(this, URL);
    this._searchParamsInstance = null;
    var baseUrl = null;
    if (!base || validateBaseUrl(url)) {
      this._url = url;
      if (!this._url.endsWith('/')) {
        this._url += '/';
      }
    } else {
      if (typeof base === 'string') {
        baseUrl = base;
        if (!validateBaseUrl(baseUrl)) {
          throw new TypeError(`Invalid base URL: ${baseUrl}`);
        }
      } else {
        baseUrl = base.toString();
      }
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, baseUrl.length - 1);
      }
      if (!url.startsWith('/')) {
        url = `/${url}`;
      }
      if (baseUrl.endsWith(url)) {
        url = '';
      }
      this._url = `${baseUrl}${url}`;
    }
  }
  (0, _createClass2.default)(URL, [{
    key: "hash",
    get: function get() {
      throw new Error('URL.hash is not implemented');
    }
  }, {
    key: "host",
    get: function get() {
      throw new Error('URL.host is not implemented');
    }
  }, {
    key: "hostname",
    get: function get() {
      throw new Error('URL.hostname is not implemented');
    }
  }, {
    key: "href",
    get: function get() {
      return this.toString();
    }
  }, {
    key: "origin",
    get: function get() {
      throw new Error('URL.origin is not implemented');
    }
  }, {
    key: "password",
    get: function get() {
      throw new Error('URL.password is not implemented');
    }
  }, {
    key: "pathname",
    get: function get() {
      throw new Error('URL.pathname not implemented');
    }
  }, {
    key: "port",
    get: function get() {
      throw new Error('URL.port is not implemented');
    }
  }, {
    key: "protocol",
    get: function get() {
      throw new Error('URL.protocol is not implemented');
    }
  }, {
    key: "search",
    get: function get() {
      throw new Error('URL.search is not implemented');
    }
  }, {
    key: "searchParams",
    get: function get() {
      if (this._searchParamsInstance == null) {
        this._searchParamsInstance = new URLSearchParams();
      }
      return this._searchParamsInstance;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.toString();
    }
  }, {
    key: "toString",
    value: function toString() {
      if (this._searchParamsInstance === null) {
        return this._url;
      }
      var instanceString = this._searchParamsInstance.toString();
      var separator = this._url.indexOf('?') > -1 ? '&' : '?';
      return this._url + separator + instanceString;
    }
  }, {
    key: "username",
    get: function get() {
      throw new Error('URL.username is not implemented');
    }
  }], [{
    key: "createObjectURL",
    value: function createObjectURL(blob) {
      if (BLOB_URL_PREFIX === null) {
        throw new Error('Cannot create URL for blob!');
      }
      return `${BLOB_URL_PREFIX}${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.size}`;
    }
  }, {
    key: "revokeObjectURL",
    value: function revokeObjectURL(url) {}
  }]);
  return URL;
}();
exports.URL = URL;
//# sourceMappingURL=URL.js.map