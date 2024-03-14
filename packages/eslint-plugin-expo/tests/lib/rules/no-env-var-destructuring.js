/**
 * @fileoverview Disallow destructuring env vars from process.env
 * @author Expo
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/no-env-var-destructuring"),
  RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2015 },
});

ruleTester.run("no-env-var-destructuring", rule, {
  valid: [
    {
      code: 'const myVar = process.env.MY_VAR;',
    },
    {
      code:     "const food = 'potato';"
    }
  ],

  invalid: [
    {
      code: 'const { MY_VAR } = process.env;',
      errors: [
        {
          message: 'Unexpected desctucturing. Cannot descructure MY_VAR from process.env',
          type: 'VariableDeclarator'
        },
      ],
    },
    {
      code: 'const { MY_VAR, ANOTHER_VAR } = process.env;',
      errors: [
        {
          message: 'Unexpected desctucturing. Cannot descructure MY_VAR from process.env',
          type: 'VariableDeclarator'
        },
        {
          message: 'Unexpected desctucturing. Cannot descructure ANOTHER_VAR from process.env',
          type: 'VariableDeclarator'
        },
      ],
    },
  ],
});
