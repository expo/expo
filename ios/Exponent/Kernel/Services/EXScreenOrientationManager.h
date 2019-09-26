// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScreenOrientation.h"

@interface EXScreenOrientationManager : NSObject <EXScreenOrientationScopedModuleDelegate>

@property (nonatomic, strong) NSMapTable<NSString *, id> *__nonnull subscribedModules;

@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientationsForVisibleApp;

- (void)setSupportInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations forExperienceId:(nullable NSString *)experienceId;

- (void)handleScreenOrientationChange:(nullable UITraitCollection *)traitCollection;

@end
