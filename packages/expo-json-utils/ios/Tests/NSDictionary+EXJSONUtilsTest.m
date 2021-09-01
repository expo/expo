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
  XCTAssertEqual([self.testData stringForKey:@"string"], @"hello");
  XCTAssertThrows([self.testData stringForKey:@"number"]);
  XCTAssertThrows([self.testData stringForKey:@"nonexistent"]);
}

- (void)test_nullableStringForKey {
  XCTAssertEqual([self.testData nullableStringForKey:@"string"], @"hello");
  XCTAssertNil([self.testData nullableStringForKey:@"nonexistent"]);
  XCTAssertThrows([self.testData nullableStringForKey:@"number"]);
}

- (void)test_numberForKey {
  XCTAssertEqual([self.testData numberForKey:@"number"], @2);
  XCTAssertThrows([self.testData numberForKey:@"string"]);
  XCTAssertThrows([self.testData numberForKey:@"nonexistent"]);
}

- (void)test_nullableNumberForKey {
  XCTAssertEqual([self.testData nullableNumberForKey:@"number"], @2);
  XCTAssertNil([self.testData nullableNumberForKey:@"nonexistent"]);
  XCTAssertThrows([self.testData nullableNumberForKey:@"string"]);
}

- (void)test_dictionaryForKey {
  XCTAssertEqual([self.testData dictionaryForKey:@"dictionary"], @{});
  XCTAssertThrows([self.testData dictionaryForKey:@"string"]);
  XCTAssertThrows([self.testData dictionaryForKey:@"nonexistent"]);
}

- (void)test_nullableDictionaryForKey {
  XCTAssertEqual([self.testData nullableDictionaryForKey:@"dictionary"], @{});
  XCTAssertNil([self.testData nullableDictionaryForKey:@"nonexistent"]);
  XCTAssertThrows([self.testData nullableDictionaryForKey:@"string"]);
}

- (void)arrayForKey {
  XCTAssertEqual([self.testData arrayForKey:@"array"], @[]);
  XCTAssertThrows([self.testData arrayForKey:@"string"]);
  XCTAssertThrows([self.testData arrayForKey:@"nonexistent"]);
}

- (void)test_nullableArrayForKey {
  XCTAssertEqual([self.testData nullableArrayForKey:@"array"], @[]);
  XCTAssertNil([self.testData nullableArrayForKey:@"nonexistent"]);
  XCTAssertThrows([self.testData nullableArrayForKey:@"string"]);
}

@end
