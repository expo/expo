// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMModuleRegistryProvider.h>

#import <EXScreenOrientation/EXScreenOrientationViewController.h>
#import <EXScreenOrientation/EXScreenOrientationRegistry.h>

@interface EXScreenOrientationViewController ()

@property (nonatomic, assign) UIInterfaceOrientationMask defaultOrientationMask;

@end

@implementation EXScreenOrientationViewController

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
  EXScreenOrientationRegistry *screenOrientationRegistry = (EXScreenOrientationRegistry *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXScreenOrientationRegistry class]];
  if (screenOrientationRegistry && [screenOrientationRegistry requiredOrientationMask] > 0) {
    return [screenOrientationRegistry requiredOrientationMask];
  }
  
  return _defaultOrientationMask;
}

- (void)traitCollectionDidChange:(nullable UITraitCollection *)previousTraitCollection {
  [super traitCollectionDidChange:previousTraitCollection];
  if ((self.traitCollection.verticalSizeClass != previousTraitCollection.verticalSizeClass)
      || (self.traitCollection.horizontalSizeClass != previousTraitCollection.horizontalSizeClass)) {
    EXScreenOrientationRegistry *screenOrientationRegistryController = (EXScreenOrientationRegistry *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXScreenOrientationRegistry class]];
    [screenOrientationRegistryController traitCollectionDidChangeTo:self.traitCollection];
  }
}

@end
