// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRecord.h"

@class RCTBridge;
@class EXReactAppManager;
@class EXKernelAppRegistry;

NS_ASSUME_NONNULL_BEGIN

@protocol EXKernelAppRegistryDelegate <NSObject>

- (void)appRegistry:(EXKernelAppRegistry *)registry didRegisterAppRecord:(EXKernelAppRecord *)appRecord;
- (void)appRegistry:(EXKernelAppRegistry *)registry willUnregisterAppRecord:(EXKernelAppRecord *)appRecord;

@end

@interface EXKernelAppRegistry : NSObject

- (void)registerHomeAppRecord:(EXKernelAppRecord *)homeRecord;
- (void)unregisterHomeAppRecord;

- (NSString *)registerAppWithManifestUrl:(NSURL *)manifestUrl initialProps:(NSDictionary *)initialProps;
- (void)unregisterAppWithRecordId:(NSString *)recordId;
- (void)unregisterAppWithRecord:(nullable EXKernelAppRecord *)appRecord;

@property (nonatomic, weak) id<EXKernelAppRegistryDelegate> delegate;

/**
 *  If Expo Home is available, return the record representing the Home app.
 */
@property (nonatomic, readonly, nullable) EXKernelAppRecord *homeAppRecord;

/**
 *  If we are running a standalone app, return the record for the standalone app.
 */
@property (nonatomic, readonly, nullable) EXKernelAppRecord *standaloneAppRecord;

- (EXKernelAppRecord *)recordForId:(NSString *)recordId;
- (EXKernelAppRecord * _Nullable)newestRecordWithExperienceId:(NSString *)experienceId;
- (NSEnumerator<id> *)appEnumerator; // does not include home
- (BOOL)isExperienceIdUnique:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
