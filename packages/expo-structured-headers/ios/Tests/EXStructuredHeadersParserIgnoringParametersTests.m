//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <EXStructuredHeaders/EXStructuredHeadersParser.h>

@interface EXStructuredHeadersParserIgnoringParametersTests : XCTestCase

@end

@implementation EXStructuredHeadersParserIgnoringParametersTests

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
  [self runTestWithInput:input expectedValue:expected fieldType:EXStructuredHeadersParserFieldTypeDictionary];
}

- (void)testParameterizedList
{
  NSString *input = @"abc_123;a=1;b=2; cdef_456, ghi;q=9;r=\"+w\"";
  NSArray *expected = @[@"abc_123", @"ghi"];
  [self runTestWithInput:input expectedValue:expected fieldType:EXStructuredHeadersParserFieldTypeList];
}

- (void)testParameterizedInnerList
{
  NSString *input = @"(abc_123;a=1;b=2);cdef_456";
  NSArray *expected = @[@[@"abc_123"]];
  [self runTestWithInput:input expectedValue:expected fieldType:EXStructuredHeadersParserFieldTypeList];
}

- (void)testItem
{
  NSString *input = @"?0";
  NSNumber *expected = @(NO);
  [self runTestWithInput:input expectedValue:expected fieldType:EXStructuredHeadersParserFieldTypeItem];
}

- (void)runTestWithInput:(NSString *)input expectedValue:(id)expected fieldType:(EXStructuredHeadersParserFieldType)fieldType
{
  EXStructuredHeadersParser *parser = [[EXStructuredHeadersParser alloc] initWithRawInput:input fieldType:fieldType ignoringParameters:YES];
  NSError *error;
  id actual = [parser parseStructuredFieldsWithError:&error];
  XCTAssertNil(error);
  XCTAssertEqualObjects(expected, actual);
}

@end
