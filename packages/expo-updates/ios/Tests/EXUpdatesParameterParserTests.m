//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesParameterParser.h>

@interface EXUpdatesParameterParserTests : XCTestCase
@end

@implementation EXUpdatesParameterParserTests

- (void)testParameterParser
{
  NSArray<NSArray *> *testCases = @[
    @[@"", @{}],
    @[@"test; test1 =  stuff   ; test2 =  \"stuff; stuff\"; test3=\"stuff",
      @{@"test": [NSNull null], @"test1": @"stuff", @"test2": @"stuff; stuff", @"test3": @"\"stuff"}
    ],
    @[@"  test  ; test1=stuff   ;  ; test2=; test3; ",
      @{@"test": [NSNull null], @"test1": @"stuff", @"test2": [NSNull null], @"test3": [NSNull null]}
    ],
    @[@"  test", @{@"test": [NSNull null]}],
    @[@"  ", @{}],
    @[@" = stuff ", @{}],
    @[@"text/plain; Charset=UTF-8", @{@"text/plain": [NSNull null], @"Charset": @"UTF-8"}],
    @[@"param = \"stuff\\\"; more stuff\"", @{@"param": @"stuff\\\"; more stuff"}],
    @[@"param = \"stuff\\\\\"; anotherparam", @{@"param": @"stuff\\\\", @"anotherparam": [NSNull null]}],
    @[@"foo/bar; param=\"baz=bat\"", @{@"foo/bar": [NSNull null], @"param": @"baz=bat"}],
    
    // Expo-specific tests
    @[@"multipart/mixed; boundary=BbC04y", @{@"multipart/mixed": [NSNull null], @"boundary": @"BbC04y"}],
    @[@"form-data; name=\"manifest\"; filename=\"hello2\"", @{@"form-data": [NSNull null], @"name": @"manifest", @"filename": @"hello2"}],
  ];
  
  for (NSArray *testCase in testCases) {
    NSString *parameterString = testCase[0];
    NSDictionary *expectedDictionary = testCase[1];
    
    NSDictionary<NSString *, NSString *> *parameters = [[EXUpdatesParameterParser new] parseParameterString:parameterString withDelimiter:';'];
    XCTAssertTrue([expectedDictionary isEqualToDictionary:parameters], @"result did not match expected");
  }
}

@end
