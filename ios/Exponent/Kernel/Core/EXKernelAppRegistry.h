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

@property (nonatomic, weak) id<EXKernelAppRegistryDelegate> delegate;

@property (nonatomic, readonly) EXKernelAppRecord *homeAppRecord;

- (EXKernelAppRecord *)recordForId:(NSString *)recordId;
- (EXKernelAppRecord * _Nullable)newestRecordWithExperienceId:(NSString *)experienceId; // TODO: ben: audit
- (NSEnumerator<id> *)appEnumerator; // does not include home
- (BOOL)isExperienceIdUnique:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
