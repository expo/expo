"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = void 0;
const arg_1 = __importDefault(require("arg"));
const constants_1 = require("../constants");
const parseArgs = ({ spec, argv, stopAtPositional }) => {
    try {
        const parsed = (0, arg_1.default)(spec, { argv, stopAtPositional });
        return parsed;
    }
    catch (error) {
        if (error instanceof arg_1.default.ArgError) {
            return constants_1.Errors.unknownOption(error);
        }
        return constants_1.Errors.generic(error);
    }
};
exports.parseArgs = parseArgs;
