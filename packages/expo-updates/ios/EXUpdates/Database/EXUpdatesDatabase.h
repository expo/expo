//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesDatabaseHashType) {
  EXUpdatesDatabaseHashTypeSha1 = 0
};

@interface EXUpdatesDatabase : NSObject

@property (nonatomic, strong) dispatch_queue_t databaseQueue;

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error;
- (void)closeDatabase;

- (void)addUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)addNewAssets:(NSArray<EXUpdatesAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (BOOL)addExistingAsset:(EXUpdatesAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (void)updateAsset:(EXUpdatesAsset *)asset error:(NSError ** _Nullable)error;
- (void)mergeAsset:(EXUpdatesAsset *)asset withExistingEntry:(EXUpdatesAsset *)existingAsset error:(NSError ** _Nullable)error;
- (void)markUpdateFinished:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)setScopeKey:(NSString *)scopeKey onUpdate:(EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;

- (void)deleteUpdates:(NSArray<EXUpdatesUpdate *> *)updates error:(NSError ** _Nullable)error;
- (nullable NSArray<EXUpdatesAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error;

- (nullable NSArray<EXUpdatesUpdate *> *)allUpdatesWithConfig:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<EXUpdatesUpdate *> *)launchableUpdatesWithConfig:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable EXUpdatesUpdate *)updateWithId:(NSUUID *)updateId config:(EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<EXUpdatesAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (nullable EXUpdatesAsset *)assetWithKey:(NSString *)key error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
