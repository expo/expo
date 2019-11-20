#if __has_include(<EXBranch/EXBranchManager.h>)
// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <EXBranch/EXBranchManager.h>
#import "EXKernelService.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Handles logic for Branch deep links and integration with the versioned
 * RN bindings. Based loosely on RNBranch.h but handles versionning and limit
 * usage to standalone apps.
 */
@interface EXScopedBranchManager : EXBranchManager <EXKernelService>

@end

NS_ASSUME_NONNULL_END
#endif
