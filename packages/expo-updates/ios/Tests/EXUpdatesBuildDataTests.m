//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXManifests/EXManifestsNewManifest.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesBuildData.h>

@interface EXUpdatesBuildDataTests : XCTestCase

@property (nonatomic, strong) EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;
@property (nonatomic, strong) EXManifestsNewManifest *manifest;
@property (nonatomic, strong) NSDictionary *configChannelTestDictionary;
@property (nonatomic, strong) EXUpdatesConfig *configChannelTest;
@property (nonatomic, strong) NSDictionary *configChannelTestTwoDictionary;
@property (nonatomic, strong) EXUpdatesConfig *configChannelTestTwo;

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
    @"EXUpdatesScopeKey": scopeKey,
    @"EXUpdatesURL": @"https://exp.host/@test/test",
    @"EXUpdatesReleaseChannel": @"default",
    @"EXUpdatesRequestHeaders": @{@"expo-channel-name":@"test"}
  };
  _configChannelTest = [EXUpdatesConfig configWithDictionary:_configChannelTestDictionary];
  _configChannelTestTwoDictionary = @{
    @"EXUpdatesScopeKey": scopeKey,
    @"EXUpdatesURL": @"https://exp.host/@test/test",
    @"EXUpdatesReleaseChannel": @"default",
    @"EXUpdatesRequestHeaders": @{@"expo-channel-name":@"testTwo"}
  };
  _configChannelTestTwo = [EXUpdatesConfig configWithDictionary:_configChannelTestTwoDictionary
  ];
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
    EXUpdatesUpdate *update = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:nil config:_configChannelTest database:_db];
  
    NSError *updatesError;
    [_db addUpdate:update error:&updatesError];
    if (updatesError) {
      XCTFail(@"%@", updatesError.localizedDescription);
      return;
    }

    NSError *queryError;
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&queryError];
    if (queryError) {
      XCTFail(@"%@", queryError.localizedDescription);
      return;
    }
    
    XCTAssertGreaterThan(allUpdates.count, 0);
  });
  
  [EXUpdatesBuildData clearAllUpdatesFromDatabase:_db config:_configChannelTest error:nil];
  
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

- (void)test_ensureBuildDataIsConsistent_buildDataIsNull {
  // check no updates and build data is set

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [EXUpdatesBuildData getBuildDataFromDatabase:_db scopeKey:scopeKey error:&error];
    XCTAssertNil(staticBuildData);

    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:&error];
    XCTAssertEqual(allUpdates.count, 0);
    XCTAssertNil(error);
  });

  NSError *error;
  [EXUpdatesBuildData ensureBuildDataIsConsistent:_db config:_configChannelTest error:&error];
  XCTAssertNil(error);

  
  dispatch_sync(_db.databaseQueue, ^{
      NSError *error;
      NSDictionary *newStaticBuildData = [EXUpdatesBuildData getBuildDataFromDatabase:_db scopeKey:scopeKey error:&error];
      XCTAssertNotNil(newStaticBuildData);
      XCTAssertNil(error);
  });

}

- (void)test_ensureBuildDataIsConsistent_buildDataIsConsistent {
  dispatch_sync(_db.databaseQueue, ^{
    EXUpdatesUpdate *update = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:nil config:_configChannelTest database:_db];
    
    NSError *error;
    [_db addUpdate:update error:nil];
    XCTAssertNil(error);
  });

  [EXUpdatesBuildData setBuildDataInDatabase:_db config:_configChannelTest error:nil];
  
  NSError *error;
  [EXUpdatesBuildData ensureBuildDataIsConsistent:_db config:_configChannelTest error:nil];
  XCTAssertNil(error);

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [EXUpdatesBuildData getBuildDataFromDatabase:_db scopeKey:scopeKey error:nil];

    XCTAssertTrue([staticBuildData isEqualToDictionary:[EXUpdatesBuildData getBuildDataFromConfig:_configChannelTest]]);
    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTest error:nil];
    XCTAssertEqual(allUpdates.count, 1);
    
    XCTAssertNil(error);
  });
}

- (void)test_ensureBuildDataIsConsistent_buildDataIsInconsistent {
  dispatch_sync(_db.databaseQueue, ^{
    EXUpdatesUpdate *update = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:nil config:_configChannelTest database:_db];

    NSError *error;
    [_db addUpdate:update error:&error];
    [EXUpdatesBuildData setBuildDataInDatabase:_db config:_configChannelTest error:nil];
    XCTAssertNil(error);
  });
  
  NSError *error;
  [EXUpdatesBuildData ensureBuildDataIsConsistent:_db config:_configChannelTestTwo error:&error];
  XCTAssertNil(error);

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error;
    NSDictionary *staticBuildData = [EXUpdatesBuildData getBuildDataFromDatabase:_db scopeKey:scopeKey error:&error];
    XCTAssertTrue([staticBuildData isEqualToDictionary:[EXUpdatesBuildData getBuildDataFromConfig:_configChannelTestTwo]]);
    XCTAssertNil(error);

    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:_configChannelTestTwo error:&error];
    XCTAssertEqual(allUpdates.count, 0);
  });
}

@end
