/**
 * @fileoverview Eslint rules for Expo apps
 * @author Expo
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const path = require('path');
const requireIndex = require('requireindex');

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// import all rules in lib/rules
module.exports.rules = requireIndex(path.join(__dirname, '/rules'));
