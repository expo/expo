Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findFocusedRoute;
function findFocusedRoute(state) {
  var _current2, _current$index3, _current3;
  var current = state;
  while (((_current = current) == null ? void 0 : _current.routes[(_current$index = current.index) != null ? _current$index : 0].state) != null) {
    var _current, _current$index, _current$index2;
    current = current.routes[(_current$index2 = current.index) != null ? _current$index2 : 0].state;
  }
  var route = (_current2 = current) == null ? void 0 : _current2.routes[(_current$index3 = (_current3 = current) == null ? void 0 : _current3.index) != null ? _current$index3 : 0];
  return route;
}