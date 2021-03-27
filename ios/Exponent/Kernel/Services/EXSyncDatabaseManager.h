// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncDatabase.h>
#import <Foundation/Foundation.h>

#import "EXSyncBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncDatabaseManager : NSObject <EXSyncDatabaseBindingDelegate>

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) EXSyncDatabase *database;
@property (nonatomic, assign, readonly) BOOL isDatabaseOpen;
@property (nonatomic, strong, readonly, nullable) NSError *error;

- (BOOL)openDatabase;

@end

NS_ASSUME_NONNULL_END
