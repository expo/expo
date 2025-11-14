import { it, expect } from '@jest/globals';
import * as fs from 'fs';

import { getFileTypeInformation } from '../src/typeInformation';
import {
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from '../src/typescriptGeneration';
import { generateTSMockForModule } from '../src/mockgen';

const swiftFile = fs.realpathSync('./tests/TestModule.swift');

it('Same type information', () => {
  expect(getFileTypeInformation(swiftFile)).toMatchSnapshot();
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

// const swiftTest = `import ExpoModulesCore
// import WebKit
// struct TestRecord2: Record {
//   @Field
//   var field1: Int
//   @Field
//   var field2: String
// }

// enum TestEnum {
//   case simpleCase
//   case multipleCases1, multipleCases2
//   case caseWithArgs1(Int, Double, String), caseWithArgs2(Double, String, Either<Int, String>)
// }
// `;
