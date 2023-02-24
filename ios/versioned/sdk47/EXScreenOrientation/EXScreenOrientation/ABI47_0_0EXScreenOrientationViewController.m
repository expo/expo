// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryProvider.h>

#import <ABI47_0_0EXScreenOrientation/ABI47_0_0EXScreenOrientationViewController.h>
#import <ABI47_0_0EXScreenOrientation/ABI47_0_0EXScreenOrientationRegistry.h>
#import <ABI47_0_0EXScreenOrientation/NSString+UIInterfaceOrientationMask.h>

NSString *const ABI47_0_0EXDefaultScreenOrientationMask = @"ABI47_0_0EXDefaultScreenOrientationMask";

// copy of RNScreens protocol
@protocol ABI47_0_0EXScreenOrientationRNSScreenWindowTraits

+ (BOOL)shouldAskScreensForScreenOrientationInViewController:(UIViewController *)vc;

@end

@interface ABI47_0_0EXScreenOrientationViewController ()

@property (nonatomic, assign) UIInterfaceOrientationMask defaultOrientationMask;

@end

@implementation ABI47_0_0EXScreenOrientationViewController

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
  NSString *plistValue = [NSBundle.mainBundle objectForInfoDictionaryKey:ABI47_0_0EXDefaultScreenOrientationMask];
  if (plistValue != nil) {
    @try {
      UIInterfaceOrientationMask mask = [plistValue toUIInterfaceOrientationMask];
      return [self initWithDefaultScreenOrientationMask:mask];
    } @catch (NSException *exception) {
      ABI47_0_0EXLogError(@"Invalid `%@` value in Info.plist, expected: one of `UIInterfaceOrientationMask` value, got: \"%@\".", ABI47_0_0EXDefaultScreenOrientationMask, plistValue);
    }
  }
  return [self init];
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  if ([self shouldUseRNScreenOrientation]) {
    return [super supportedInterfaceOrientations];
  }

  ABI47_0_0EXScreenOrientationRegistry *screenOrientationRegistry = (ABI47_0_0EXScreenOrientationRegistry *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:[ABI47_0_0EXScreenOrientationRegistry class]];
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
    ABI47_0_0EXScreenOrientationRegistry *screenOrientationRegistryController = (ABI47_0_0EXScreenOrientationRegistry *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:[ABI47_0_0EXScreenOrientationRegistry class]];
    [screenOrientationRegistryController traitCollectionDidChangeTo:self.traitCollection];
  }
}

- (BOOL)shouldUseRNScreenOrientation
{
  Class screenWindowTraitsClass = NSClassFromString(@"RNSScreenWindowTraits");
  if ([screenWindowTraitsClass respondsToSelector:@selector(shouldAskScreensForScreenOrientationInViewController:)]) {
    id<ABI47_0_0EXScreenOrientationRNSScreenWindowTraits> screenWindowTraits = (id<ABI47_0_0EXScreenOrientationRNSScreenWindowTraits>)screenWindowTraitsClass;
    return [screenWindowTraits shouldAskScreensForScreenOrientationInViewController:self];
  }
  return NO;
}

@end
