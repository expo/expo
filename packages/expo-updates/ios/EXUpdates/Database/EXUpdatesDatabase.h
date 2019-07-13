//  Copyright © 2019 650 Industries. All rights reserved.

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

- (void)addAssetWithUrl:(NSString *)url
                headers:(NSDictionary * _Nullable)headers
                   type:(NSString *)type
               metadata:(NSDictionary * _Nullable)metadata
           downloadTime:(NSDate *)downloadTime
           relativePath:(NSString *)relativePath
             hashAtomic:(NSString *)hashAtomic
            hashContent:(NSString *)hashContent
               hashType:(EXUpdatesDatabaseHashType)hashType
               updateId:(NSUUID *)updateId
          isLaunchAsset:(BOOL)isLaunchAsset;

- (void)markUpdatesForDeletion;
- (NSArray<NSDictionary *>*)markAssetsForDeletion;
- (void)deleteAssetsWithIds:(NSArray<NSNumber *>*)assetIds;
- (void)deleteUnusedUpdates;

- (NSArray<NSDictionary *>*)launchableUpdates;
- (NSURL * _Nullable)launchAssetUrlWithUpdateId:(NSUUID *)updateId;
- (NSArray<NSDictionary *>*)assetsForUpdateId:(NSUUID *)updateId;

@end

NS_ASSUME_NONNULL_END
