"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-expect-error - the directory structure is different after building
const package_json_1 = require("../../../../package.json");
/**
 * Prints the version of the CLI (= the version of the package).
 */
const action = async () => {
    console.log(package_json_1.version);
};
exports.default = action;
