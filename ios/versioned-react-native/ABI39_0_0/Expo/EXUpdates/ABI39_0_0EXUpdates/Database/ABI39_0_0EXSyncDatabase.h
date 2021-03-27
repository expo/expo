//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncAsset.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI39_0_0EXSyncDatabaseHashType) {
  ABI39_0_0EXSyncDatabaseHashTypeSha1 = 0
};

@interface ABI39_0_0EXSyncDatabase : NSObject

@property (nonatomic, strong) dispatch_queue_t databaseQueue;

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error;
- (void)closeDatabase;

- (void)addUpdate:(ABI39_0_0EXSyncManifest *)update error:(NSError ** _Nullable)error;
- (void)addNewAssets:(NSArray<ABI39_0_0EXSyncAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (BOOL)addExistingAsset:(ABI39_0_0EXSyncAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (void)updateAsset:(ABI39_0_0EXSyncAsset *)asset error:(NSError ** _Nullable)error;
- (void)mergeAsset:(ABI39_0_0EXSyncAsset *)asset withExistingEntry:(ABI39_0_0EXSyncAsset *)existingAsset error:(NSError ** _Nullable)error;
- (void)markUpdateFinished:(ABI39_0_0EXSyncManifest *)update error:(NSError ** _Nullable)error;

- (void)deleteUpdates:(NSArray<ABI39_0_0EXSyncManifest *> *)updates error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI39_0_0EXSyncAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error;

- (nullable NSArray<ABI39_0_0EXSyncManifest *> *)allUpdatesWithConfig:(ABI39_0_0EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI39_0_0EXSyncManifest *> *)launchableUpdatesWithConfig:(ABI39_0_0EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable ABI39_0_0EXSyncManifest *)updateWithId:(NSUUID *)updateId config:(ABI39_0_0EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI39_0_0EXSyncAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (nullable ABI39_0_0EXSyncAsset *)assetWithKey:(NSString *)key error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
