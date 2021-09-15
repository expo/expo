//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXManifests/EXManifestsNewManifest.h>

@interface EXManifestsNewManifestTests : XCTestCase

@end

@implementation EXManifestsNewManifestTests

- (void)testSDKVersion_ValidCaseNumeric {
  NSString *runtimeVersion = @"exposdk:39.0.0";
  NSDictionary *manifestJson = @{
    @"runtimeVersion": runtimeVersion
  };
  EXManifestsNewManifest *manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJson];
  XCTAssert([manifest.sdkVersion isEqualToString:@"39.0.0"], @"%@", manifest.sdkVersion);
}

- (void)testSDKVersion_ValidCaseUnversioned {
  NSString *runtimeVersion = @"exposdk:UNVERSIONED";
  NSDictionary *manifestJson = @{
    @"runtimeVersion": runtimeVersion
  };
  EXManifestsNewManifest *manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJson];
  XCTAssert([manifest.sdkVersion isEqualToString:@"UNVERSIONED"], @"%@", manifest.sdkVersion);
}

- (void)testSDKVersion_NotSDKRuntimeVersionCases {
  NSArray *runtimeVersions = @[
    @"exposdk:123",
    @"exposdkd:39.0.0",
    @"exposdk:hello",
    @"bexposdk:39.0.0",
    @"exposdk:39.0.0-beta.0",
    @"exposdk:39.0.0-alpha.256"
  ];

  [runtimeVersions enumerateObjectsUsingBlock:^(NSString *  _Nonnull runtimeVersion, NSUInteger idx, BOOL * _Nonnull stop) {
    NSDictionary *manifestJson = @{
      @"runtimeVersion": runtimeVersion
    };
    EXManifestsNewManifest *manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJson];
    XCTAssert(manifest.sdkVersion == nil, @"%@", manifest.sdkVersion);
  }];
}

@end
