"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = void 0;
const no_dynamic_env_var_1 = require("./no-dynamic-env-var");
const no_env_var_destructuring_1 = require("./no-env-var-destructuring");
const prefer_box_shadow_1 = require("./prefer-box-shadow");
const use_dom_exports_1 = require("./use-dom-exports");
exports.rules = {
    'no-dynamic-env-var': no_dynamic_env_var_1.noDynamicEnvVar,
    'no-env-var-destructuring': no_env_var_destructuring_1.noEnvVarDestructuring,
    'prefer-box-shadow': prefer_box_shadow_1.preferBoxShadow,
    'use-dom-exports': use_dom_exports_1.useDomExports,
};
