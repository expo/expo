"use strict";
// Types for the options passed into the command
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPlatform = exports.validPlatforms = void 0;
exports.validPlatforms = ['android', 'ios'];
const isValidPlatform = (p) => exports.validPlatforms.includes(p);
exports.isValidPlatform = isValidPlatform;
