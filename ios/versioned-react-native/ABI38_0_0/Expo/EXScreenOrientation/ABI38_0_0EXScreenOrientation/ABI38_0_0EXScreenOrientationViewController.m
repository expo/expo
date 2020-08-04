// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryProvider.h>

#import <ABI38_0_0EXScreenOrientation/ABI38_0_0EXScreenOrientationViewController.h>
#import <ABI38_0_0EXScreenOrientation/ABI38_0_0EXScreenOrientationRegistry.h>

@interface ABI38_0_0EXScreenOrientationViewController ()

@property (nonatomic, assign) UIInterfaceOrientationMask defaultOrientationMask;

@end

@implementation ABI38_0_0EXScreenOrientationViewController

- (instancetype)init
{
  return [self initWithDefaultScreenOrientationMask:UIInterfaceOrientationMaskPortrait];
}

- (instancetype)initWithDefaultScreenOrientationMask:(UIInterfaceOrientationMask)defaultOrientationMask
{
  if (self = [super init]) {
    _defaultOrientationMask = defaultOrientationMask;
  }
  
  return self;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  ABI38_0_0EXScreenOrientationRegistry *screenOrientationRegistry = (ABI38_0_0EXScreenOrientationRegistry *)[ABI38_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI38_0_0EXScreenOrientationRegistry class]];
  if (screenOrientationRegistry && [screenOrientationRegistry requiredOrientationMask] > 0) {
    return [screenOrientationRegistry requiredOrientationMask];
  }
  
  return _defaultOrientationMask;
}

- (void)traitCollectionDidChange:(nullable UITraitCollection *)previousTraitCollection {
  [super traitCollectionDidChange:previousTraitCollection];
  if ((self.traitCollection.verticalSizeClass != previousTraitCollection.verticalSizeClass)
      || (self.traitCollection.horizontalSizeClass != previousTraitCollection.horizontalSizeClass)) {
    ABI38_0_0EXScreenOrientationRegistry *screenOrientationRegistryController = (ABI38_0_0EXScreenOrientationRegistry *)[ABI38_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI38_0_0EXScreenOrientationRegistry class]];
    [screenOrientationRegistryController traitCollectionDidChangeTo:self.traitCollection];
  }
}

@end
