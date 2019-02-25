// Copyright 2015-present 650 Industries. All rights reserved.
#import <UIKit/UIKit.h>
#import <EXFileSystem/EXFileSystem.h>
#import <EXConstantsInterface/EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedFileSystemModule : EXFileSystem

- (instancetype)initWithExperienceId:(NSString *)experienceId constantsModule:(id<EXConstantsInterface>)constantsModule;

@end

NS_ASSUME_NONNULL_END
