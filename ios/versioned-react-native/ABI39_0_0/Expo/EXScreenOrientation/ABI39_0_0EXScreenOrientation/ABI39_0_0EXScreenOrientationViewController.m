// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryProvider.h>

#import <ABI39_0_0EXScreenOrientation/ABI39_0_0EXScreenOrientationViewController.h>
#import <ABI39_0_0EXScreenOrientation/ABI39_0_0EXScreenOrientationRegistry.h>

@interface ABI39_0_0EXScreenOrientationViewController ()

@property (nonatomic, assign) UIInterfaceOrientationMask defaultOrientationMask;

@end

@implementation ABI39_0_0EXScreenOrientationViewController

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
  ABI39_0_0EXScreenOrientationRegistry *screenOrientationRegistry = (ABI39_0_0EXScreenOrientationRegistry *)[ABI39_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI39_0_0EXScreenOrientationRegistry class]];
  if (screenOrientationRegistry && [screenOrientationRegistry requiredOrientationMask] > 0) {
    return [screenOrientationRegistry requiredOrientationMask];
  }
  
  return _defaultOrientationMask;
}

- (void)traitCollectionDidChange:(nullable UITraitCollection *)previousTraitCollection {
  [super traitCollectionDidChange:previousTraitCollection];
  if ((self.traitCollection.verticalSizeClass != previousTraitCollection.verticalSizeClass)
      || (self.traitCollection.horizontalSizeClass != previousTraitCollection.horizontalSizeClass)) {
    ABI39_0_0EXScreenOrientationRegistry *screenOrientationRegistryController = (ABI39_0_0EXScreenOrientationRegistry *)[ABI39_0_0UMModuleRegistryProvider getSingletonModuleForClass:[ABI39_0_0EXScreenOrientationRegistry class]];
    [screenOrientationRegistryController traitCollectionDidChangeTo:self.traitCollection];
  }
}

@end
