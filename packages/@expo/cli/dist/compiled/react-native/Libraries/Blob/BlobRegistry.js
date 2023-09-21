var registry = {};
var register = function register(id) {
  if (registry[id]) {
    registry[id]++;
  } else {
    registry[id] = 1;
  }
};
var unregister = function unregister(id) {
  if (registry[id]) {
    registry[id]--;
    if (registry[id] <= 0) {
      delete registry[id];
    }
  }
};
var has = function has(id) {
  return registry[id] && registry[id] > 0;
};
module.exports = {
  register: register,
  unregister: unregister,
  has: has
};