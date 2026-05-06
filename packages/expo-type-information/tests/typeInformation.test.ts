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
  generateFullTsInterface,
  generateConciseTsInterface,
  generateModuleTypesFileContent,
  generateViewTypesFileContent,
} from '../src/typescriptGeneration';
import { GetFileTypeInformationOptions } from '../build';

const swiftFile = fs.realpathSync('./tests/TestModule.swift');
const defaultArgs: GetFileTypeInformationOptions = {
  input: { inputFileAbsolutePaths: [swiftFile], type: 'file' },
  typeInference: TypeInferenceOption.PREPROCESS_AND_INFERENCE,
};

let defaultArgsFileInfo: FileTypeInformation | null = null;
beforeAll(async () => {
  defaultArgsFileInfo = await getFileTypeInformation(defaultArgs);
});

it('Same type information', async () => {
  expect(
    serializeTypeInformation(
      (await getFileTypeInformation(defaultArgs)) ?? {
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
    expect(await generateViewTypesFileContent(fileInfo)).toMatchSnapshot();
  }
});

it('Same generated module file', async () => {
  const fileInfo = defaultArgsFileInfo;
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    expect(await generateModuleTypesFileContent(fileInfo)).toMatchSnapshot();
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

it('Same generated concise ts interface', async () => {
  const fileInfo = defaultArgsFileInfo;
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    const { volatileGeneratedFileContent, moduleTypescriptInterfaceFileContent } =
      await generateConciseTsInterface(fileInfo);
    expect(volatileGeneratedFileContent).toMatchSnapshot();
    expect(moduleTypescriptInterfaceFileContent).toMatchSnapshot();
  }
});

it('Same generated full ts interface', async () => {
  const fileInfo = defaultArgsFileInfo;
  expect(fileInfo).toBeTruthy();
  if (fileInfo) {
    const result = await generateFullTsInterface(fileInfo);
    expect(result).toMatchSnapshot();
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
    input: { type: 'file', inputFileAbsolutePaths: [swiftFile] },
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
    input: { type: 'file', inputFileAbsolutePaths: [swiftFile] },
    typeInference: TypeInferenceOption.SIMPLE_INFERENCE,
  });
  const fileInfoForString = await getFileTypeInformation({
    input: { type: 'string', fileContent: fs.readFileSync(swiftFile, 'utf8'), language: 'Swift' },
    typeInference: TypeInferenceOption.SIMPLE_INFERENCE,
  });
  expect(fileInfo).toEqual(fileInfoForString);
});
