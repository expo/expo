import "foo";

console.log(exports);
console.log(exports.prop);
exports++;
exports += 4;
({ exports } = {});
[ exports ] = [];
exports = {};
exports.prop = "";


console.log(module);
console.log(module.exports);
module++;
module += 4;
({ module } = {});
[ module ] = [];
module = {};
module.prop = "";


