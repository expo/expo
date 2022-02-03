//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <ABI43_0_0EXStructuredHeaders/ABI43_0_0EXStructuredHeadersParser.h>

@interface ABI43_0_0EXStructuredHeadersParserIgnoringParametersTests : XCTestCase

@end

@implementation ABI43_0_0EXStructuredHeadersParserIgnoringParametersTests

- (void)setUp
{
  [super setUp];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testParameterizedDict
{
  NSString *input = @"abc=123;a=1;b=2, def=456, ghi=789;q=9;r=\"+w\"";
  NSDictionary *expected = @{
    @"abc": @(123),
    @"def": @(456),
    @"ghi": @(789)
  };
  [self runTestWithInput:input expectedValue:expected fieldType:ABI43_0_0EXStructuredHeadersParserFieldTypeDictionary];
}

- (void)testParameterizedList
{
  NSString *input = @"abc_123;a=1;b=2; cdef_456, ghi;q=9;r=\"+w\"";
  NSArray *expected = @[@"abc_123", @"ghi"];
  [self runTestWithInput:input expectedValue:expected fieldType:ABI43_0_0EXStructuredHeadersParserFieldTypeList];
}

- (void)testParameterizedInnerList
{
  NSString *input = @"(abc_123;a=1;b=2);cdef_456";
  NSArray *expected = @[@[@"abc_123"]];
  [self runTestWithInput:input expectedValue:expected fieldType:ABI43_0_0EXStructuredHeadersParserFieldTypeList];
}

- (void)testItem
{
  NSString *input = @"?0";
  NSNumber *expected = @(NO);
  [self runTestWithInput:input expectedValue:expected fieldType:ABI43_0_0EXStructuredHeadersParserFieldTypeItem];
}

- (void)runTestWithInput:(NSString *)input expectedValue:(id)expected fieldType:(ABI43_0_0EXStructuredHeadersParserFieldType)fieldType
{
  ABI43_0_0EXStructuredHeadersParser *parser = [[ABI43_0_0EXStructuredHeadersParser alloc] initWithRawInput:input fieldType:fieldType ignoringParameters:YES];
  NSError *error;
  id actual = [parser parseStructuredFieldsWithError:&error];
  XCTAssertNil(error);
  XCTAssertEqualObjects(expected, actual);
}

@end
