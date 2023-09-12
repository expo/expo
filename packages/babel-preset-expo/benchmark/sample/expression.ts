/* eslint max-len: 0 */

// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

import {
  flowParseArrow,
  flowParseFunctionBodyAndFinish,
  flowParseMaybeAssign,
  flowParseSubscripts,
  flowParseTypeAnnotation,
  flowParseVariance,
  flowStartParseAsyncArrowFromCallExpression,
  flowStartParseObjPropValue,
} from '../plugins/flow';
import { jsxParseElement } from '../plugins/jsx';
import { typedParseConditional, typedParseParenItem } from '../plugins/types';
import {
  tsParseArrow,
  tsParseFunctionBodyAndFinish,
  tsParseMaybeAssign,
  tsParseSubscript,
  tsParseType,
  tsParseTypeAssertion,
  tsStartParseAsyncArrowFromCallExpression,
  tsStartParseNewArguments,
  tsStartParseObjPropValue,
} from '../plugins/typescript';
import {
  ContextualKeyword,
  eat,
  IdentifierRole,
  lookaheadType,
  match,
  next,
  nextTemplateToken,
  retokenizeSlashAsRegex,
  runInTypeContext,
} from '../tokenizer';
import { TokenType, TokenType as tt } from '../tokenizer/types';
import { getNextContextId, hasPlugin, raise, state } from './base';
import { parseMaybeDefault, parseRest, parseSpread } from './lval';
import {
  parseBlock,
  parseClass,
  parseDecorators,
  parseFunction,
  parseFunctionParams,
} from './statement';
import {
  canInsertSemicolon,
  eatContextual,
  expect,
  hasPrecedingLineBreak,
  isContextual,
  unexpected,
} from './util';

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function (s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initialization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).e
export function parseExpression(noIn?: boolean): void {
  parseMaybeAssign(noIn);
  if (match(tt.comma)) {
    while (eat(tt.comma)) {
      parseMaybeAssign(noIn);
    }
  }
}

export function parseMaybeAssign(noIn: boolean | null = null, afterLeftParse?: Function): boolean {
  if (isTypeScriptEnabled) {
    return tsParseMaybeAssign(noIn, afterLeftParse);
  } else if (isFlowEnabled) {
    return flowParseMaybeAssign(noIn, afterLeftParse);
  } else {
    return baseParseMaybeAssign(noIn, afterLeftParse);
  }
}

// Parse an assignment expression. This includes applications of
// operators like `+=`.
// Returns true if the expression was an arrow function.
export function baseParseMaybeAssign(
  noIn: boolean | null = null,
  afterLeftParse?: Function
): boolean {
  if (match(tt._yield)) {
    parseYield();
    if (afterLeftParse) {
      afterLeftParse();
    }
    return false;
  }

  if (match(tt.parenL) || match(tt.name) || match(tt._yield)) {
    state.potentialArrowAt = state.start;
  }

  const wasArrow = parseMaybeConditional(noIn);
  if (afterLeftParse) {
    afterLeftParse();
  }
  if (state.type & TokenType.IS_ASSIGN) {
    next();
    parseMaybeAssign(noIn);
    return false;
  }
  return wasArrow;
}

// Parse a ternary conditional (`?:`) operator.
// Returns true if the expression was an arrow function.
function parseMaybeConditional(noIn: boolean | null): boolean {
  const startPos = state.start;
  const wasArrow = parseExprOps(noIn);
  if (wasArrow) {
    return true;
  }
  parseConditional(noIn, startPos);
  return false;
}

function parseConditional(noIn: boolean | null, startPos: number): void {
  if (isTypeScriptEnabled || isFlowEnabled) {
    typedParseConditional(noIn, startPos);
  } else {
    baseParseConditional(noIn, startPos);
  }
}

export function baseParseConditional(noIn: boolean | null, startPos: number): void {
  if (eat(tt.question)) {
    parseMaybeAssign();
    expect(tt.colon);
    parseMaybeAssign(noIn);
  }
}

// Start the precedence parser.
// Returns true if this was an arrow function
function parseExprOps(noIn: boolean | null): boolean {
  const wasArrow = parseMaybeUnary();
  if (wasArrow) {
    return true;
  }
  parseExprOp(-1, noIn);
  return false;
}

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.
function parseExprOp(minPrec: number, noIn: boolean | null): void {
  if (
    isTypeScriptEnabled &&
    (tt._in & TokenType.PRECEDENCE_MASK) > minPrec &&
    !hasPrecedingLineBreak() &&
    eatContextual(ContextualKeyword._as)
  ) {
    state.tokens[state.tokens.length - 1].type = tt._as;
    runInTypeContext(1, () => {
      tsParseType();
    });
    parseExprOp(minPrec, noIn);
    return;
  }

  const prec = state.type & TokenType.PRECEDENCE_MASK;
  if (prec > 0 && (!noIn || !match(tt._in))) {
    if (prec > minPrec) {
      const op = state.type;
      next();

      if (op === tt.pipeline) {
        // Support syntax such as 10 |> x => x + 1
        state.potentialArrowAt = state.start;
      }

      parseMaybeUnary();
      parseExprOp(op & TokenType.IS_RIGHT_ASSOCIATIVE ? prec - 1 : prec, noIn);
      parseExprOp(minPrec, noIn);
    }
  }
}

// Parse unary operators, both prefix and postfix.
// Returns true if this was an arrow function.
export function parseMaybeUnary(): boolean {
  if (isTypeScriptEnabled && !isJSXEnabled && eat(tt.lessThan)) {
    tsParseTypeAssertion();
    return false;
  }

  if (state.type & TokenType.IS_PREFIX) {
    next();
    parseMaybeUnary();
    return false;
  }

  const wasArrow = parseExprSubscripts();
  if (wasArrow) {
    return true;
  }
  while (state.type & TokenType.IS_POSTFIX && !canInsertSemicolon()) {
    next();
  }
  return false;
}

// Parse call, dot, and `[]`-subscript expressions.
// Returns true if this was an arrow function.
export function parseExprSubscripts(): boolean {
  const startPos = state.start;
  const wasArrow = parseExprAtom();
  if (wasArrow) {
    return true;
  }
  parseSubscripts(startPos);
  return false;
}

function parseSubscripts(startPos: number, noCalls: boolean | null = null): void {
  if (isFlowEnabled) {
    flowParseSubscripts(startPos, noCalls);
  } else {
    baseParseSubscripts(startPos, noCalls);
  }
}

export function baseParseSubscripts(startPos: number, noCalls: boolean | null = null): void {
  const stopState = { stop: false };
  do {
    parseSubscript(startPos, noCalls, stopState);
  } while (!stopState.stop);
}

function parseSubscript(
  startPos: number,
  noCalls: boolean | null,
  stopState: { stop: boolean }
): void {
  if (isTypeScriptEnabled) {
    tsParseSubscript(startPos, noCalls, stopState);
  } else {
    baseParseSubscript(startPos, noCalls, stopState);
  }
}

/** Set 'state.stop = true' to indicate that we should stop parsing subscripts. */
export function baseParseSubscript(
  startPos: number,
  noCalls: boolean | null,
  stopState: { stop: boolean }
): void {
  if (!noCalls && eat(tt.doubleColon)) {
    parseNoCallExpr();
    stopState.stop = true;
    parseSubscripts(startPos, noCalls);
  } else if (match(tt.questionDot)) {
    if (noCalls && lookaheadType() === tt.parenL) {
      stopState.stop = true;
      return;
    }
    next();

    if (eat(tt.bracketL)) {
      parseExpression();
      expect(tt.bracketR);
    } else if (eat(tt.parenL)) {
      parseCallExpressionArguments(tt.parenR);
    } else {
      parseIdentifier();
    }
  } else if (eat(tt.dot)) {
    parseMaybePrivateName();
  } else if (eat(tt.bracketL)) {
    parseExpression();
    expect(tt.bracketR);
  } else if (!noCalls && match(tt.parenL)) {
    const possibleAsync = atPossibleAsync();
    // We see "async", but it's possible it's a usage of the name "async". Parse as if it's a
    // function call, and if we see an arrow later, backtrack and re-parse as a parameter list.
    const snapshotForAsyncArrow = possibleAsync ? state.snapshot() : null;
    const startTokenIndex = state.tokens.length;
    next();

    const callContextId = getNextContextId();

    state.tokens[state.tokens.length - 1].contextId = callContextId;
    parseCallExpressionArguments(tt.parenR);
    state.tokens[state.tokens.length - 1].contextId = callContextId;

    if (possibleAsync && shouldParseAsyncArrow()) {
      // We hit an arrow, so backtrack and start again parsing function parameters.
      state.restoreFromSnapshot(snapshotForAsyncArrow!);
      stopState.stop = true;

      parseFunctionParams();
      parseAsyncArrowFromCallExpression(startPos, startTokenIndex);
    }
  } else if (match(tt.backQuote)) {
    // Tagged template expression.
    parseTemplate();
  } else {
    stopState.stop = true;
  }
}

export function atPossibleAsync(): boolean {
  // This was made less strict than the original version to avoid passing around nodes, but it
  // should be safe to have rare false positives here.
  return (
    state.tokens[state.tokens.length - 1].contextualKeyword === ContextualKeyword._async &&
    !canInsertSemicolon()
  );
}

export function parseCallExpressionArguments(close: TokenType): void {
  let first = true;
  while (!eat(close)) {
    if (first) {
      first = false;
    } else {
      expect(tt.comma);
      if (eat(close)) break;
    }

    parseExprListItem(false);
  }
}

function shouldParseAsyncArrow(): boolean {
  return match(tt.colon) || match(tt.arrow);
}

function parseAsyncArrowFromCallExpression(functionStart: number, startTokenIndex: number): void {
  if (isTypeScriptEnabled) {
    tsStartParseAsyncArrowFromCallExpression();
  } else if (isFlowEnabled) {
    flowStartParseAsyncArrowFromCallExpression();
  }
  expect(tt.arrow);
  parseArrowExpression(functionStart, startTokenIndex);
}

// Parse a no-call expression (like argument of `new` or `::` operators).

function parseNoCallExpr(): void {
  const startPos = state.start;
  parseExprAtom();
  parseSubscripts(startPos, true);
}

// Parse an atomic expression — either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.
// Returns true if the parsed expression was an arrow function.
export function parseExprAtom(): boolean {
  if (match(tt.jsxText)) {
    parseLiteral();
    return false;
  } else if (match(tt.lessThan) && isJSXEnabled) {
    state.type = tt.jsxTagStart;
    jsxParseElement();
    next();
    return false;
  }

  const canBeArrow = state.potentialArrowAt === state.start;
  switch (state.type) {
    case tt.slash:
    case tt.assign:
      retokenizeSlashAsRegex();
    // Fall through.

    case tt._super:
    case tt._this:
    case tt.regexp:
    case tt.num:
    case tt.bigint:
    case tt.decimal:
    case tt.string:
    case tt._null:
    case tt._true:
    case tt._false:
      next();
      return false;

    case tt._import:
      if (lookaheadType() === tt.dot) {
        parseImportMetaProperty();
        return false;
      }
      next();
      return false;

    case tt.name: {
      const startTokenIndex = state.tokens.length;
      const functionStart = state.start;
      const contextualKeyword = state.contextualKeyword;
      parseIdentifier();
      if (contextualKeyword === ContextualKeyword._await) {
        parseAwait();
        return false;
      } else if (
        contextualKeyword === ContextualKeyword._async &&
        match(tt._function) &&
        !canInsertSemicolon()
      ) {
        next();
        parseFunction(functionStart, false, false);
        return false;
      } else if (canBeArrow && contextualKeyword === ContextualKeyword._async && match(tt.name)) {
        parseIdentifier();
        expect(tt.arrow);
        // let foo = bar => {};
        parseArrowExpression(functionStart, startTokenIndex);
        return true;
      }

      if (canBeArrow && !canInsertSemicolon() && eat(tt.arrow)) {
        parseArrowExpression(functionStart, startTokenIndex);
        return true;
      }

      state.tokens[state.tokens.length - 1].identifierRole = IdentifierRole.Access;
      return false;
    }

    case tt._do: {
      next();
      parseBlock(false);
      return false;
    }

    case tt.parenL: {
      const wasArrow = parseParenAndDistinguishExpression(canBeArrow);
      return wasArrow;
    }

    case tt.bracketL:
      next();
      parseExprList(tt.bracketR, true);
      return false;

    case tt.braceL:
      parseObj(false, false);
      return false;

    case tt._function:
      parseFunctionExpression();
      return false;

    case tt.at:
      parseDecorators();
    // Fall through.

    case tt._class:
      parseClass(false);
      return false;

    case tt._new:
      parseNew();
      return false;

    case tt.backQuote:
      parseTemplate();
      return false;

    case tt.doubleColon: {
      next();
      parseNoCallExpr();
      return false;
    }

    default:
      throw unexpected();
  }
}

function parseMaybePrivateName(): void {
  eat(tt.hash);
  parseIdentifier();
}

function parseFunctionExpression(): void {
  const functionStart = state.start;
  parseIdentifier();
  if (eat(tt.dot)) {
    // function.sent
    parseMetaProperty();
  }
  parseFunction(functionStart, false);
}

function parseMetaProperty(): void {
  parseIdentifier();
}

function parseImportMetaProperty(): void {
  parseIdentifier();
  expect(tt.dot);
  // import.meta
  parseMetaProperty();
}

export function parseLiteral(): void {
  next();
}

export function parseParenExpression(): void {
  expect(tt.parenL);
  parseExpression();
  expect(tt.parenR);
}

// Returns true if this was an arrow expression.
function parseParenAndDistinguishExpression(canBeArrow: boolean): boolean {
  // Assume this is a normal parenthesized expression, but if we see an arrow, we'll bail and
  // start over as a parameter list.
  const snapshot = state.snapshot();

  const startTokenIndex = state.tokens.length;
  expect(tt.parenL);

  const exprList = [];
  let first = true;
  let spreadStart;
  let optionalCommaStart;

  while (!match(tt.parenR)) {
    if (first) {
      first = false;
    } else {
      expect(tt.comma);
      if (match(tt.parenR)) {
        optionalCommaStart = state.start;
        break;
      }
    }

    if (match(tt.ellipsis)) {
      spreadStart = state.start;
      parseRest(false /* isBlockScope */);
      parseParenItem();

      if (match(tt.comma) && lookaheadType() === tt.parenR) {
        raise(state.start, 'A trailing comma is not permitted after the rest element');
      }

      break;
    } else {
      exprList.push(parseMaybeAssign(false, parseParenItem));
    }
  }

  expect(tt.parenR);

  if (canBeArrow && shouldParseArrow()) {
    const wasArrow = parseArrow();
    if (wasArrow) {
      // It was an arrow function this whole time, so start over and parse it as params so that we
      // get proper token annotations.
      state.restoreFromSnapshot(snapshot);
      // We don't need to worry about functionStart for arrow functions, so just use something.
      const functionStart = state.start;
      // Don't specify a context ID because arrow function don't need a context ID.
      parseFunctionParams();
      parseArrow();
      parseArrowExpression(functionStart, startTokenIndex);
      return true;
    }
  }

  if (optionalCommaStart) unexpected(optionalCommaStart);
  if (spreadStart) unexpected(spreadStart);
  return false;
}

function shouldParseArrow(): boolean {
  return match(tt.colon) || !canInsertSemicolon();
}

// Returns whether there was an arrow token.
export function parseArrow(): boolean {
  if (isTypeScriptEnabled) {
    return tsParseArrow();
  } else if (isFlowEnabled) {
    return flowParseArrow();
  } else {
    return eat(tt.arrow);
  }
}

function parseParenItem(): void {
  if (isTypeScriptEnabled || isFlowEnabled) {
    typedParseParenItem();
  }
}

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call — at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.
function parseNew(): void {
  expect(tt._new);
  if (eat(tt.dot)) {
    // new.target
    parseMetaProperty();
    return;
  }
  parseNoCallExpr();
  eat(tt.questionDot);
  parseNewArguments();
}

function parseNewArguments(): void {
  if (isTypeScriptEnabled) {
    tsStartParseNewArguments();
  }
  if (eat(tt.parenL)) {
    parseExprList(tt.parenR);
  }
}

function parseTemplate(): void {
  // Finish `, read quasi
  nextTemplateToken();
  // Finish quasi, read ${
  nextTemplateToken();
  while (!match(tt.backQuote)) {
    expect(tt.dollarBraceL);
    parseExpression();
    // Finish }, read quasi
    nextTemplateToken();
    // Finish quasi, read either ${ or `
    nextTemplateToken();
  }
  next();
}

// Parse an object literal or binding pattern.
export function parseObj(isPattern: boolean, isBlockScope: boolean): void {
  // Attach a context ID to the object open and close brace and each object key.
  const contextId = getNextContextId();
  let first = true;

  next();
  state.tokens[state.tokens.length - 1].contextId = contextId;

  let firstRestLocation = null;
  while (!eat(tt.braceR)) {
    if (first) {
      first = false;
    } else {
      expect(tt.comma);
      if (eat(tt.braceR)) {
        break;
      }
    }

    let isGenerator = false;
    if (match(tt.ellipsis)) {
      // Note that this is labeled as an access on the token even though it might be an
      // assignment.
      parseSpread();
      if (isPattern) {
        const position = state.start;
        if (firstRestLocation !== null) {
          unexpected(firstRestLocation, 'Cannot have multiple rest elements when destructuring');
        } else if (eat(tt.braceR)) {
          break;
        } else if (match(tt.comma) && lookaheadType() === tt.braceR) {
          unexpected(position, 'A trailing comma is not permitted after the rest element');
        } else {
          firstRestLocation = position;
          continue;
        }
      } else {
        continue;
      }
    }

    if (!isPattern) {
      isGenerator = eat(tt.star);
    }

    if (!isPattern && isContextual(ContextualKeyword._async)) {
      if (isGenerator) unexpected();

      parseIdentifier();
      if (
        match(tt.colon) ||
        match(tt.parenL) ||
        match(tt.braceR) ||
        match(tt.eq) ||
        match(tt.comma)
      ) {
        // This is a key called "async" rather than an async function.
      } else {
        if (match(tt.star)) {
          next();
          isGenerator = true;
        }
        parsePropertyName(contextId);
      }
    } else {
      parsePropertyName(contextId);
    }

    parseObjPropValue(isGenerator, isPattern, isBlockScope, contextId);
  }

  state.tokens[state.tokens.length - 1].contextId = contextId;
}

function isGetterOrSetterMethod(isPattern: boolean): boolean {
  // We go off of the next and don't bother checking if the node key is actually "get" or "set".
  // This lets us avoid generating a node, and should only make the validation worse.
  return (
    !isPattern &&
    (match(tt.string) || // get "string"() {}
      match(tt.num) || // get 1() {}
      match(tt.bracketL) || // get ["string"]() {}
      match(tt.name) || // get foo() {}
      !!(state.type & TokenType.IS_KEYWORD)) // get debugger() {}
  );
}

// Returns true if this was a method.
function parseObjectMethod(
  isGenerator: boolean,
  isPattern: boolean,
  objectContextId: number
): boolean {
  // We don't need to worry about modifiers because object methods can't have optional bodies, so
  // the start will never be used.
  const functionStart = state.start;
  if (match(tt.parenL)) {
    if (isPattern) unexpected();
    parseMethod(functionStart, isGenerator, /* isConstructor */ false);
    return true;
  }

  if (isGetterOrSetterMethod(isPattern)) {
    parsePropertyName(objectContextId);
    parseMethod(functionStart, /* isGenerator */ false, /* isConstructor */ false);
    return true;
  }
  return false;
}

function parseObjectProperty(isPattern: boolean, isBlockScope: boolean): void {
  if (eat(tt.colon)) {
    if (isPattern) {
      parseMaybeDefault(isBlockScope);
    } else {
      parseMaybeAssign(false);
    }
    return;
  }

  // Since there's no colon, we assume this is an object shorthand.

  // If we're in a destructuring, we've now discovered that the key was actually an assignee, so
  // we need to tag it as a declaration with the appropriate scope. Otherwise, we might need to
  // transform it on access, so mark it as an object shorthand.
  if (isPattern) {
    state.tokens[state.tokens.length - 1].identifierRole = isBlockScope
      ? IdentifierRole.BlockScopedDeclaration
      : IdentifierRole.FunctionScopedDeclaration;
  } else {
    state.tokens[state.tokens.length - 1].identifierRole = IdentifierRole.ObjectShorthand;
  }

  // Regardless of whether we know this to be a pattern or if we're in an ambiguous context, allow
  // parsing as if there's a default value.
  parseMaybeDefault(isBlockScope, true);
}

function parseObjPropValue(
  isGenerator: boolean,
  isPattern: boolean,
  isBlockScope: boolean,
  objectContextId: number
): void {
  if (isTypeScriptEnabled) {
    tsStartParseObjPropValue();
  } else if (isFlowEnabled) {
    flowStartParseObjPropValue();
  }
  const wasMethod = parseObjectMethod(isGenerator, isPattern, objectContextId);
  if (!wasMethod) {
    parseObjectProperty(isPattern, isBlockScope);
  }
}

export function parsePropertyName(objectContextId: number): void {
  if (isFlowEnabled) {
    flowParseVariance();
  }
  if (eat(tt.bracketL)) {
    state.tokens[state.tokens.length - 1].contextId = objectContextId;
    parseMaybeAssign();
    expect(tt.bracketR);
    state.tokens[state.tokens.length - 1].contextId = objectContextId;
  } else {
    if (match(tt.num) || match(tt.string)) {
      parseExprAtom();
    } else {
      parseMaybePrivateName();
    }

    state.tokens[state.tokens.length - 1].identifierRole = IdentifierRole.ObjectKey;
    state.tokens[state.tokens.length - 1].contextId = objectContextId;
  }
}

// Parse object or class method.
export function parseMethod(
  functionStart: number,
  isGenerator: boolean,
  isConstructor: boolean
): void {
  const funcContextId = getNextContextId();

  const startTokenIndex = state.tokens.length;
  const allowModifiers = isConstructor; // For TypeScript parameter properties
  parseFunctionParams(allowModifiers, funcContextId);
  parseFunctionBodyAndFinish(
    functionStart,
    isGenerator,
    null /* allowExpressionBody */,
    funcContextId
  );
  const endTokenIndex = state.tokens.length;
  state.scopes.push({ startTokenIndex, endTokenIndex, isFunctionScope: true });
}

// Parse arrow function expression.
// If the parameters are provided, they will be converted to an
// assignable list.
export function parseArrowExpression(functionStart: number, startTokenIndex: number): void {
  parseFunctionBody(functionStart, false /* isGenerator */, true);
  const endTokenIndex = state.tokens.length;
  state.scopes.push({ startTokenIndex, endTokenIndex, isFunctionScope: true });
}

export function parseFunctionBodyAndFinish(
  functionStart: number,
  isGenerator: boolean,
  allowExpressionBody: boolean | null = null,
  funcContextId?: number
): void {
  if (isTypeScriptEnabled) {
    tsParseFunctionBodyAndFinish(functionStart, isGenerator, allowExpressionBody, funcContextId);
  } else if (isFlowEnabled) {
    flowParseFunctionBodyAndFinish(functionStart, isGenerator, allowExpressionBody, funcContextId);
  } else {
    parseFunctionBody(functionStart, isGenerator, allowExpressionBody, funcContextId);
  }
}

// Parse function body and check parameters.
export function parseFunctionBody(
  functionStart: number,
  isGenerator: boolean,
  allowExpression: boolean | null,
  funcContextId?: number
): void {
  const isExpression = allowExpression && !match(tt.braceL);

  if (isExpression) {
    parseMaybeAssign();
  } else {
    parseBlock(true /* allowDirectives */, true /* isFunctionScope */, funcContextId);
  }
}

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

function parseExprList(close: TokenType, allowEmpty: boolean | null = null): void {
  let first = true;
  while (!eat(close)) {
    if (first) {
      first = false;
    } else {
      expect(tt.comma);
      if (eat(close)) break;
    }
    parseExprListItem(allowEmpty);
  }
}

function parseExprListItem(allowEmpty: boolean | null): void {
  if (allowEmpty && match(tt.comma)) {
    // Empty item; nothing more to parse for this item.
  } else if (match(tt.ellipsis)) {
    parseSpread();
  } else {
    parseMaybeAssign(false, parseParenItem);
  }
  if (isFlowEnabled && match(tt.colon)) {
    flowParseTypeAnnotation();
  }
}

// Parse the next token as an identifier.
export function parseIdentifier(): void {
  next();
  state.tokens[state.tokens.length - 1].type = tt.name;
}

// Parses await expression inside async function.
function parseAwait(): void {
  parseMaybeUnary();
}

// Parses yield expression inside generator.
function parseYield(): void {
  next();
  if (!match(tt.semi) && !canInsertSemicolon()) {
    eat(tt.star);
    parseMaybeAssign();
  }
}
