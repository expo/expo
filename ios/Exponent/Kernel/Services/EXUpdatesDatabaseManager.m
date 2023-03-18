// Copyright 2020-present 650 Industries. All rights reserved.

#import "EXUpdatesDatabaseManager.h"

@import EXUpdates;

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesDatabaseManager ()

@property (nonatomic, strong) NSURL *updatesDirectory;
@property (nonatomic, strong) EXUpdatesDatabase *database;
@property (nonatomic, assign) BOOL isDatabaseOpen;
@property (nonatomic, strong, nullable) NSError *error;

@end

@implementation EXUpdatesDatabaseManager

- (instancetype)init
{
  if (self = [super init]) {
    _database = [[EXUpdatesDatabase alloc] init];
    _isDatabaseOpen = NO;
  }
  return self;
}

- (NSURL *)updatesDirectory
{
  if (!_updatesDirectory) {
    NSError *fsError;
    _updatesDirectory = [EXUpdatesUtils initializeUpdatesDirectoryAndReturnError:&fsError];
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
    success = [self.database openDatabaseInDirectory:self.updatesDirectory error:&dbError];
  });

  if (dbError) {
    _error = dbError;
  }
  _isDatabaseOpen = success;

  return success;
}

@end

NS_ASSUME_NONNULL_END
