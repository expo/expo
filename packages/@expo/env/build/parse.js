"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expand = expand;
exports.parse = parse;
function _nodeUtil() {
  const data = require("node:util");
  _nodeUtil = function () {
    return data;
  };
  return data;
}
function parse(contents) {
  const parsed = (0, _nodeUtil().parseEnv)(contents);
  const env = {};
  // NOTE(@kitten): In Node <=20.20 some keys are not properly trimmed
  for (const key in parsed) env[key.trim()] = parsed[key];
  return env;
}

// See: dotenv-expand@11.0.7
// https://github.com/motdotla/dotenv-expand/blob/v11.0.7/lib/main.js
// Copyright (c) 2016, Scott Motte

/*
 * (\\)?    # is it escaped with a backslash?
 * (\$)     # literal $
 * (?!\()   # shouldnt be followed by parenthesis
 * (\{?)    # first brace wrap opening
 * ([\w.]+) # key
 * (?::-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))? # optional default nested 3 times
 * (\}?)    # last brace warp closing
 */
const DOTENV_SUBSTITUTION_REGEX = /(\\)?(\$)(?!\()(\{?)([\w.]+)(?::?-((?:\$\{(?:\$\{(?:\$\{[^}]*\}|[^}])*}|[^}])*}|[^}])+))?(\}?)/gi;
function interpolate(value, sourceKey, sourceEnv, inputEnv) {
  return value.replace(DOTENV_SUBSTITUTION_REGEX, (match, escaped, _dollarSign, _openBrace, key, defaultValue, _closeBrace) => {
    if (escaped === '\\') {
      return match.slice(1);
    } else if (sourceEnv[key]) {
      return sourceEnv[key] === inputEnv[key] ? sourceEnv[key] : interpolate(sourceEnv[key], key, sourceEnv, inputEnv);
    } else if (inputEnv[key] && key !== sourceKey) {
      return interpolate(inputEnv[key], key, sourceEnv, inputEnv);
    } else if (defaultValue) {
      return defaultValue.startsWith('$') ? interpolate(defaultValue, key, sourceEnv, inputEnv) : defaultValue;
    } else {
      return '';
    }
  });
}
function expand(inputEnv, sourceEnv) {
  const outputEnv = {
    ...inputEnv
  };
  for (const key in outputEnv) {
    let value = outputEnv[key];
    if (Object.prototype.hasOwnProperty.call(sourceEnv, key)) {
      value = value != null && sourceEnv[key] === value ? interpolate(value, key, sourceEnv, outputEnv) : inputEnv[key];
    } else if (value != null) {
      value = interpolate(value, key, sourceEnv, outputEnv);
    }
    if (value != null) {
      outputEnv[key] = value.replace(/\\\$/g, '$');
    }
  }
  return outputEnv;
}
//# sourceMappingURL=parse.js.map