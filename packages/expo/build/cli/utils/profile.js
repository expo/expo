"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.profile = void 0;
var _chalk = _interopRequireDefault(require("chalk"));
var Log = _interopRequireWildcard(require("../Log"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
const profile = (fn, functionName)=>{
    const name = _chalk.default.dim(`⏱  [profile] ${functionName !== null && functionName !== void 0 ? functionName : fn.name || 'unknown'}`);
    return (...args)=>{
        Log.time(name);
        const results1 = fn(...args);
        if (results1 instanceof Promise) {
            // @ts-ignore
            return new Promise((resolve, reject)=>{
                results1.then((results)=>{
                    resolve(results);
                    Log.timeEnd(name);
                }).catch((error)=>{
                    reject(error);
                    Log.timeEnd(name);
                });
            });
        } else {
            Log.timeEnd(name);
        }
        return results1;
    };
};
exports.profile = profile;

//# sourceMappingURL=profile.js.map