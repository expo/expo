// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMReactNativeAdapter/UMModuleRegistryHolderReactModule.h>
#import <UMCore/UMModuleRegistryProvider.h>

#import <EXScreenOrientation/EXScreenOrientationViewController.h>
#import <EXScreenOrientation/EXScreenOrientationRegistry.h>

@interface EXScreenOrientationViewController ()

@property (nonatomic, weak) RCTBridge* bridge;
@property (nonatomic, assign) UIInterfaceOrientationMask defaultOrientation;

@end

@implementation EXScreenOrientationViewController

- (instancetype)initWithRCTBrigde:(RCTBridge*)brigde andWithDefaultScreenOrientationMask:(UIInterfaceOrientationMask)defaultOrientation
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
  if (screenOrientationRegistry && [screenOrientationRegistry currentOrientationMask] > 0) {
    return [screenOrientationRegistry currentOrientationMask];
  }
  
  return _defaultOrientation;
}

@end
