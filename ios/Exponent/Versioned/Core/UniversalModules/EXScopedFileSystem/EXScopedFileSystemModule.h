// Copyright 2015-present 650 Industries. All rights reserved.
#import <UIKit/UIKit.h>
#import <EXFileSystem/EXFileSystem.h>
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedFileSystemModule : EXFileSystem

- (instancetype)initWithExperienceId:(NSString *)experienceId andConstantsBinding:(EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
