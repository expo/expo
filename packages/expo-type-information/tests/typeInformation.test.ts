import { it, expect } from '@jest/globals';
import * as fs from 'fs';

import { generateTSMockForModule } from '../src/mockgen';
import {
  FileTypeInformation,
  getFileTypeInformation,
  ModuleClassDeclaration,
  serializeTypeInformation,
  TypeInferenceOption,
} from '../src/typeInformation';
import {
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from '../src/typescriptGeneration';
import { GetFileTypeInformationOptions } from '../build';

const swiftFile = fs.realpathSync('./tests/TestModule.swift');
const getDefaultArgs = (): GetFileTypeInformationOptions => {
  return {
    input: { inputFileAbsolutePath: swiftFile, type: 'file' },
    typeInference: TypeInferenceOption.PREPROCESS_AND_INFERENCE,
  };
};

let defaultArgsFileInfo: FileTypeInformation | null = null;
beforeAll(async () => {
  defaultArgsFileInfo = await getFileTypeInformation(getDefaultArgs());
});

it('Same type information', async () => {
  expect(
    serializeTypeInformation(
      (await getFileTypeInformation(getDefaultArgs())) ?? {
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
  const fileInfo = defaultArgsFileInfo;
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(await getGeneratedViewTypesFileContent(swiftFile, fileInfo)).toMatchSnapshot();
  }
});
it('Same generated module file', async () => {
  const fileInfo = defaultArgsFileInfo;
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(await getGeneratedModuleTypesFileContent(swiftFile, fileInfo)).toMatchSnapshot();
  }
});
it('Same generated mock file', async () => {
  const fileInfo = defaultArgsFileInfo;
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(
      generateTSMockForModule(fileInfo.moduleClasses[0] as ModuleClassDeclaration, fileInfo, true)
    ).toMatchSnapshot();
  }
});
it('Same generated mock file JS', async () => {
  const fileInfo = defaultArgsFileInfo;
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(
      generateTSMockForModule(fileInfo.moduleClasses[0] as ModuleClassDeclaration, fileInfo, false)
    ).toMatchSnapshot();
  }
});

it('Generation from string is the same as generation from file. Preprocessing.', async () => {
  const fileInfo = defaultArgsFileInfo;
  const fileInfoForString = await getFileTypeInformation({
    input: { type: 'string', fileContent: fs.readFileSync(swiftFile, 'utf8'), language: 'Swift' },
    typeInference: TypeInferenceOption.PREPROCESS_AND_INFERENCE,
  });
  expect(fileInfo).toEqual(fileInfoForString);
});

it('Generation from string is the same as generation from file. Simple type inference.', async () => {
  const fileInfo = await getFileTypeInformation({
    input: { type: 'file', inputFileAbsolutePath: swiftFile },
    typeInference: TypeInferenceOption.NO_INFERENCE,
  });
  const fileInfoForString = await getFileTypeInformation({
    input: { type: 'string', fileContent: fs.readFileSync(swiftFile, 'utf8'), language: 'Swift' },
    typeInference: TypeInferenceOption.NO_INFERENCE,
  });
  expect(fileInfo).toEqual(fileInfoForString);
});

it('Generation from string is the same as generation from file. No type inference.', async () => {
  const fileInfo = await getFileTypeInformation({
    input: { type: 'file', inputFileAbsolutePath: swiftFile },
    typeInference: TypeInferenceOption.SIMPLE_INFERENCE,
  });
  const fileInfoForString = await getFileTypeInformation({
    input: { type: 'string', fileContent: fs.readFileSync(swiftFile, 'utf8'), language: 'Swift' },
    typeInference: TypeInferenceOption.SIMPLE_INFERENCE,
  });
  expect(fileInfo).toEqual(fileInfoForString);
});
