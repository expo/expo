// Copyright 2020-present 650 Industries. All rights reserved.

#import "EXSyncDatabaseManager.h"
#import <EXUpdates/EXSyncUtils.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncDatabaseManager ()

@property (nonatomic, strong) NSURL *updatesDirectory;
@property (nonatomic, strong) EXSyncDatabase *database;
@property (nonatomic, assign) BOOL isDatabaseOpen;
@property (nonatomic, strong, nullable) NSError *error;

@end

@implementation EXSyncDatabaseManager

- (instancetype)init
{
  if (self = [super init]) {
    _database = [[EXSyncDatabase alloc] init];
    _isDatabaseOpen = NO;
  }
  return self;
}

- (NSURL *)updatesDirectory
{
  if (!_updatesDirectory) {
    NSError *fsError;
    _updatesDirectory = [EXSyncUtils initializeUpdatesDirectoryWithError:&fsError];
    if (fsError) {
      _error = fsError;
    }
  }
  return _updatesDirectory;
}

- (BOOL)openDatabase
{
  if (!self.updatesDirectory) {
    return NO;
  }

  __block BOOL success = NO;
  __block NSError *dbError;
  dispatch_sync(self.database.databaseQueue, ^{
    success = [self.database openDatabaseInDirectory:self.updatesDirectory withError:&dbError];
  });

  if (dbError) {
    _error = dbError;
  }
  _isDatabaseOpen = success;

  return success;
}

@end

NS_ASSUME_NONNULL_END
