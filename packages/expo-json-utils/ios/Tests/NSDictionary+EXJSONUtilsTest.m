//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXJSONUtils/NSDictionary+EXJSONUtils.h>

@interface NSDictionaryEXManifestsManifestTest : XCTestCase

@property (nonatomic, strong) NSDictionary *testData;

@end

@implementation NSDictionaryEXManifestsManifestTest

- (void)setUp {
  _testData = @{
    @"string": @"hello",
    @"number": @2,
    @"dictionary": @{},
    @"array": @[],
  };
}

- (void)test_stringForKey {
  XCTAssertEqual([self.testData expo_stringForKey:@"string"], @"hello");
  XCTAssertThrows([self.testData expo_stringForKey:@"number"]);
  XCTAssertThrows([self.testData expo_stringForKey:@"nonexistent"]);
}

- (void)test_nullableStringForKey {
  XCTAssertEqual([self.testData expo_nullableStringForKey:@"string"], @"hello");
  XCTAssertNil([self.testData expo_nullableStringForKey:@"nonexistent"]);
  XCTAssertThrows([self.testData expo_nullableStringForKey:@"number"]);
}

- (void)test_numberForKey {
  XCTAssertEqual([self.testData expo_numberForKey:@"number"], @2);
  XCTAssertThrows([self.testData expo_numberForKey:@"string"]);
  XCTAssertThrows([self.testData expo_numberForKey:@"nonexistent"]);
}

- (void)test_nullableNumberForKey {
  XCTAssertEqual([self.testData expo_nullableNumberForKey:@"number"], @2);
  XCTAssertNil([self.testData expo_nullableNumberForKey:@"nonexistent"]);
  XCTAssertThrows([self.testData expo_nullableNumberForKey:@"string"]);
}

- (void)test_dictionaryForKey {
  XCTAssertEqual([self.testData expo_dictionaryForKey:@"dictionary"], @{});
  XCTAssertThrows([self.testData expo_dictionaryForKey:@"string"]);
  XCTAssertThrows([self.testData expo_dictionaryForKey:@"nonexistent"]);
}

- (void)test_nullableDictionaryForKey {
  XCTAssertEqual([self.testData expo_nullableDictionaryForKey:@"dictionary"], @{});
  XCTAssertNil([self.testData expo_nullableDictionaryForKey:@"nonexistent"]);
  XCTAssertThrows([self.testData expo_nullableDictionaryForKey:@"string"]);
}

- (void)arrayForKey {
  XCTAssertEqual([self.testData expo_arrayForKey:@"array"], @[]);
  XCTAssertThrows([self.testData expo_arrayForKey:@"string"]);
  XCTAssertThrows([self.testData expo_arrayForKey:@"nonexistent"]);
}

- (void)test_nullableArrayForKey {
  XCTAssertEqual([self.testData expo_nullableArrayForKey:@"array"], @[]);
  XCTAssertNil([self.testData expo_nullableArrayForKey:@"nonexistent"]);
  XCTAssertThrows([self.testData expo_nullableArrayForKey:@"string"]);
}

@end
