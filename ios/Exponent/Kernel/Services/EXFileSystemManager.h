// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "EXKernelService.h"

// Prior to SDK 29, EXFileSystem native module was registering with a dependency on EXFileSystemManager kernel service.
// The purpose of this kernel service was to provide the module with bundle directory and bundled assets list.
// The kernel service acted in two ways, it returned some values if the experience was standalone/detached
// and it returned empty values if the experience wasn't standalone
//
// Since SDK 29 we strive to move as much generic code as possible to universal modules.
//
// The standalone scenario implementation was applicable to detached, standalone and vanilla React Native applications
// so/and it was moved to expo-file-system package as EXFileSystemManagerService. We still had to take Expo Client scenario
// into consideration — for this, EXFileSystemBinding class was created, which checks with constants module if the app is an Expo Client.
// If so, it early returns empty values. (Otherwise it falls back to expo-file-system's EXFileSystemManagerService implementation).
//
// This class is used only in SDKs < 29.

NS_ASSUME_NONNULL_BEGIN

@interface EXFileSystemManager : NSObject <EXKernelService>

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

