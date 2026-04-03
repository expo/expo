import { it, expect } from '@jest/globals';
import * as fs from 'fs';

import { generateTSMockForModule } from '../src/mockgen';
import {
  getFileTypeInformation,
  getFileTypeInformationForString,
  ModuleClassDeclaration,
  serializeTypeInformation,
} from '../src/typeInformation';
import {
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from '../src/typescriptGeneration';

const swiftFile = fs.realpathSync('./tests/TestModule.swift');

it('Same type information', async () => {
  expect(
    serializeTypeInformation(
      (await getFileTypeInformation(swiftFile)) ?? {
        usedTypeIdentifiers: new Set(),
        declaredTypeIdentifiers: new Set(),
        inferredTypeParametersCount: new Map(),
        typeIdentifierDefinitionMap: new Map(),
        moduleClasses: [],
        records: [],
        enums: [],
      }
    )
  ).toMatchSnapshot();
});
it('Same generated view file', async () => {
  const fileInfo = await getFileTypeInformation(swiftFile, true);
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(await getGeneratedViewTypesFileContent(swiftFile, fileInfo)).toMatchSnapshot();
  }
});
it('Same generated module file', async () => {
  const fileInfo = await getFileTypeInformation(swiftFile, true);
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(await getGeneratedModuleTypesFileContent(swiftFile, fileInfo)).toMatchSnapshot();
  }
});
it('Same generated mock file', async () => {
  const fileInfo = await getFileTypeInformation(swiftFile, true);
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(
      generateTSMockForModule(fileInfo.moduleClasses[0] as ModuleClassDeclaration, fileInfo, true)
    ).toMatchSnapshot();
  }
});
it('Same generated mock file JS', async () => {
  const fileInfo = await getFileTypeInformation(swiftFile, true);
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(
      generateTSMockForModule(fileInfo.moduleClasses[0] as ModuleClassDeclaration, fileInfo, false)
    ).toMatchSnapshot();
  }
});
it('Generation from string is the same as generation from file', async () => {
  const fileInfo = await getFileTypeInformation(swiftFile, true);
  const fileInfoForString = await getFileTypeInformationForString(
    fs.readFileSync(swiftFile, 'utf8'),
    'Swift',
    true
  );
  expect(fileInfo).toEqual(fileInfoForString);
});
it('Generation from string is the same as generation from file 2', async () => {
  const fileInfo = await getFileTypeInformation(swiftFile, false);
  const fileInfoForString = await getFileTypeInformationForString(
    fs.readFileSync(swiftFile, 'utf8'),
    'Swift',
    false
  );
  expect(fileInfo).toEqual(fileInfoForString);
});
