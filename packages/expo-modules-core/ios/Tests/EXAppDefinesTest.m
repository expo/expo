// Copyright 2016-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>
#import <ExpoModulesCore/EXAppDefines.h>

@interface EXAppDefines (EXAppDefinesWithUnloader)

+ (void)_unload;

@end

@interface EXAppDefinesTest : XCTestCase

@end

@implementation EXAppDefinesTest

- (void)setUp
{
  // EXAppDefines expects to load just once.
  // To make it testable with difference test cases,
  // we call the internal private `_unload` method to reset state.
  [EXAppDefines performSelector:@selector(_unload)];
}

- (void)test_load
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(YES),
    @"APP_RCT_DEBUG": @(YES),
    @"APP_RCT_DEV": @(YES),
  };
  XCTAssertNoThrow([EXAppDefines load:defines]);
}

- (void)test_load_throwIfLoadedTwice
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(YES),
    @"APP_RCT_DEBUG": @(YES),
    @"APP_RCT_DEV": @(YES),
  };
  XCTAssertNoThrow([EXAppDefines load:defines]);
  XCTAssertThrows([EXAppDefines load:defines]);
}

- (void)test_loadAndGetAppDebug_shouldMatchDebugDefines
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(YES),
    @"APP_RCT_DEBUG": @(YES),
    @"APP_RCT_DEV": @(YES),
  };
  [EXAppDefines load:defines];
  XCTAssertEqual(EXAppDefines.APP_DEBUG, YES);
}

- (void)test_loadAndGetAppDebug_shouldMatchReleaseDefines
{
  NSDictionary *defines = @{
    @"APP_DEBUG": @(NO),
    @"APP_RCT_DEBUG": @(NO),
    @"APP_RCT_DEV": @(NO),
  };
  [EXAppDefines load:defines];
  XCTAssertEqual(EXAppDefines.APP_DEBUG, NO);
}

- (void)test_getters_returnsDefaultValues
{
  XCTAssertNoThrow([EXAppDefines load:@{}]);
  XCTAssertEqual(EXAppDefines.APP_DEBUG, NO);
  XCTAssertEqual(EXAppDefines.APP_RCT_DEBUG, NO);
  XCTAssertEqual(EXAppDefines.APP_RCT_DEV, NO);
  XCTAssertEqual(EXAppDefines.getAllDefines.count, 0u);
}

- (void)test_getAppDebug_throwIfNotLoaded
{
  XCTAssertThrows(EXAppDefines.APP_DEBUG);
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

  [EXAppDefines load:defines];
  NSDictionary *result = EXAppDefines.getAllDefines;
  XCTAssertEqual([result[@"foo"] intValue], 1);
  XCTAssertEqual([result[@"bar"] intValue], 2);
}

@end
