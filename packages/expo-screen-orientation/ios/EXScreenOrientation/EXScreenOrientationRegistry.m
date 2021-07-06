//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <EXScreenOrientation/EXScreenOrientationRegistry.h>
#import <EXScreenOrientation/EXScreenOrientationUtilities.h>
#import <UMCore/UMDefines.h>
#import <UMCore/UMUtilities.h>

@interface EXScreenOrientationRegistry ()

@property (nonatomic, assign) UIInterfaceOrientation currentScreenOrientation;
@property (nonatomic, strong) NSPointerArray *notificationListeners;
@property (nonatomic, strong) NSMapTable<id, NSNumber *> *moduleInterfaceMasks;
@property (nonatomic, weak) id foregroundedModule;
@property (nonatomic, weak, nullable) UITraitCollection *currentTraitCollection;
@property (nonatomic, assign) UIInterfaceOrientationMask lastOrientationMask;

@end

@implementation EXScreenOrientationRegistry

UM_REGISTER_SINGLETON_MODULE(ScreenOrientationRegistry)

- (instancetype)init
{
  if (self = [super init]) {
    _moduleInterfaceMasks =  [NSMapTable weakToStrongObjectsMapTable];
    _notificationListeners = [NSPointerArray weakObjectsPointerArray];
    _currentTraitCollection = nil;
    _currentScreenOrientation = 0;
    _lastOrientationMask = 0;
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(handleDeviceOrientationChange:)
                                                name:UIDeviceOrientationDidChangeNotification
                                              object:[UIDevice currentDevice]];

    dispatch_async(dispatch_get_main_queue(), ^{
      [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
    });
  }
  
  return self;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary<UIApplicationLaunchOptionsKey,id> *)launchOptions
{
  // application:didFinishLaunchingWithOptions should be executed on the main thread.
  // However, it's safer to ensure that we are on a good thread.
  UM_WEAKIFY(self);
  [UMUtilities performSynchronouslyOnMainThread:^{
    UM_ENSURE_STRONGIFY(self);
    if (@available(iOS 13, *)) {
      NSArray<UIWindow *> *windows = UIApplication.sharedApplication.windows;
      if (windows.count > 0) {
        self.currentScreenOrientation = windows[0].windowScene.interfaceOrientation;
      }
    } else {
      // statusBarOrientation was deprecated in iOS 13
      self.currentScreenOrientation = UIApplication.sharedApplication.statusBarOrientation;
    }
  }];
  
  return YES;
}

- (void)dealloc
{
  dispatch_sync(dispatch_get_main_queue(), ^{
    [[UIDevice currentDevice] endGeneratingDeviceOrientationNotifications];
  });
}

#pragma mark - affecting screen orientation

- (void)enforceDesiredDeviceOrientationWithOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  // if current sreen orientation isn't part of the mask, we have to change orientation to default one included in mask, in order up-left-right-down
  if (![EXScreenOrientationUtilities doesOrientationMask:orientationMask containOrientation:_currentScreenOrientation]) {
    __block UIInterfaceOrientation newOrientation = [EXScreenOrientationUtilities defaultOrientationForOrientationMask:orientationMask];
    if (newOrientation != UIInterfaceOrientationUnknown) {
      UM_WEAKIFY(self)
      dispatch_async(dispatch_get_main_queue(), ^{
        UM_STRONGIFY(self)
        [[UIDevice currentDevice] setValue:@(newOrientation) forKey:@"orientation"];
        [UIViewController attemptRotationToDeviceOrientation];
        if (self->_currentScreenOrientation == UIInterfaceOrientationUnknown) {
          [self screenOrientationDidChange:newOrientation];
        }
      });
    }
  }
}

- (void)setMask:(UIInterfaceOrientationMask)mask forModule:(id)module {
  [_moduleInterfaceMasks setObject:@(mask) forKey:module];
  if (_foregroundedModule == module) {
    [self enforceDesiredDeviceOrientationWithOrientationMask:mask];
  }
}

#pragma mark - getters

- (UIInterfaceOrientationMask)requiredOrientationMask
{
  // The app is moved to the foreground.
  if (!_foregroundedModule) {
    return _lastOrientationMask;
  }
  
  NSNumber *current = [_moduleInterfaceMasks objectForKey:_foregroundedModule];
  if (!current) {
    return 0;
  }
  
  return [current intValue];
}

- (UIInterfaceOrientationMask)currentOrientationMask
{
  __block UIInterfaceOrientationMask currentOrientationMask = [self requiredOrientationMask];
  [UMUtilities performSynchronouslyOnMainThread:^{
    currentOrientationMask = [[[[UIApplication sharedApplication] keyWindow] rootViewController] supportedInterfaceOrientations];
  }];
  return currentOrientationMask;
}

- (UIInterfaceOrientation)currentOrientation
{
  return _currentScreenOrientation;
}

- (UITraitCollection *)currentTrailCollection
{
  return _currentTraitCollection;
}

#pragma mark - events

- (void)handleDeviceOrientationChange:(NSNotification *)notification
{
  UIInterfaceOrientation newScreenOrientation = [EXScreenOrientationUtilities interfaceOrientationFromDeviceOrientation:[notification.object orientation]];
  [self interfaceOrientationDidChange:newScreenOrientation];
}

- (void)interfaceOrientationDidChange:(UIInterfaceOrientation)newScreenOrientation
{
  if (_currentScreenOrientation == newScreenOrientation || newScreenOrientation == UIInterfaceOrientationUnknown) {
    return;
  }
  
  UIInterfaceOrientationMask currentOrientationMask = [self currentOrientationMask];
  
  // checks if screen orientation should be changed when user rotates the device
  if ([EXScreenOrientationUtilities doesOrientationMask:currentOrientationMask containOrientation:newScreenOrientation]) {
    // change current screen orientation
    if ((UIInterfaceOrientationIsPortrait(newScreenOrientation) && UIInterfaceOrientationIsPortrait(_currentScreenOrientation))
        || (UIInterfaceOrientationIsLandscape(newScreenOrientation) && UIInterfaceOrientationIsLandscape(_currentScreenOrientation))) {
      _currentScreenOrientation = newScreenOrientation; // updates current screen orientation, but doesn't emit event
      return;
    }
    
    // on iPads, traitCollectionDidChange isn't triggered at all
    if ([EXScreenOrientationUtilities isIPad] &&
        ((UIInterfaceOrientationIsPortrait(newScreenOrientation) && UIInterfaceOrientationIsLandscape(_currentScreenOrientation))
         || (UIInterfaceOrientationIsLandscape(newScreenOrientation) && UIInterfaceOrientationIsPortrait(_currentScreenOrientation)))) {
      [self screenOrientationDidChange:newScreenOrientation];
    }
  }
}

- (void)traitCollectionDidChangeTo:(UITraitCollection *)traitCollection
{
  _currentTraitCollection = traitCollection;
  
  UIUserInterfaceSizeClass verticalSizeClass = traitCollection.verticalSizeClass;
  UIUserInterfaceSizeClass horizontalSizeClass = traitCollection.horizontalSizeClass;
  UIInterfaceOrientation currentDeviceOrientation = [EXScreenOrientationUtilities interfaceOrientationFromDeviceOrientation:[[UIDevice currentDevice] orientation]];
  UIInterfaceOrientationMask currentOrientationMask = [[[[UIApplication sharedApplication] keyWindow] rootViewController] supportedInterfaceOrientations];
   
  UIInterfaceOrientation newScreenOrientation = UIInterfaceOrientationUnknown;

  if (verticalSizeClass == UIUserInterfaceSizeClassRegular && horizontalSizeClass == UIUserInterfaceSizeClassCompact) {
    // From trait collection, we know that screen is in portrait or upside down orientation.
    UIInterfaceOrientationMask portraitMask = currentOrientationMask & (UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown);
    
    // Mask allows only proper portrait - we know that the device is in either proper portrait or upside down
    // we deduce it is proper portrait.
    if (portraitMask == UIInterfaceOrientationMaskPortrait) {
      newScreenOrientation = UIInterfaceOrientationPortrait;
    }
    // Mask allows only upside down portrait - we know that the device is in either proper portrait or upside down
    // we deduce it is upside down portrait.
    else if (portraitMask == UIInterfaceOrientationMaskPortraitUpsideDown) {
      newScreenOrientation = UIInterfaceOrientationPortraitUpsideDown;
    }
    // Mask allows portrait or upside down portrait - we can try to deduce orientation
    // from device orientation.
    else if (currentDeviceOrientation == UIInterfaceOrientationPortrait || currentDeviceOrientation == UIInterfaceOrientationPortraitUpsideDown) {
      newScreenOrientation = currentDeviceOrientation;
    }
  } else if ((verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassCompact)
            || (verticalSizeClass == UIUserInterfaceSizeClassRegular && horizontalSizeClass == UIUserInterfaceSizeClassRegular)
            || (verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassRegular)) {
    // From trait collection, we know that screen is in landspace left or right orientation.
    UIInterfaceOrientationMask landscapeMask = currentOrientationMask & UIInterfaceOrientationMaskLandscape;
    
    // Mask allows only proper landspace - we know that the device is in either proper landspace left or right
    // we deduce it is proper left.
    if (landscapeMask == UIInterfaceOrientationMaskLandscapeLeft) {
       newScreenOrientation = UIInterfaceOrientationLandscapeLeft;
    }
    // Mask allows only upside down portrait - we know that the device is in either proper portrait or upside down
    // we deduce it is upside right.
    else if (landscapeMask == UIInterfaceOrientationMaskLandscapeRight) {
      newScreenOrientation = UIInterfaceOrientationLandscapeRight;
    }
    // Mask allows landspace left or right - we can try to deduce orientation
    // from device orientation.
    else if (currentDeviceOrientation == UIInterfaceOrientationLandscapeLeft
               || currentDeviceOrientation == UIInterfaceOrientationLandscapeRight) {
      newScreenOrientation = currentDeviceOrientation;
    }
  }
  [self screenOrientationDidChange:newScreenOrientation];
}

-(void)screenOrientationDidChange:(UIInterfaceOrientation)newScreenOrientation {
  _currentScreenOrientation = newScreenOrientation;
  for (id module in [_notificationListeners allObjects]) {
    [module screenOrientationDidChange:newScreenOrientation];
  }
}

#pragma mark - lifecycle

- (void)moduleDidForeground:(id)module
{
  _foregroundedModule = module;
  [self enforceDesiredDeviceOrientationWithOrientationMask:[self currentOrientationMask]];
}

- (void)moduleDidBackground:(id)module
{
  if (_foregroundedModule == module) {
    // We save the mask to restore it when the app moves to the foreground.
    // We don't want to wait for the module to call moduleDidForeground, cause it will add unnecessary rotation.
    _lastOrientationMask = [self requiredOrientationMask];
    _foregroundedModule = nil;
  }
}

- (void)moduleWillDeallocate:(id)module
{
  [_moduleInterfaceMasks removeObjectForKey:module];
}

- (void)registerModuleToReceiveNotification:(id<EXOrientationListener>)module
{
  [_notificationListeners addPointer:(__bridge void * _Nullable)(module)];
}

- (void)unregisterModuleFromReceivingNotification:(id<EXOrientationListener>)module
{
  for (int i = 0; i < _notificationListeners.count; i++) {
    id pointer = [_notificationListeners pointerAtIndex:i];
    if (pointer == (__bridge void * _Nullable)(module) || !pointer) {
      [_notificationListeners removePointerAtIndex:i];
      i--;
    }
  }
  [_notificationListeners compact];
}

@end
