// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMReactNativeAdapter/UMModuleRegistryHolderReactModule.h>
#import <UMCore/UMModuleRegistryProvider.h>

#import <EXScreenOrientation/EXScreenOrientationViewController.h>
#import <EXScreenOrientation/EXScreenOrientationRegistry.h>

@interface EXScreenOrientationViewController ()

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, assign) UIInterfaceOrientationMask defaultOrientation;

@end

@implementation EXScreenOrientationViewController

- (instancetype)initWithBrigde:(RCTBridge*)brigde andDefaultScreenOrientationMask:(UIInterfaceOrientationMask)defaultOrientation
{
  if (self = [super init]) {
    _bridge = brigde;
    _defaultOrientation = defaultOrientation;
  }
  
  return self;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  EXScreenOrientationRegistry *screenOrientationRegistry = (EXScreenOrientationRegistry *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXScreenOrientationRegistry class]];
  if (screenOrientationRegistry && [screenOrientationRegistry foregroundedOrientationMask] > 0) {
    return [screenOrientationRegistry foregroundedOrientationMask];
  }
  
  return _defaultOrientation;
}

- (void)traitCollectionDidChange:(nullable UITraitCollection *)previousTraitCollection {
  [super traitCollectionDidChange:previousTraitCollection];
  if ((self.traitCollection.verticalSizeClass != previousTraitCollection.verticalSizeClass)
      || (self.traitCollection.horizontalSizeClass != previousTraitCollection.horizontalSizeClass)) {
    EXScreenOrientationRegistry *screenOrientationRegistry = (EXScreenOrientationRegistry *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXScreenOrientationRegistry class]];
    [screenOrientationRegistry traitCollectionsDidChange:self.traitCollection];
  }
}

@end
