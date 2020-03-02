// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryProvider.h>

#import <ABI37_0_0EXScreenOrientation/ABI37_0_0EXScreenOrientationViewController.h>
#import <ABI37_0_0EXScreenOrientation/ABI37_0_0EXScreenOrientationRegistry.h>

@interface ABI37_0_0EXScreenOrientationViewController ()

@property (nonatomic, assign) UIInterfaceOrientationMask defaultOrientationMask;

@end

@implementation ABI37_0_0EXScreenOrientationViewController

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
  ABI37_0_0EXScreenOrientationRegistry *screenOrientationRegistry = (ABI37_0_0EXScreenOrientationRegistry *)[ABI37_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI37_0_0EXScreenOrientationRegistry class]];
  if (screenOrientationRegistry && [screenOrientationRegistry requiredOrientationMask] > 0) {
    return [screenOrientationRegistry requiredOrientationMask];
  }
  
  return _defaultOrientationMask;
}

- (void)traitCollectionDidChange:(nullable UITraitCollection *)previousTraitCollection {
  [super traitCollectionDidChange:previousTraitCollection];
  if ((self.traitCollection.verticalSizeClass != previousTraitCollection.verticalSizeClass)
      || (self.traitCollection.horizontalSizeClass != previousTraitCollection.horizontalSizeClass)) {
    ABI37_0_0EXScreenOrientationRegistry *screenOrientationRegistryController = (ABI37_0_0EXScreenOrientationRegistry *)[ABI37_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI37_0_0EXScreenOrientationRegistry class]];
    [screenOrientationRegistryController traitCollectionDidChangeTo:self.traitCollection];
  }
}

@end
