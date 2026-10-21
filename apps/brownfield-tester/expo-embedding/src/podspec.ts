import { readFile, realpath } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

type Token = {
  kind: 'name' | 'string' | 'number' | 'punctuation' | 'newline' | 'eof';
  value: string;
  line: number;
};
type Value = string | number | boolean | null | Value[] | { [key: string]: Value };
type Expression =
  | { kind: 'literal'; value: Value }
  | { kind: 'variable'; name: string }
  | { kind: 'array'; items: Expression[] }
  | { kind: 'hash'; entries: [string, Expression][] }
  | { kind: 'index'; receiver: Expression; key: Expression }
  | {
      kind: 'call';
      receiver: Expression;
      method: string;
      arguments: Expression[];
    };

export async function readPodspec(root: string, path: string): Promise<Record<string, any>> {
  const fail = (line: number, detail: string): never => {
    throw new Error(
      `${path}:${line}: Unsupported podspec syntax or expression: ${detail}. Use literal build declarations or Swift build metadata, then rerun init.`
    );
  };
  const input = await readFile(path, 'utf8');
  const tokens: Token[] = [];
  let line = 1;
  for (let offset = 0; offset < input.length; ) {
    const character = input[offset];
    if (character === '\n' || character === ';') {
      tokens.push({ kind: 'newline', value: '\n', line });
      if (character === '\n') line++;
      offset++;
      continue;
    }
    if (/\s/.test(character)) {
      offset++;
      continue;
    }
    if (character === '#') {
      while (offset < input.length && input[offset] !== '\n') offset++;
      continue;
    }
    if (character === "'" || character === '"') {
      const start = line;
      const quote = character;
      let value = '';
      offset++;
      while (offset < input.length && input[offset] !== quote) {
        const ch = input[offset++];
        if (ch === '\n') line++;
        if (quote === '"' && ch === '#' && ['{', '$', '@'].includes(input[offset]))
          fail(line, 'string interpolation');
        if (ch !== '\\') {
          value += ch;
          continue;
        }
        const escaped = input[offset++];
        if (escaped === quote || escaped === '\\') value += escaped;
        else if (quote === "'") value += '\\' + escaped;
        else if (Object.hasOwn({ n: 1, r: 1, t: 1 }, escaped))
          value += ({ n: '\n', r: '\r', t: '\t' } as Record<string, string>)[escaped];
        else fail(line, `escape \\${escaped}`);
      }
      if (input[offset] !== quote) fail(start, 'unterminated string');
      offset++;
      tokens.push({ kind: 'string', value, line: start });
      continue;
    }
    const name = input.slice(offset).match(/^[A-Za-z_][A-Za-z0-9_]*[!?]?/);
    if (name) {
      tokens.push({ kind: 'name', value: name[0], line });
      offset += name[0].length;
      continue;
    }
    const number = input.slice(offset).match(/^\d+(?:\.\d+)?/);
    if (number) {
      tokens.push({ kind: 'number', value: number[0], line });
      offset += number[0].length;
      continue;
    }
    const pair = input.slice(offset, offset + 2);
    if (['::', '=>'].includes(pair)) {
      tokens.push({ kind: 'punctuation', value: pair, line });
      offset += 2;
      continue;
    }
    if ('=.,:[]{}()|'.includes(character)) {
      tokens.push({ kind: 'punctuation', value: character, line });
      offset++;
      continue;
    }
    fail(line, `token ${character}`);
  }
  tokens.push({ kind: 'eof', value: '<eof>', line });
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const is = (value: string) => peek().value === value && peek().kind !== 'string';
  const expect = (value: string) => {
    if (!is(value)) fail(peek().line, `expected ${value}, found ${peek().value}`);
    return take();
  };
  const newlines = () => {
    while (peek().kind === 'newline') take();
  };
  const endStatement = () => {
    if (!['newline', 'eof'].includes(peek().kind))
      fail(peek().line, `unexpected ${peek().value} after declaration`);
    newlines();
  };
  const name = () => {
    const token = take();
    if (token.kind !== 'name') fail(token.line, `expected identifier, found ${token.value}`);
    return token.value;
  };
  const argumentsList = (closing?: string): Expression[] => {
    newlines();
    const args: Expression[] = [];
    if (closing && is(closing)) {
      take();
      return args;
    }
    args.push(expression());
    while (is(',')) {
      take();
      newlines();
      if (closing && is(closing)) break;
      args.push(expression());
    }
    if (closing) {
      newlines();
      expect(closing);
    }
    return args;
  };
  function expression(): Expression {
    newlines();
    const token = take();
    let result: Expression;
    if (token.kind === 'string') result = { kind: 'literal', value: token.value };
    else if (token.kind === 'number') result = { kind: 'literal', value: Number(token.value) };
    else if (token.kind === 'name') {
      if (['true', 'false', 'nil'].includes(token.value))
        result = {
          kind: 'literal',
          value: token.value === 'nil' ? null : token.value === 'true',
        };
      else result = { kind: 'variable', name: token.value };
    } else if (token.value === '[') result = { kind: 'array', items: argumentsList(']') };
    else if (token.value === ':') result = { kind: 'literal', value: name() };
    else if (token.value === '{') {
      const entries: [string, Expression][] = [];
      newlines();
      while (!is('}')) {
        let key: string;
        if (is(':')) {
          take();
          key = name();
          expect('=>');
        } else {
          const keyToken = take();
          if (!['name', 'string'].includes(keyToken.kind)) fail(keyToken.line, 'hash key');
          key = keyToken.value;
          expect(keyToken.kind === 'name' ? ':' : '=>');
        }
        if (entries.some((entry) => entry[0] === key))
          fail(peek().line, `duplicate hash key ${key}`);
        entries.push([key, expression()]);
        newlines();
        if (!is(',')) break;
        take();
        newlines();
      }
      expect('}');
      result = { kind: 'hash', entries };
    } else return fail(token.line, `expression ${token.value}`);
    while (is('.') || is('[')) {
      if (is('[')) {
        take();
        const key = expression();
        expect(']');
        result = { kind: 'index', receiver: result, key };
      } else {
        take();
        const method = name();
        let args: Expression[] = [];
        if (is('(')) {
          take();
          args = argumentsList(')');
        }
        result = { kind: 'call', receiver: result, method, arguments: args };
      }
    }
    return result;
  }
  const variables: Record<string, Value> = Object.create(null);
  async function evaluate(node: Expression, at: number): Promise<Value> {
    if (node.kind === 'literal') return node.value;
    if (node.kind === 'variable') {
      if (node.name === '__dir__') return dirname(path);
      if (Object.hasOwn(variables, node.name)) return variables[node.name];
      return fail(at, `variable ${node.name}`);
    }
    if (node.kind === 'array') return Promise.all(node.items.map((item) => evaluate(item, at)));
    if (node.kind === 'hash')
      return Object.fromEntries(
        await Promise.all(
          node.entries.map(async ([key, value]) => [key, await evaluate(value, at)])
        )
      );
    if (node.kind === 'index') {
      const receiver = await evaluate(node.receiver, at);
      const key = await evaluate(node.key, at);
      if (
        !receiver ||
        typeof receiver !== 'object' ||
        typeof key !== 'string' ||
        !Object.hasOwn(receiver, key)
      )
        return fail(at, `missing metadata key ${String(key)}`);
      return (receiver as Record<string, Value>)[key];
    }
    const args = await Promise.all(node.arguments.map((arg) => evaluate(arg, at)));
    const owner = node.receiver.kind === 'variable' ? node.receiver.name : '';
    if (
      owner === 'JSON' &&
      node.method === 'parse' &&
      args.length === 1 &&
      typeof args[0] === 'string'
    )
      return JSON.parse(args[0]);
    if (
      owner === 'File' &&
      ['join', 'expand_path'].includes(node.method) &&
      args.length &&
      args.every((arg) => typeof arg === 'string')
    ) {
      if (node.method === 'join') return join(...(args as string[]));
      if (args.length > 2) return fail(at, 'File.expand_path arguments');
      return resolve((args[1] as string) ?? dirname(path), args[0] as string);
    }
    if (
      owner === 'File' &&
      node.method === 'read' &&
      args.length === 1 &&
      typeof args[0] === 'string'
    ) {
      const candidate = resolve(dirname(path), args[0]);
      const allowed = join(await realpath(root), 'package.json');
      if (!candidate.endsWith('/package.json') || (await realpath(candidate)) !== allowed)
        return fail(at, 'only package.json in the installed package may be read');
      return readFile(candidate, 'utf8');
    }
    return fail(at, `call ${owner}.${node.method}`);
  }
  let spec: Record<string, any> | undefined;
  async function declarations(alias: string, attributes: Record<string, any>): Promise<void> {
    newlines();
    while (!is('end')) {
      const at = peek().line;
      if (name() !== alias)
        fail(at, 'only specification declarations are supported inside Pod::Spec.new');
      expect('.');
      const parts = [name()];
      while (is('.')) {
        take();
        parts.push(name());
      }
      let destination = attributes;
      if (parts.length === 2 && ['ios', 'tvos', 'osx', 'watchos', 'visionos'].includes(parts[0])) {
        destination = attributes[parts.shift()!] ??= Object.create(null);
      }
      if (parts.length !== 1) fail(at, 'specification attribute path');
      const method = parts[0];
      if (is('=')) {
        take();
        const values = await Promise.all(argumentsList().map((arg) => evaluate(arg, at)));
        destination[method] = values.length === 1 ? values[0] : values;
      } else if (method === 'dependency' || method === 'test_spec') {
        const parenthesized = is('(');
        if (parenthesized) take();
        const args = await Promise.all(
          argumentsList(parenthesized ? ')' : undefined).map((arg) => evaluate(arg, at))
        );
        if (args.some((arg) => typeof arg !== 'string')) fail(at, `${method} expects strings`);
        if (method === 'dependency') {
          const [dependency, ...requirements] = args as string[];
          (destination.dependencies ??= Object.create(null))[dependency] = requirements;
        } else {
          if (is('{')) {
            take();
            let depth = 1;
            while (depth && peek().kind !== 'eof') {
              const token = take();
              if (token.kind === 'punctuation' && token.value === '{') depth++;
              if (token.kind === 'punctuation' && token.value === '}') depth--;
            }
            if (depth) fail(at, 'unterminated test specification');
          } else {
            expect('do');
            let depth = 1;
            while (depth && peek().kind !== 'eof') {
              const token = take();
              if (
                token.kind === 'name' &&
                ['do', 'if', 'unless', 'case', 'begin', 'def', 'class', 'module'].includes(
                  token.value
                )
              )
                depth++;
              if (token.kind === 'name' && token.value === 'end') depth--;
            }
            if (depth) fail(at, 'unterminated test specification');
          }
        }
      } else fail(at, `specification method ${method}`);
      endStatement();
    }
    expect('end');
  }
  newlines();
  while (peek().kind !== 'eof') {
    const at = peek().line;
    const identifier = name();
    if (identifier === 'require') {
      const module = await evaluate(expression(), at);
      if (module !== 'json') fail(at, `require ${String(module)}`);
    } else if (identifier === 'Pod') {
      if (spec) fail(at, 'multiple specifications');
      expect('::');
      expect('Spec');
      expect('.');
      expect('new');
      expect('do');
      expect('|');
      const alias = name();
      expect('|');
      spec = Object.create(null);
      await declarations(alias, spec!);
    } else {
      expect('=');
      variables[identifier] = await evaluate(expression(), at);
    }
    endStatement();
  }
  if (!spec) fail(1, 'missing Pod::Spec.new declaration');
  return spec!;
}
