// Copyright 2016-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXAppDefines.h>

@interface ABI49_0_0EXAppDefines (ABI49_0_0EXAppDefinesWithUnloader)

+ (void)_unload;

@end

@interface ABI49_0_0EXAppDefinesTest : XCTestCase

@end

@implementation ABI49_0_0EXAppDefinesTest

- (void)setUp
{
  // ABI49_0_0EXAppDefines expects to load just once.
  // To make it testable with difference test cases,
  // we call the internal private `_unload` method to reset state.
  [ABI49_0_0EXAppDefines performSelector:@selector(_unload)];
}

- (void)test_load
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(YES),
    @"APP_RCT_DEBUG": @(YES),
    @"APP_RCT_DEV": @(YES),
  };
  XCTAssertNoThrow([ABI49_0_0EXAppDefines load:defines]);
}

- (void)test_load_throwIfLoadedTwice
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(YES),
    @"APP_RCT_DEBUG": @(YES),
    @"APP_RCT_DEV": @(YES),
  };
  XCTAssertNoThrow([ABI49_0_0EXAppDefines load:defines]);
  XCTAssertThrows([ABI49_0_0EXAppDefines load:defines]);
}

- (void)test_loadAndGetAppDebug_shouldMatchDebugDefines
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(YES),
    @"APP_RCT_DEBUG": @(YES),
    @"APP_RCT_DEV": @(YES),
  };
  [ABI49_0_0EXAppDefines load:defines];
  XCTAssertEqual(ABI49_0_0EXAppDefines.APP_DEBUG, YES);
}

- (void)test_loadAndGetAppDebug_shouldMatchReleaseDefines
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(NO),
    @"APP_RCT_DEBUG": @(NO),
    @"APP_RCT_DEV": @(NO),
  };
  [ABI49_0_0EXAppDefines load:defines];
  XCTAssertEqual(ABI49_0_0EXAppDefines.APP_DEBUG, NO);
}

- (void)test_getters_returnsDefaultValues
{
  XCTAssertNoThrow([ABI49_0_0EXAppDefines load:@{}]);
  XCTAssertEqual(ABI49_0_0EXAppDefines.APP_DEBUG, NO);
  XCTAssertEqual(ABI49_0_0EXAppDefines.APP_RCT_DEBUG, NO);
  XCTAssertEqual(ABI49_0_0EXAppDefines.APP_RCT_DEV, NO);
  XCTAssertEqual(ABI49_0_0EXAppDefines.getAllDefines.count, 0u);
}

- (void)test_getAppDebug_throwIfNotLoaded
{
  XCTAssertThrows(ABI49_0_0EXAppDefines.APP_DEBUG);
}

- (void)test_passExtraDefines_shouldGetMatchedDefines
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(YES),
    @"APP_RCT_DEBUG": @(YES),
    @"APP_RCT_DEV": @(YES),
    @"foo": @1,
    @"bar": @2,
  };

  [ABI49_0_0EXAppDefines load:defines];
  NSDictionary *result = ABI49_0_0EXAppDefines.getAllDefines;
  XCTAssertEqual([result[@"foo"] intValue], 1);
  XCTAssertEqual([result[@"bar"] intValue], 2);
}

@end
