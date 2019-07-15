//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesDatabaseStatus) {
  EXUpdatesDatabaseStatusFailed = 0,
  EXUpdatesDatabaseStatusReady = 1,
  EXUpdatesDatabaseStatusPending = 2,
  EXUpdatesDatabaseStatusUnused = 3
};

typedef NS_ENUM(NSInteger, EXUpdatesDatabaseHashType) {
  EXUpdatesDatabaseHashTypeSha1 = 0
};

@interface EXUpdatesDatabase : NSObject

@property (nonatomic, readonly) NSLock *lock;

- (void)openDatabase;
- (void)closeDatabase;

- (void)addUpdateWithId:(NSUUID *)updateId
             commitTime:(NSNumber *)commitTime
         binaryVersions:(NSString *)binaryVersions
               metadata:(NSDictionary * _Nullable)metadata;

- (void)addAssets:(NSArray<EXUpdatesAsset *>*)assets
   toUpdateWithId:(NSUUID *)updateId;

- (void)markUpdatesForDeletion;
- (NSArray<NSDictionary *>*)markAssetsForDeletion;
- (void)deleteAssetsWithIds:(NSArray<NSNumber *>*)assetIds;
- (void)deleteUnusedUpdates;

- (NSArray<NSDictionary *>*)launchableUpdates;
- (NSURL * _Nullable)launchAssetUrlWithUpdateId:(NSUUID *)updateId;
- (NSArray<NSDictionary *>*)assetsForUpdateId:(NSUUID *)updateId;

@end

NS_ASSUME_NONNULL_END
