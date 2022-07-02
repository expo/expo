//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsNewManifest.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesNewUpdate.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesBuildData+Tests.h>

@interface ABI44_0_0EXUpdatesBuildDataTests : XCTestCase

@property (nonatomic, strong) ABI44_0_0EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;
@property (nonatomic, strong) ABI44_0_0EXManifestsNewManifest *manifest;
@property (nonatomic, strong) NSDictionary *configChannelTestDictionary;
@property (nonatomic, strong) ABI44_0_0EXUpdatesConfig *configChannelTest;
@property (nonatomic, strong) NSDictionary *configChannelTestTwoDictionary;
@property (nonatomic, strong) ABI44_0_0EXUpdatesConfig *configChannelTestTwo;
@property (nonatomic, strong) NSDictionary *configReleaseChannelTestDictionary;
@property (nonatomic, strong) ABI44_0_0EXUpdatesConfig *configReleaseChannelTest;
@property (nonatomic, strong) NSDictionary *configReleaseChannelTestTwoDictionary;
@property (nonatomic, strong) ABI44_0_0EXUpdatesConfig *configReleaseChannelTestTwo;
@end

static NSString * const scopeKey = @"test";


@implementation ABI44_0_0EXUpdatesBuildDataTests

- (void)setUp {
  NSURL *applicationSupportDir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].lastObject;
  _testDatabaseDir = [applicationSupportDir URLByAppendingPathComponent:@"ABI44_0_0EXUpdatesDatabaseTests"];
  if (![NSFileManager.defaultManager fileExistsAtPath:_testDatabaseDir.path]) {
    NSError *error;
    [NSFileManager.defaultManager createDirectoryAtPath:_testDatabaseDir.path withIntermediateDirectories:YES attributes:nil error:&error];
    XCTAssertNil(error);
  }
  
  _db = [[ABI44_0_0EXUpdatesDatabase alloc] init];
  dispatch_sync(_db.databaseQueue, ^{
    NSError *dbOpenError;
    [_db openDatabaseInDirectory:_testDatabaseDir withError:&dbOpenError];
    XCTAssertNil(dbOpenError);
  });
  
  _manifest = [[ABI44_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  
  
  _configChannelTestDictionary = @{
    ABI44_0_0EXUpdatesConfigScopeKeyKey: scopeKey,
    ABI44_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI44_0_0EXUpdatesConfigRequestHeadersKey: @{@"expo-channel-name":@"test"}
  };
  _configChannelTest = [ABI44_0_0EXUpdatesConfig configWithDictionary:_configChannelTestDictionary];
  _configChannelTestTwoDictionary = @{
    ABI44_0_0EXUpdatesConfigScopeKeyKey: scopeKey,
    ABI44_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI44_0_0EXUpdatesConfigRequestHeadersKey: @{@"expo-channel-name":@"testTwo"}
  };
  _configChannelTestTwo = [ABI44_0_0EXUpdatesConfig configWithDictionary:_configChannelTestTwoDictionary
  ];
  
  _configReleaseChannelTestDictionary = @{
    ABI44_0_0EXUpdatesConfigScopeKeyKey: scopeKey,
    ABI44_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI44_0_0EXUpdatesConfigReleaseChannelKey: @"test",
  };
  _configReleaseChannelTest = [ABI44_0_0EXUpdatesConfig configWithDictionary:_configReleaseChannelTestDictionary];
  _configReleaseChannelTestTwoDictionary = @{
    ABI44_0_0EXUpdatesConfigScopeKeyKey: scopeKey,
    ABI44_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI44_0_0EXUpdatesConfigReleaseChannelKey: @"testTwo",
  };
  _configReleaseChannelTestTwo = [ABI44_0_0EXUpdatesConfig configWithDictionary:_configReleaseChannelTestTwoDictionary
  ];
  
  ABI44_0_0EXUpdatesManifestHeaders *manifestHeaders = [[ABI44_0_0EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  
  // start every test with an update
  dispatch_sync(_db.databaseQueue, ^{
    ABI44_0_0EXUpdatesUpdate *update = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest
                                                        manifestHeaders:manifestHeaders
                                                             extensions:@{}
                                                                 config:_configChannelTest
                                                               database:_db];

    NSError *updatesError;
    [_db addUpdate:update error:&updatesError];
    if (updatesError) {
      XCTFail(@"%@", updatesError.localizedDescription);
      return;
    }
  });
}

- (void)tearDown
{
  dispatch_sync(_db.databaseQueue, ^{
    [_db closeDatabase];
  });
  NSError *error;
  [NSFileManager.defaultManager removeItemAtPath:_testDatabaseDir.path error:&error];
  XCTAssertNil(error);
}

- (void)test_clearAllUpdatesFromDatabase {
  dispatch_sync(_db.databaseQueue, ^{
    NSError *queryError;
    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&queryError];
    if (queryError) {
      XCTFail(@"%@", queryError.localizedDescription);
      return;
    }
    
    XCTAssertGreaterThan(allUpdates.count, 0);
  });
  
  dispatch_async(_db.databaseQueue, ^{
    [ABI44_0_0EXUpdatesBuildData clearAllUpdatesAndSetStaticBuildData:self->_db config:self->_configChannelTest];
  });

  dispatch_sync(_db.databaseQueue, ^{
    NSError *queryError;
    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdatesAfter = [_db allUpdatesWithConfig:_configChannelTest error:&queryError];
    if (queryError) {
      XCTFail(@"%@", queryError.localizedDescription);
      return;
    }
    
    XCTAssertEqual(allUpdatesAfter.count, 0);
  });
}

// check no updates are cleared and build data is set
- (void)test_ensureBuildDataIsConsistent_buildDataIsNull {
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:&error];
    XCTAssertNil(staticBuildData);

    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  });
  
  [ABI44_0_0EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configChannelTest];


  
  dispatch_sync(_db.databaseQueue, ^{
      NSError *error;
      NSDictionary *newStaticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:&error];
      XCTAssertNotNil(newStaticBuildData);
      XCTAssertNil(error);
    
      NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
      XCTAssertEqual(allUpdates.count, 1);
      XCTAssertNil(error);
  });

}

// check no updates are cleared and build data is not set
- (void)test_ensureBuildDataIsConsistent_buildDataIsConsistent_channel {

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  
    [_db setStaticBuildData:[ABI44_0_0EXUpdatesBuildData getBuildDataFromConfig:_configChannelTest] withScopeKey:_configChannelTest.scopeKey error:nil];

  });

  [ABI44_0_0EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configChannelTest];


  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:nil];


    XCTAssertTrue([staticBuildData isEqualToDictionary:[ABI44_0_0EXUpdatesBuildData getBuildDataFromConfig:_configChannelTest]]);
    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:nil];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  });
}
 
- (void)test_ensureBuildDataIsConsistent_buildDataIsConsistent_releaseChannel {
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configReleaseChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  
    [_db setStaticBuildData:[ABI44_0_0EXUpdatesBuildData getBuildDataFromConfig:_configReleaseChannelTest] withScopeKey:_configReleaseChannelTest.scopeKey error:nil];

  });

  [ABI44_0_0EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configReleaseChannelTest];


  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:nil];


    XCTAssertTrue([staticBuildData isEqualToDictionary:[ABI44_0_0EXUpdatesBuildData getBuildDataFromConfig:_configReleaseChannelTest]]);
    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configReleaseChannelTest error:nil];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  });
}

// check updates are cleared and build data is set
- (void)test_ensureBuildDataIsConsistent_buildDataIsInconsistent_channel {
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
    
    [_db setStaticBuildData:[ABI44_0_0EXUpdatesBuildData getBuildDataFromConfig:_configChannelTest] withScopeKey:_configChannelTest.scopeKey error:nil];
  });
  
  [ABI44_0_0EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configChannelTestTwo];
  
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:&error];
    XCTAssertTrue([staticBuildData isEqualToDictionary:[ABI44_0_0EXUpdatesBuildData getBuildDataFromConfig:_configChannelTestTwo]]);
    XCTAssertNil(error);

    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTestTwo error:&error];
    XCTAssertEqual(allUpdates.count, 0);
  });
}

- (void)test_ensureBuildDataIsConsistent_buildDataIsInconsistent_releaseChannel {
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configReleaseChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
    
    [_db setStaticBuildData:[ABI44_0_0EXUpdatesBuildData getBuildDataFromConfig:_configReleaseChannelTest] withScopeKey:_configReleaseChannelTest.scopeKey error:nil];
  });
  
  [ABI44_0_0EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configReleaseChannelTestTwo];
  
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:&error];
    XCTAssertTrue([staticBuildData isEqualToDictionary:[ABI44_0_0EXUpdatesBuildData getBuildDataFromConfig:_configReleaseChannelTestTwo]]);
    XCTAssertNil(error);

    NSArray<ABI44_0_0EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configReleaseChannelTestTwo error:&error];
    XCTAssertEqual(allUpdates.count, 0);
  });
}

@end
