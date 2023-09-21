Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkDuplicateRouteNames;
function checkDuplicateRouteNames(state) {
  var duplicates = [];
  var getRouteNames = function getRouteNames(location, state) {
    state.routes.forEach(function (route) {
      var _route$state, _route$state$routeNam;
      var currentLocation = location ? `${location} > ${route.name}` : route.name;
      (_route$state = route.state) == null ? void 0 : (_route$state$routeNam = _route$state.routeNames) == null ? void 0 : _route$state$routeNam.forEach(function (routeName) {
        if (routeName === route.name) {
          duplicates.push([currentLocation, `${currentLocation} > ${route.name}`]);
        }
      });
      if (route.state) {
        getRouteNames(currentLocation, route.state);
      }
    });
  };
  getRouteNames('', state);
  return duplicates;
}