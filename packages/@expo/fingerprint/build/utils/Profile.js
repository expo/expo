"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profile = void 0;
const chalk_1 = __importDefault(require("chalk"));
/**
 * Wrap a method and profile the time it takes to execute the method using `EXPO_PROFILE`.
 * Works best with named functions (i.e. not arrow functions).
 *
 * @param fn function to profile.
 * @param functionName optional name of the function to display in the profile output.
 */
function profile(options, fn, functionName = fn.name) {
    if (!process.env['DEBUG'] || options.silent) {
        return fn;
    }
    const name = chalk_1.default.dim(`⏱  [profile] ${functionName ?? 'unknown'}`);
    return ((...args) => {
        // Start the timer.
        console.time(name);
        // Invoke the method.
        const results = fn(...args);
        // If non-promise then return as-is.
        if (!(results instanceof Promise)) {
            console.timeEnd(name);
            return results;
        }
        // Otherwise await to profile after the promise resolves.
        return new Promise((resolve, reject) => {
            results.then((results) => {
                resolve(results);
                console.timeEnd(name);
            }, (reason) => {
                reject(reason);
                console.timeEnd(name);
            });
        });
    });
}
exports.profile = profile;
//# sourceMappingURL=Profile.js.map