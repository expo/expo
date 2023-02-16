'use strict';
const generate = require('@babel/generator').default;
const hash = require('string-hash-64');
const traverse = require('@babel/traverse').default;
const { transformSync } = require('@babel/core');
/**
 * holds a map of function names as keys and array of argument indexes as values which should be automatically workletized(they have to be functions)(starting from 0)
 */
const functionArgsToWorkletize = new Map([
  ['useFrameCallback', [0]],
  ['useAnimatedStyle', [0]],
  ['useAnimatedProps', [0]],
  ['createAnimatedPropAdapter', [0]],
  ['useDerivedValue', [0]],
  ['useAnimatedScrollHandler', [0]],
  ['useAnimatedReaction', [0, 1]],
  ['useWorkletCallback', [0]],
  // animations' callbacks
  ['withTiming', [2]],
  ['withSpring', [2]],
  ['withDecay', [1]],
  ['withRepeat', [3]],
]);

const objectHooks = new Set([
  'useAnimatedGestureHandler',
  'useAnimatedScrollHandler',
]);

const globals = new Set([
  'this',
  'console',
  'performance',
  '_setGlobalConsole',
  '_chronoNow',
  'Date',
  'Array',
  'ArrayBuffer',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'Date',
  'HermesInternal',
  'JSON',
  'Math',
  'Number',
  'Object',
  'String',
  'Symbol',
  'undefined',
  'null',
  'UIManager',
  'requestAnimationFrame',
  '_WORKLET',
  'arguments',
  'Boolean',
  'parseInt',
  'parseFloat',
  'Map',
  'Set',
  '_log',
  '_updateProps',
  'RegExp',
  'Error',
  'global',
  '_measure',
  '_scrollTo',
  '_setGestureState',
  '_getCurrentTime',
  '_eventTimestamp',
  '_frameTimestamp',
  'isNaN',
  'LayoutAnimationRepository',
  '_stopObservingProgress',
  '_startObservingProgress',
]);

// leaving way to avoid deep capturing by adding 'stopCapturing' to the blacklist
const blacklistedFunctions = new Set([
  'stopCapturing',
  'toString',
  'map',
  'filter',
  'findIndex',
  'forEach',
  'valueOf',
  'toPrecision',
  'toExponential',
  'constructor',
  'toFixed',
  'toLocaleString',
  'toSource',
  'charAt',
  'charCodeAt',
  'concat',
  'indexOf',
  'lastIndexOf',
  'localeCompare',
  'length',
  'match',
  'replace',
  'search',
  'slice',
  'split',
  'substr',
  'substring',
  'toLocaleLowerCase',
  'toLocaleUpperCase',
  'toLowerCase',
  'toUpperCase',
  'every',
  'join',
  'pop',
  'push',
  'reduce',
  'reduceRight',
  'reverse',
  'shift',
  'slice',
  'some',
  'sort',
  'splice',
  'unshift',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'bind',
  'apply',
  'call',
  '__callAsync',
  'includes',
]);

const possibleOptFunction = new Set(['interpolate']);

const gestureHandlerGestureObjects = new Set([
  // from https://github.com/software-mansion/react-native-gesture-handler/blob/new-api/src/handlers/gestures/gestureObjects.ts
  'Tap',
  'Pan',
  'Pinch',
  'Rotation',
  'Fling',
  'LongPress',
  'ForceTouch',
  'Native',
  'Manual',
  'Race',
  'Simultaneous',
  'Exclusive',
]);

const gestureHandlerBuilderMethods = new Set([
  'onBegin',
  'onStart',
  'onEnd',
  'onFinalize',
  'onUpdate',
  'onChange',
  'onTouchesDown',
  'onTouchesMove',
  'onTouchesUp',
  'onTouchesCancelled',
]);

class ClosureGenerator {
  constructor() {
    this.trie = [{}, false];
  }

  mergeAns(oldAns, newAns) {
    const [purePath, node] = oldAns;
    const [purePathUp, nodeUp] = newAns;
    if (purePathUp.length !== 0) {
      return [purePath.concat(purePathUp), nodeUp];
    } else {
      return [purePath, node];
    }
  }

  findPrefixRec(path) {
    const notFound = [[], null];
    if (!path || path.node.type !== 'MemberExpression') {
      return notFound;
    }
    const memberExpressionNode = path.node;
    if (memberExpressionNode.property.type !== 'Identifier') {
      return notFound;
    }
    if (
      memberExpressionNode.computed ||
      memberExpressionNode.property.name === 'value' ||
      blacklistedFunctions.has(memberExpressionNode.property.name)
    ) {
      // a.b[w] -> a.b.w in babel nodes
      // a.v.value
      // sth.map(() => )
      return notFound;
    }
    if (
      path.parent &&
      path.parent.type === 'AssignmentExpression' &&
      path.parent.left === path.node
    ) {
      /// captured.newProp = 5;
      return notFound;
    }
    const purePath = [memberExpressionNode.property.name];
    const node = memberExpressionNode;
    const upAns = this.findPrefixRec(path.parentPath);
    return this.mergeAns([purePath, node], upAns);
  }

  findPrefix(base, babelPath) {
    const purePath = [base];
    const node = babelPath.node;
    const upAns = this.findPrefixRec(babelPath.parentPath);
    return this.mergeAns([purePath, node], upAns);
  }

  addPath(base, babelPath) {
    const [purePath, node] = this.findPrefix(base, babelPath);
    let parent = this.trie;
    let index = -1;
    for (const current of purePath) {
      index++;
      if (parent[1]) {
        continue;
      }
      if (!parent[0][current]) {
        parent[0][current] = [{}, false];
      }
      if (index === purePath.length - 1) {
        parent[0][current] = [node, true];
      }
      parent = parent[0][current];
    }
  }

  generateNodeForBase(t, current, parent) {
    const currentNode = parent[0][current];
    if (currentNode[1]) {
      return currentNode[0];
    }
    return t.objectExpression(
      Object.keys(currentNode[0]).map((propertyName) =>
        t.objectProperty(
          t.identifier(propertyName),
          this.generateNodeForBase(t, propertyName, currentNode),
          false,
          true
        )
      )
    );
  }

  generate(t, variables, names) {
    const arrayOfKeys = [...names];
    return t.objectExpression(
      variables.map((variable, index) =>
        t.objectProperty(
          t.identifier(variable.name),
          this.generateNodeForBase(t, arrayOfKeys[index], this.trie),
          false,
          true
        )
      )
    );
  }
}

function buildWorkletString(t, fun, closureVariables, name) {
  function prependClosureVariablesIfNecessary(closureVariables, body) {
    if (closureVariables.length === 0) {
      return body;
    }

    return t.blockStatement([
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.objectPattern(
            closureVariables.map((variable) =>
              t.objectProperty(
                t.identifier(variable.name),
                t.identifier(variable.name),
                false,
                true
              )
            )
          ),
          t.memberExpression(t.identifier('jsThis'), t.identifier('_closure'))
        ),
      ]),
      body,
    ]);
  }

  traverse(fun, {
    enter(path) {
      t.removeComments(path.node);
    },
  });

  const expression = fun.program.body.find(
    ({ type }) => type === 'ExpressionStatement'
  ).expression;

  const workletFunction = t.functionExpression(
    t.identifier(name),
    expression.params,
    prependClosureVariablesIfNecessary(closureVariables, expression.body)
  );

  return generate(workletFunction, { compact: true }).code;
}

function makeWorkletName(t, fun) {
  if (t.isObjectMethod(fun)) {
    return fun.node.key.name;
  }
  if (t.isFunctionDeclaration(fun)) {
    return fun.node.id.name;
  }
  if (t.isFunctionExpression(fun) && t.isIdentifier(fun.node.id)) {
    return fun.node.id.name;
  }
  return '_f'; // fallback for ArrowFunctionExpression and unnamed FunctionExpression
}

function makeWorklet(t, fun, state) {
  // Returns a new FunctionExpression which is a workletized version of provided
  // FunctionDeclaration, FunctionExpression, ArrowFunctionExpression or ObjectMethod.

  const functionName = makeWorkletName(t, fun);

  const closure = new Map();
  const outputs = new Set();
  const closureGenerator = new ClosureGenerator();
  const options = {};

  // remove 'worklet'; directive before calling .toString()
  fun.traverse({
    DirectiveLiteral(path) {
      if (path.node.value === 'worklet' && path.getFunctionParent() === fun) {
        path.parentPath.remove();
      }
    },
  });

  // We use copy because some of the plugins don't update bindings and
  // some even break them

  const code =
    '\n(' + (t.isObjectMethod(fun) ? 'function ' : '') + fun.toString() + '\n)';

  const transformed = transformSync(code, {
    filename: state.file.opts.filename,
    presets: ['@babel/preset-typescript'],
    plugins: [
      '@babel/plugin-transform-shorthand-properties',
      '@babel/plugin-transform-arrow-functions',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      ['@babel/plugin-transform-template-literals', { loose: true }],
    ],
    ast: true,
    babelrc: false,
    configFile: false,
  });
  if (
    fun.parent &&
    fun.parent.callee &&
    fun.parent.callee.name === 'useAnimatedStyle'
  ) {
    options.optFlags = isPossibleOptimization(transformed.ast);
  }
  traverse(transformed.ast, {
    ReferencedIdentifier(path) {
      const name = path.node.name;
      if (globals.has(name) || (fun.node.id && fun.node.id.name === name)) {
        return;
      }

      const parentNode = path.parent;

      if (
        parentNode.type === 'MemberExpression' &&
        parentNode.property === path.node &&
        !parentNode.computed
      ) {
        return;
      }

      if (
        parentNode.type === 'ObjectProperty' &&
        path.parentPath.parent.type === 'ObjectExpression' &&
        path.node !== parentNode.value
      ) {
        return;
      }

      let currentScope = path.scope;

      while (currentScope != null) {
        if (currentScope.bindings[name] != null) {
          return;
        }
        currentScope = currentScope.parent;
      }
      closure.set(name, path.node);
      closureGenerator.addPath(name, path);
    },
    AssignmentExpression(path) {
      // test for <something>.value = <something> expressions
      const left = path.node.left;
      if (
        t.isMemberExpression(left) &&
        t.isIdentifier(left.object) &&
        t.isIdentifier(left.property, { name: 'value' })
      ) {
        outputs.add(left.object.name);
      }
    },
  });

  const variables = Array.from(closure.values());

  const privateFunctionId = t.identifier('_f');
  const clone = t.cloneNode(fun.node);
  let funExpression;
  if (clone.body.type === 'BlockStatement') {
    funExpression = t.functionExpression(null, clone.params, clone.body);
  } else {
    funExpression = clone;
  }
  const funString = buildWorkletString(
    t,
    transformed.ast,
    variables,
    functionName
  );
  const workletHash = hash(funString);

  let location = state.file.opts.filename;
  if (state.opts && state.opts.relativeSourceLocation) {
    const path = require('path');
    location = path.relative(state.cwd, location);
  }

  const loc = fun && fun.node && fun.node.loc && fun.node.loc.start;
  if (loc) {
    const { line, column } = loc;
    if (typeof line === 'number' && typeof column === 'number') {
      location = `${location} (${line}:${column})`;
    }
  }

  const statements = [
    t.variableDeclaration('const', [
      t.variableDeclarator(privateFunctionId, funExpression),
    ]),
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(privateFunctionId, t.identifier('_closure'), false),
        closureGenerator.generate(t, variables, closure.keys())
      )
    ),
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(privateFunctionId, t.identifier('asString'), false),
        t.stringLiteral(funString)
      )
    ),
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(
          privateFunctionId,
          t.identifier('__workletHash'),
          false
        ),
        t.numericLiteral(workletHash)
      )
    ),
    t.expressionStatement(
      t.assignmentExpression(
        '=',
        t.memberExpression(
          privateFunctionId,
          t.identifier('__location'),
          false
        ),
        t.stringLiteral(location)
      )
    ),
  ];

  if (options && options.optFlags) {
    statements.push(
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(
            privateFunctionId,
            t.identifier('__optimalization'),
            false
          ),
          t.numericLiteral(options.optFlags)
        )
      )
    );
  }

  statements.push(t.returnStatement(privateFunctionId));

  const newFun = t.functionExpression(fun.id, [], t.blockStatement(statements));

  return newFun;
}

function processWorkletFunction(t, fun, state) {
  // Replaces FunctionDeclaration, FunctionExpression or ArrowFunctionExpression
  // with a workletized version of itself.

  if (!t.isFunctionParent(fun)) {
    return;
  }

  const newFun = makeWorklet(t, fun, state);

  const replacement = t.callExpression(newFun, []);

  // we check if function needs to be assigned to variable declaration.
  // This is needed if function definition directly in a scope. Some other ways
  // where function definition can be used is for example with variable declaration:
  // const ggg = function foo() { }
  // ^ in such a case we don't need to define variable for the function
  const needDeclaration =
    t.isScopable(fun.parent) || t.isExportNamedDeclaration(fun.parent);
  fun.replaceWith(
    fun.node.id && needDeclaration
      ? t.variableDeclaration('const', [
          t.variableDeclarator(fun.node.id, replacement),
        ])
      : replacement
  );
}

function processWorkletObjectMethod(t, path, state) {
  // Replaces ObjectMethod with a workletized version of itself.

  if (!t.isFunctionParent(path)) {
    return;
  }

  const newFun = makeWorklet(t, path, state);

  const replacement = t.objectProperty(
    t.identifier(path.node.key.name),
    t.callExpression(newFun, [])
  );

  path.replaceWith(replacement);
}

function processIfWorkletNode(t, fun, state) {
  fun.traverse({
    DirectiveLiteral(path) {
      const value = path.node.value;
      if (value === 'worklet' && path.getFunctionParent() === fun) {
        // make sure "worklet" is listed among directives for the fun
        // this is necessary as because of some bug, babel will attempt to
        // process replaced function if it is nested inside another function
        const directives = fun.node.body.directives;
        if (
          directives &&
          directives.length > 0 &&
          directives.some(
            (directive) =>
              t.isDirectiveLiteral(directive.value) &&
              directive.value.value === 'worklet'
          )
        ) {
          processWorkletFunction(t, fun, state);
        }
      }
    },
  });
}

function processIfGestureHandlerEventCallbackFunctionNode(t, fun, state) {
  // Auto-workletizes React Native Gesture Handler callback functions.
  // Detects `Gesture.Tap().onEnd(<fun>)` or similar, but skips `something.onEnd(<fun>)`.
  // Supports method chaining as well, e.g. `Gesture.Tap().onStart(<fun1>).onUpdate(<fun2>).onEnd(<fun3>)`.

  // Example #1: `Gesture.Tap().onEnd(<fun>)`
  /*
  CallExpression(
    callee: MemberExpression(
      object: CallExpression(
        callee: MemberExpression(
          object: Identifier('Gesture')
          property: Identifier('Tap')
        )
      )
      property: Identifier('onEnd')
    )
    arguments: [fun]
  )
  */

  // Example #2: `Gesture.Tap().onStart(<fun1>).onUpdate(<fun2>).onEnd(<fun3>)`
  /*
  CallExpression(
    callee: MemberExpression(
      object: CallExpression(
        callee: MemberExpression(
          object: CallExpression(
            callee: MemberExpression(
              object: CallExpression(
                callee: MemberExpression(
                  object: Identifier('Gesture')
                  property: Identifier('Tap')
                )
              )
              property: Identifier('onStart')
            )
            arguments: [fun1]
          )
          property: Identifier('onUpdate')
        )
        arguments: [fun2]
      )
      property: Identifier('onEnd')
    )
    arguments: [fun3]
  )
  */

  if (
    t.isCallExpression(fun.parent) &&
    isGestureObjectEventCallbackMethod(t, fun.parent.callee)
  ) {
    processWorkletFunction(t, fun, state);
  }
}

function isGestureObjectEventCallbackMethod(t, node) {
  // Checks if node matches the pattern `Gesture.Foo()[*].onBar`
  // where `[*]` represents any number of method calls.
  return (
    t.isMemberExpression(node) &&
    t.isIdentifier(node.property) &&
    gestureHandlerBuilderMethods.has(node.property.name) &&
    containsGestureObject(t, node.object)
  );
}

function containsGestureObject(t, node) {
  // Checks if node matches the pattern `Gesture.Foo()[*]`
  // where `[*]` represents any number of chained method calls, like `.something(42)`.

  // direct call
  if (isGestureObject(t, node)) {
    return true;
  }

  // method chaining
  if (
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    containsGestureObject(t, node.callee.object)
  ) {
    return true;
  }

  return false;
}

function isGestureObject(t, node) {
  // Checks if node matches `Gesture.Tap()` or similar.
  /*
  node: CallExpression(
    callee: MemberExpression(
      object: Identifier('Gesture')
      property: Identifier('Tap')
    )
  )
  */
  return (
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.object) &&
    node.callee.object.name === 'Gesture' &&
    t.isIdentifier(node.callee.property) &&
    gestureHandlerGestureObjects.has(node.callee.property.name)
  );
}

function processWorklets(t, path, state) {
  const callee =
    path.node.callee.type === 'SequenceExpression'
      ? path.node.callee.expressions[path.node.callee.expressions.length - 1]
      : path.node.callee;

  const name =
    callee.type === 'MemberExpression' ? callee.property.name : callee.name;

  if (
    objectHooks.has(name) &&
    path.get('arguments.0').type === 'ObjectExpression'
  ) {
    const properties = path.get('arguments.0.properties');
    for (const property of properties) {
      if (t.isObjectMethod(property)) {
        processWorkletObjectMethod(t, property, state);
      } else {
        const value = property.get('value');
        processWorkletFunction(t, value, state);
      }
    }
  } else {
    const indexes = functionArgsToWorkletize.get(name);
    if (Array.isArray(indexes)) {
      indexes.forEach((index) => {
        processWorkletFunction(t, path.get(`arguments.${index}`), state);
      });
    }
  }
}

const FUNCTIONLESS_FLAG = 0b00000001;
const STATEMENTLESS_FLAG = 0b00000010;

function isPossibleOptimization(fun) {
  let isFunctionCall = false;
  let isStatement = false;
  traverse(fun, {
    CallExpression(path) {
      if (!possibleOptFunction.has(path.node.callee.name)) {
        isFunctionCall = true;
      }
    },
    IfStatement() {
      isStatement = true;
    },
  });
  let flags = 0;
  if (!isFunctionCall) {
    flags = flags | FUNCTIONLESS_FLAG;
  }
  if (!isStatement) {
    flags = flags | STATEMENTLESS_FLAG;
  }
  return flags;
}

module.exports = function ({ types: t }) {
  return {
    pre() {
      // allows adding custom globals such as host-functions
      if (this.opts != null && Array.isArray(this.opts.globals)) {
        this.opts.globals.forEach((name) => {
          globals.add(name);
        });
      }
    },
    visitor: {
      CallExpression: {
        enter(path, state) {
          processWorklets(t, path, state);
        },
      },
      'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': {
        enter(path, state) {
          processIfWorkletNode(t, path, state);
          processIfGestureHandlerEventCallbackFunctionNode(t, path, state);
        },
      },
    },
  };
};
