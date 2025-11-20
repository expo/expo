import { it, expect } from '@jest/globals';
import * as fs from 'fs';

import { generateTSMockForModule } from '../src/mockgen';
import {
  getFileTypeInformation,
  getFileTypeInformationForString,
  serializeTypeInformation,
} from '../src/typeInformation';
import {
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from '../src/typescriptGeneration';

const swiftFile = fs.realpathSync('./tests/TestModule.swift');

it('Same type information', () => {
  expect(
    serializeTypeInformation(
      getFileTypeInformation(swiftFile) ?? {
        usedTypeIdentifiers: new Set(),
        declaredTypeIdentifiers: new Set(),
        typeParametersCount: new Map(),
        typeIdentifierDefinitionMap: new Map(),
        functions: [],
        moduleClasses: [],
        records: [],
        enums: [],
      }
    )
  ).toMatchSnapshot();
});
it('Same generated view file', async () => {
  const fileInfo = getFileTypeInformation(swiftFile);
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(await getGeneratedViewTypesFileContent(swiftFile, fileInfo)).toMatchSnapshot();
  }
});
it('Same generated module file', async () => {
  const fileInfo = getFileTypeInformation(swiftFile);
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(await getGeneratedModuleTypesFileContent(swiftFile, fileInfo)).toMatchSnapshot();
  }
});
it('Same generated mock file', async () => {
  const fileInfo = getFileTypeInformation(swiftFile);
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(generateTSMockForModule(fileInfo.moduleClasses[0], fileInfo, true)).toMatchSnapshot();
  }
});
it('Same generated mock file JS', async () => {
  const fileInfo = getFileTypeInformation(swiftFile);
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(generateTSMockForModule(fileInfo.moduleClasses[0], fileInfo, false)).toMatchSnapshot();
  }
});
it('Generation from string is the same as generation from file', async () => {
  const fileInfo = getFileTypeInformation(swiftFile);
  const fileInfoForString = getFileTypeInformationForString(
    fs.readFileSync(swiftFile, 'utf8'),
    'swift'
  );
  expect(fileInfo).toEqual(fileInfoForString);
});
