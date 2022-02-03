//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXManifests/EXManifestsNewManifest.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesBuildData+Tests.h>

@interface EXUpdatesBuildDataTests : XCTestCase

@property (nonatomic, strong) EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;
@property (nonatomic, strong) EXManifestsNewManifest *manifest;
@property (nonatomic, strong) NSDictionary *configChannelTestDictionary;
@property (nonatomic, strong) EXUpdatesConfig *configChannelTest;
@property (nonatomic, strong) NSDictionary *configChannelTestTwoDictionary;
@property (nonatomic, strong) EXUpdatesConfig *configChannelTestTwo;
@property (nonatomic, strong) NSDictionary *configReleaseChannelTestDictionary;
@property (nonatomic, strong) EXUpdatesConfig *configReleaseChannelTest;
@property (nonatomic, strong) NSDictionary *configReleaseChannelTestTwoDictionary;
@property (nonatomic, strong) EXUpdatesConfig *configReleaseChannelTestTwo;
@end

static NSString * const scopeKey = @"test";


@implementation EXUpdatesBuildDataTests

- (void)setUp {
  NSURL *applicationSupportDir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].lastObject;
  _testDatabaseDir = [applicationSupportDir URLByAppendingPathComponent:@"EXUpdatesDatabaseTests"];
  if (![NSFileManager.defaultManager fileExistsAtPath:_testDatabaseDir.path]) {
    NSError *error;
    [NSFileManager.defaultManager createDirectoryAtPath:_testDatabaseDir.path withIntermediateDirectories:YES attributes:nil error:&error];
    XCTAssertNil(error);
  }
  
  _db = [[EXUpdatesDatabase alloc] init];
  dispatch_sync(_db.databaseQueue, ^{
    NSError *dbOpenError;
    [_db openDatabaseInDirectory:_testDatabaseDir withError:&dbOpenError];
    XCTAssertNil(dbOpenError);
  });
  
  _manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  
  
  _configChannelTestDictionary = @{
    EXUpdatesConfigScopeKeyKey: scopeKey,
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigRequestHeadersKey: @{@"expo-channel-name":@"test"}
  };
  _configChannelTest = [EXUpdatesConfig configWithDictionary:_configChannelTestDictionary];
  _configChannelTestTwoDictionary = @{
    EXUpdatesConfigScopeKeyKey: scopeKey,
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigRequestHeadersKey: @{@"expo-channel-name":@"testTwo"}
  };
  _configChannelTestTwo = [EXUpdatesConfig configWithDictionary:_configChannelTestTwoDictionary
  ];
  
  _configReleaseChannelTestDictionary = @{
    EXUpdatesConfigScopeKeyKey: scopeKey,
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigReleaseChannelKey: @"test",
  };
  _configReleaseChannelTest = [EXUpdatesConfig configWithDictionary:_configReleaseChannelTestDictionary];
  _configReleaseChannelTestTwoDictionary = @{
    EXUpdatesConfigScopeKeyKey: scopeKey,
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    EXUpdatesConfigReleaseChannelKey: @"testTwo",
  };
  _configReleaseChannelTestTwo = [EXUpdatesConfig configWithDictionary:_configReleaseChannelTestTwoDictionary
  ];
  
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  
  // start every test with an update
  dispatch_sync(_db.databaseQueue, ^{
    EXUpdatesUpdate *update = [EXUpdatesNewUpdate updateWithNewManifest:_manifest
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
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&queryError];
    if (queryError) {
      XCTFail(@"%@", queryError.localizedDescription);
      return;
    }
    
    XCTAssertGreaterThan(allUpdates.count, 0);
  });
  
  dispatch_async(_db.databaseQueue, ^{
    [EXUpdatesBuildData clearAllUpdatesAndSetStaticBuildData:self->_db config:self->_configChannelTest];
  });

  dispatch_sync(_db.databaseQueue, ^{
    NSError *queryError;
    NSArray<EXUpdatesUpdate *> *allUpdatesAfter = [_db allUpdatesWithConfig:_configChannelTest error:&queryError];
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

    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  });
  
  [EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configChannelTest];


  
  dispatch_sync(_db.databaseQueue, ^{
      NSError *error;
      NSDictionary *newStaticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:&error];
      XCTAssertNotNil(newStaticBuildData);
      XCTAssertNil(error);
    
      NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
      XCTAssertEqual(allUpdates.count, 1);
      XCTAssertNil(error);
  });

}

// check no updates are cleared and build data is not set
- (void)test_ensureBuildDataIsConsistent_buildDataIsConsistent_channel {

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  
    [_db setStaticBuildData:[EXUpdatesBuildData getBuildDataFromConfig:_configChannelTest] withScopeKey:_configChannelTest.scopeKey error:nil];

  });

  [EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configChannelTest];


  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:nil];


    XCTAssertTrue([staticBuildData isEqualToDictionary:[EXUpdatesBuildData getBuildDataFromConfig:_configChannelTest]]);
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:nil];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  });
}
 
- (void)test_ensureBuildDataIsConsistent_buildDataIsConsistent_releaseChannel {
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configReleaseChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  
    [_db setStaticBuildData:[EXUpdatesBuildData getBuildDataFromConfig:_configReleaseChannelTest] withScopeKey:_configReleaseChannelTest.scopeKey error:nil];

  });

  [EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configReleaseChannelTest];


  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:nil];


    XCTAssertTrue([staticBuildData isEqualToDictionary:[EXUpdatesBuildData getBuildDataFromConfig:_configReleaseChannelTest]]);
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configReleaseChannelTest error:nil];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
  });
}

// check updates are cleared and build data is set
- (void)test_ensureBuildDataIsConsistent_buildDataIsInconsistent_channel {
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
    
    [_db setStaticBuildData:[EXUpdatesBuildData getBuildDataFromConfig:_configChannelTest] withScopeKey:_configChannelTest.scopeKey error:nil];
  });
  
  [EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configChannelTestTwo];
  
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:&error];
    XCTAssertTrue([staticBuildData isEqualToDictionary:[EXUpdatesBuildData getBuildDataFromConfig:_configChannelTestTwo]]);
    XCTAssertNil(error);

    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTestTwo error:&error];
    XCTAssertEqual(allUpdates.count, 0);
  });
}

- (void)test_ensureBuildDataIsConsistent_buildDataIsInconsistent_releaseChannel {
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configReleaseChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 1);
    XCTAssertNil(error);
    
    [_db setStaticBuildData:[EXUpdatesBuildData getBuildDataFromConfig:_configReleaseChannelTest] withScopeKey:_configReleaseChannelTest.scopeKey error:nil];
  });
  
  [EXUpdatesBuildData ensureBuildDataIsConsistentAsync:self->_db config:self->_configReleaseChannelTestTwo];
  
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [_db staticBuildDataWithScopeKey:scopeKey error:&error];
    XCTAssertTrue([staticBuildData isEqualToDictionary:[EXUpdatesBuildData getBuildDataFromConfig:_configReleaseChannelTestTwo]]);
    XCTAssertNil(error);

    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configReleaseChannelTestTwo error:&error];
    XCTAssertEqual(allUpdates.count, 0);
  });
}

@end
