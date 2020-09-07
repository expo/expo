//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAsset.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI39_0_0EXUpdatesDatabaseHashType) {
  ABI39_0_0EXUpdatesDatabaseHashTypeSha1 = 0
};

@interface ABI39_0_0EXUpdatesDatabase : NSObject

@property (nonatomic, strong) dispatch_queue_t databaseQueue;

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error;
- (void)closeDatabase;

- (void)addUpdate:(ABI39_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;
- (void)addNewAssets:(NSArray<ABI39_0_0EXUpdatesAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (BOOL)addExistingAsset:(ABI39_0_0EXUpdatesAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (void)updateAsset:(ABI39_0_0EXUpdatesAsset *)asset error:(NSError ** _Nullable)error;
- (void)mergeAsset:(ABI39_0_0EXUpdatesAsset *)asset withExistingEntry:(ABI39_0_0EXUpdatesAsset *)existingAsset error:(NSError ** _Nullable)error;
- (void)markUpdateFinished:(ABI39_0_0EXUpdatesUpdate *)update error:(NSError ** _Nullable)error;

- (void)deleteUpdates:(NSArray<ABI39_0_0EXUpdatesUpdate *> *)updates error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI39_0_0EXUpdatesAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error;

- (nullable NSArray<ABI39_0_0EXUpdatesUpdate *> *)allUpdatesWithConfig:(ABI39_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI39_0_0EXUpdatesUpdate *> *)launchableUpdatesWithConfig:(ABI39_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable ABI39_0_0EXUpdatesUpdate *)updateWithId:(NSUUID *)updateId config:(ABI39_0_0EXUpdatesConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI39_0_0EXUpdatesAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (nullable ABI39_0_0EXUpdatesAsset *)assetWithKey:(NSString *)key error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
