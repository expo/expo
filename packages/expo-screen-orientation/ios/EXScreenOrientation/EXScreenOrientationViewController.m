// Copyright 2019-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistryProvider.h>

#import <EXScreenOrientation/EXScreenOrientationViewController.h>
#import <EXScreenOrientation/EXScreenOrientationRegistry.h>
#import <EXScreenOrientation/NSString+UIInterfaceOrientationMask.h>

NSString *const EXDefaultScreenOrientationMask = @"EXDefaultScreenOrientationMask";

// copy of RNScreens protocol
@protocol EXScreenOrientationRNSScreenWindowTraits

+ (BOOL)shouldAskScreensForScreenOrientationInViewController:(UIViewController *)vc;

@end

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

- (instancetype)initDefaultScreenOrientationFromPlist
{
  NSString *plistValue = [NSBundle.mainBundle objectForInfoDictionaryKey:EXDefaultScreenOrientationMask];
  if (plistValue != nil) {
    @try {
      UIInterfaceOrientationMask mask = [plistValue toUIInterfaceOrientationMask];
      return [self initWithDefaultScreenOrientationMask:mask];
    } @catch (NSException *exception) {
      EXLogError(@"Invalid `%@` value in Info.plist, expected: one of `UIInterfaceOrientationMask` value, got: \"%@\".", EXDefaultScreenOrientationMask, plistValue);
    }
  }
  return [self init];
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  if ([self shouldUseRNScreenOrientation]) {
    return [super supportedInterfaceOrientations];
  }

  EXScreenOrientationRegistry *screenOrientationRegistry = (EXScreenOrientationRegistry *)[EXModuleRegistryProvider getSingletonModuleForClass:[EXScreenOrientationRegistry class]];
  if (screenOrientationRegistry && [screenOrientationRegistry requiredOrientationMask] > 0) {
    return [screenOrientationRegistry requiredOrientationMask];
  }
  
  return _defaultOrientationMask;
}

- (void)traitCollectionDidChange:(nullable UITraitCollection *)previousTraitCollection 
{
  [super traitCollectionDidChange:previousTraitCollection];
  if ((self.traitCollection.verticalSizeClass != previousTraitCollection.verticalSizeClass)
      || (self.traitCollection.horizontalSizeClass != previousTraitCollection.horizontalSizeClass)) {
    EXScreenOrientationRegistry *screenOrientationRegistryController = (EXScreenOrientationRegistry *)[EXModuleRegistryProvider getSingletonModuleForClass:[EXScreenOrientationRegistry class]];
    [screenOrientationRegistryController traitCollectionDidChangeTo:self.traitCollection];
  }
}

- (BOOL)shouldUseRNScreenOrientation
{
  Class screenWindowTraitsClass = NSClassFromString(@"RNSScreenWindowTraits");
  if ([screenWindowTraitsClass respondsToSelector:@selector(shouldAskScreensForScreenOrientationInViewController:)]) {
    id<EXScreenOrientationRNSScreenWindowTraits> screenWindowTraits = (id<EXScreenOrientationRNSScreenWindowTraits>)screenWindowTraitsClass;
    return [screenWindowTraits shouldAskScreensForScreenOrientationInViewController:self];
  }
  return NO;
}

@end
