/**
 * @fileoverview Prevents process.env from being accessed dynamically
 * @author Expo
 */
'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const RuleTester = require('eslint').RuleTester;

const rule = require('../../../lib/rules/no-dynamic-env-var');

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2015 },
});

ruleTester.run('no-dynamic-env-var', rule, {
  valid: [{ code: 'const myVar = process.env.MY_VAR;' }],

  invalid: [
    {
      code: 'const myVar = process.env["MY_VAR"]',
      errors: [
        {
          message: 'Unexpected dynamic access. Cannot dynamically access MY_VAR from process.env',
          type: 'VariableDeclarator',
        },
      ],
    },
    {
      code: 'const dynamicVar = "MY_VAR"; const myVar = process.env[dynamicVar];',
      errors: [
        {
          message:
            'Unexpected dynamic access. Cannot dynamically access dynamicVar from process.env',
          type: 'VariableDeclarator',
        },
      ],
    },
  ],
});
