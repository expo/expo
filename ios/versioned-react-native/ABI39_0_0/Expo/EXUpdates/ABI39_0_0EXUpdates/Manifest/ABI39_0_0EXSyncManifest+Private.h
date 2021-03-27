//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncAsset.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXSyncManifest ()

@property (nonatomic, strong, readwrite) NSUUID *updateId;
@property (nonatomic, strong, readwrite) NSDate *commitTime;
@property (nonatomic, strong, readwrite) NSString *runtimeVersion;
@property (nonatomic, strong, readwrite, nullable) NSDictionary *metadata;
@property (nonatomic, assign, readwrite) BOOL keep;
@property (nonatomic, strong, readwrite) NSURL *bundleUrl;
@property (nonatomic, strong, readwrite) NSArray<ABI39_0_0EXSyncAsset *> *assets;
@property (nonatomic, assign, readwrite) BOOL isDevelopmentMode;

@property (nonatomic, strong) ABI39_0_0EXSyncConfig *config;
@property (nonatomic, strong, nullable) ABI39_0_0EXSyncDatabase *database;

- (instancetype)initWithRawManifest:(NSDictionary *)manifest
                             config:(ABI39_0_0EXSyncConfig *)config
                           database:(nullable ABI39_0_0EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
