// Copyright 2015-present 650 Industries. All rights reserved.

@protocol EXScreenOrientationScopedModuleDelegate

- (void)screenOrientationModule:(nonnull id)scopedOrientationModule
didChangeSupportedInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations;

- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForVisibleApp;

- (void)removeOrientationChangeListener:(nonnull NSString *)experienceId;

- (void)addOrientationChangeListener:(nonnull NSString *)experienceId subscriberModule:(nonnull id)subscriberModule;

- (nullable UITraitCollection *)getTraitCollection;

@end

@protocol EXScreenOrientationListener

- (void)handleScreenOrientationChange:(nullable UITraitCollection *)traitCollection;

@end

@interface EXScreenOrientationManager : NSObject <EXScreenOrientationScopedModuleDelegate>

@property (nonatomic, strong) NSMapTable<NSString *, id> *__nonnull subscribedModules;

@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientationsForVisibleApp;

- (void)setSupportInterfaceOrientations:(UIInterfaceOrientationMask)supportedInterfaceOrientations forExperienceId:(nullable NSString *)experienceId;

- (void)handleScreenOrientationChange:(nullable UITraitCollection *)traitCollection;

@end
