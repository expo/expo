//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncAsset.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncConfig.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI40_0_0EXSyncDatabaseHashType) {
  ABI40_0_0EXSyncDatabaseHashTypeSha1 = 0
};

@interface ABI40_0_0EXSyncDatabase : NSObject

@property (nonatomic, strong) dispatch_queue_t databaseQueue;

- (BOOL)openDatabaseInDirectory:(NSURL *)directory withError:(NSError ** _Nullable)error;
- (void)closeDatabase;

- (void)addUpdate:(ABI40_0_0EXSyncManifest *)update error:(NSError ** _Nullable)error;
- (void)addNewAssets:(NSArray<ABI40_0_0EXSyncAsset *> *)assets toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (BOOL)addExistingAsset:(ABI40_0_0EXSyncAsset *)asset toUpdateWithId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (void)updateAsset:(ABI40_0_0EXSyncAsset *)asset error:(NSError ** _Nullable)error;
- (void)mergeAsset:(ABI40_0_0EXSyncAsset *)asset withExistingEntry:(ABI40_0_0EXSyncAsset *)existingAsset error:(NSError ** _Nullable)error;
- (void)markUpdateFinished:(ABI40_0_0EXSyncManifest *)update error:(NSError ** _Nullable)error;
- (void)setScopeKey:(NSString *)scopeKey onUpdate:(ABI40_0_0EXSyncManifest *)update error:(NSError ** _Nullable)error;

- (void)deleteUpdates:(NSArray<ABI40_0_0EXSyncManifest *> *)updates error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI40_0_0EXSyncAsset *> *)deleteUnusedAssetsWithError:(NSError ** _Nullable)error;

- (nullable NSArray<ABI40_0_0EXSyncManifest *> *)allUpdatesWithConfig:(ABI40_0_0EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI40_0_0EXSyncManifest *> *)launchableUpdatesWithConfig:(ABI40_0_0EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable ABI40_0_0EXSyncManifest *)updateWithId:(NSUUID *)updateId config:(ABI40_0_0EXSyncConfig *)config error:(NSError ** _Nullable)error;
- (nullable NSArray<ABI40_0_0EXSyncAsset *> *)assetsWithUpdateId:(NSUUID *)updateId error:(NSError ** _Nullable)error;
- (nullable ABI40_0_0EXSyncAsset *)assetWithKey:(NSString *)key error:(NSError ** _Nullable)error;

@end

NS_ASSUME_NONNULL_END
