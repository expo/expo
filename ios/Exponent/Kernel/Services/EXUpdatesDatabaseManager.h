// Copyright 2020-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesDatabaseManager : NSObject

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) EXUpdatesDatabase *database;
@property (nonatomic, assign, readonly) BOOL isDatabaseOpen;
@property (nonatomic, strong, readonly, nullable) NSError *error;

- (BOOL)openDatabase;

@end

NS_ASSUME_NONNULL_END
