import { it, expect } from '@jest/globals';
import * as fs from 'fs';

import { getFileTypeInformation } from '../src/typeInformation';

const swiftFile = './tests/TestModule.swift';

it('Same type information', () => {
  expect(getFileTypeInformation(fs.realpathSync(swiftFile))).toMatchSnapshot();
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
