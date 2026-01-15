"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
/**
 * Prints the help message for the CLI.
 */
const helpAction = async () => {
    console.log(constants_1.Help.General);
};
exports.default = helpAction;
