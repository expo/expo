import fs from 'fs';
import path from 'path';

type MessageDefinition = { template: string; code: string };

const interfaceRoot = path.resolve(__dirname, '../../../expo-updates-interface');
const swiftPath = path.join(interfaceRoot, 'ios/EXUpdatesInterface/UpdatesLogMessage.swift');
const kotlinPath = path.join(
  interfaceRoot,
  'android/src/main/java/expo/modules/updatesinterface/UpdatesLogMessage.kt'
);
const typesPath = path.resolve(__dirname, '../Updates.types.ts');

function readSwiftMessages(): Record<string, MessageDefinition> {
  const source = fs.readFileSync(swiftPath, 'utf8');
  const keysByCase = new Map<string, string>();
  for (const [, caseName = '', key = ''] of source.matchAll(/^ {2}case (\w+) = "([^"]+)"$/gm)) {
    keysByCase.set(caseName, key);
  }
  const messages: Record<string, MessageDefinition> = {};
  const definitionPattern =
    /^ {4}case \.(\w+):\n(?: {6}\/\/ swiftlint:disable:next \w+\n)? {6}return \("(.*)", \.(\w+)\)$/gm;
  for (const [, caseName = '', template = '', code = ''] of source.matchAll(definitionPattern)) {
    const key = keysByCase.get(caseName);
    if (!key) {
      throw new Error(`UpdatesLogMessage.swift defines .${caseName}, which has no key`);
    }
    messages[key] = { template, code: code.toLowerCase() };
  }
  if (Object.keys(messages).length !== keysByCase.size) {
    throw new Error('UpdatesLogMessage.swift has a case with no template and code');
  }
  return messages;
}

function readKotlinMessages(): Record<string, MessageDefinition> {
  const source = fs.readFileSync(kotlinPath, 'utf8');
  const messages: Record<string, MessageDefinition> = {};
  const entryPattern =
    /^ {2}\w+\(\n {4}"([^"]+)",\n {4}"(.*)",\n {4}UpdatesErrorCode\.(\w+)\n {2}\),?$/gm;
  for (const [, key = '', template = '', code = ''] of source.matchAll(entryPattern)) {
    messages[key] = { template, code: code.toLowerCase() };
  }
  return messages;
}

function readTypeScriptMessages(): Record<string, MessageDefinition> {
  const source = fs.readFileSync(typesPath, 'utf8');
  const body = source.match(/export enum UpdatesLogMessageKey \{\n([\s\S]+?)\n\}\n/)?.[1] ?? '';
  const messages: Record<string, MessageDefinition> = {};
  const memberPattern =
    /^ {2}\/\*\*\n {3}\* Message: `(.*)`\n {3}\*\n {3}\* Code: `(\w+)`\n {3}\*\/\n {2}[A-Z_]+ = '([^']+)',$/gm;
  for (const [, template = '', code = '', key = ''] of body.matchAll(memberPattern)) {
    messages[key] = { template, code: code.toLowerCase() };
  }
  const memberCount = [...body.matchAll(/^ {2}[A-Z_]+ = /gm)].length;
  if (Object.keys(messages).length !== memberCount) {
    throw new Error('UpdatesLogMessageKey has a member without a Message and Code comment');
  }
  return messages;
}

describe('UpdatesLogMessage', () => {
  test('iOS and Android define the same keys, templates and codes', () => {
    const swiftMessages = readSwiftMessages();
    expect(Object.keys(swiftMessages).length).toBeGreaterThan(0);
    expect(readKotlinMessages()).toEqual(swiftMessages);
  });

  test('UpdatesLogMessageKey documents the native keys, templates and codes', () => {
    expect(readTypeScriptMessages()).toEqual(readSwiftMessages());
  });

  test('keys are dotted area and event names', () => {
    for (const key of Object.keys(readSwiftMessages())) {
      expect(key).toMatch(/^[a-z][A-Za-z]*\.[a-z][A-Za-z]*$/);
    }
  });
});
