// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRecord.h"

@class RCTBridge;
@class EXReactAppManager;
@class EXFrameReactAppManager;
@class EXKernelAppRegistry;
@class EXKernelReactAppManager;

@protocol EXKernelAppRegistryDelegate <NSObject>

- (void)appRegistry:(EXKernelAppRegistry *)registry didRegisterAppRecord:(EXKernelAppRecord *)appRecord;
- (void)appRegistry:(EXKernelAppRegistry *)registry willUnregisterAppRecord:(EXKernelAppRecord *)appRecord;

@end

@interface EXKernelAppRegistry : NSObject

- (void)registerKernelAppManager: (EXKernelReactAppManager *)appManager;
- (void)unregisterKernelAppManager;

- (NSString *)registerAppWithManifestUrl:(NSURL *)manifestUrl;
- (void)addAppManager:(EXFrameReactAppManager *)appManager toRecordWithId:(NSString *)recordId;
- (void)addAppManager:(EXFrameReactAppManager *)appManager toRecordWithExperienceId:(NSString *)experienceId;

- (void)unregisterAppWithRecordId:(NSString *)recordId;
- (void)unregisterRecordWithExperienceId:(NSString *)experienceId;

- (void)setExperienceFinishedLoading:(BOOL)experienceFinishedLoading onRecordWithId:(NSString *)recordId;
- (void)setExperienceFinishedLoading:(BOOL)experienceFinishedLoading onRecordWithExperienceId:(NSString *)experienceId;

/**
 *  We pass some system events on to the visible experience,
 *  but not to any others which may be open, e.g. UIApplicationState changes.
 */
@property (nonatomic, weak) EXReactAppManager *lastKnownForegroundAppManager;

@property (nonatomic, weak) id<EXKernelAppRegistryDelegate> delegate;

- (EXKernelAppRecord *)recordForId:(NSString *)recordId;
- (EXKernelAppRecord * _Nullable)newestRecordWithExperienceId:(NSString *)experienceId;
- (EXKernelReactAppManager *)kernelAppManager;
- (NSEnumerator<id> *)appEnumerator; // does not include kernel
- (BOOL)isExperienceIdUnique:(NSString *)experienceId;

@end
