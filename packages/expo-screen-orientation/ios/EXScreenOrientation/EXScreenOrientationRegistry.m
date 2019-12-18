//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <EXScreenOrientation/EXScreenOrientationRegistry.h>
#import <EXScreenOrientation/EXScreenOrientationUtilities.h>
#import <UMCore/UMDefines.h>

@interface EXScreenOrientationRegistry ()

@property (nonatomic, assign) BOOL isGeneratingDeviceOrientationNotifications;
@property (nonatomic, assign) UIInterfaceOrientation currentScreenOrientation;
@property (nonatomic, strong) NSPointerArray *notificationReceiver;
@property (nonatomic, strong) NSMapTable<id, NSNumber *> *moduleMask;
@property (nonatomic, weak) id foregrounded;

@end

@implementation EXScreenOrientationRegistry

UM_REGISTER_SINGLETON_MODULE(ScreenOrientationRegistry)

- (instancetype)init
{
  if (self = [super init]) {
    _moduleMask =  [NSMapTable weakToStrongObjectsMapTable];
    _notificationReceiver = [NSPointerArray weakObjectsPointerArray];
    _isGeneratingDeviceOrientationNotifications = false;
  
    UM_WEAKIFY(self)
    dispatch_async(dispatch_get_main_queue(), ^{
      UM_STRONGIFY(self);
      if (![[UIDevice currentDevice] isGeneratingDeviceOrientationNotifications]) {
        [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
        self->_isGeneratingDeviceOrientationNotifications = true;
      }
    });
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleDeviceOrientationChange:)
                                                 name:UIDeviceOrientationDidChangeNotification
                                               object:[UIDevice currentDevice]];
  }
  
  return self;
}

- (void)dealloc
{
  if (_isGeneratingDeviceOrientationNotifications) {
    dispatch_sync(dispatch_get_main_queue(), ^{
      [[UIDevice currentDevice] endGeneratingDeviceOrientationNotifications];
    });
  }
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
  [_moduleMask setObject:@(mask) forKey:module];
  if (_foregrounded == module) {
    [self enforceDesiredDeviceOrientationWithOrientationMask:mask];
  }
}

#pragma mark - getters

- (UIInterfaceOrientationMask)foregroundedOrientationMask
{
  NSNumber *current = [_moduleMask objectForKey:_foregrounded];
  if (!current) {
    return 0;
  }
  
  return [current intValue];
}

- (UIInterfaceOrientationMask)currentOrientationMask
{
  __block UIInterfaceOrientationMask currentOrientationMask = [self foregroundedOrientationMask];
  if (!currentOrientationMask) {
    dispatch_block_t onMain = ^{
      currentOrientationMask = [[[[UIApplication sharedApplication] keyWindow] rootViewController] supportedInterfaceOrientations];
    };

    if ([NSThread isMainThread]) {
      onMain();
    } else {
      dispatch_sync(dispatch_get_main_queue(), onMain);
    }
  }
  return currentOrientationMask;
}

- (UIInterfaceOrientation)currentOrientation
{
  return _currentScreenOrientation;
}

#pragma mark - events

- (void)handleDeviceOrientationChange:(NSNotification *)notification
{
  UIInterfaceOrientation newScreenOrientation = [EXScreenOrientationUtilities UIDeviceOrientationToUIInterfaceOrientation:[notification.object orientation]];
  [self deviceOrientationDidChange:newScreenOrientation];
}

- (void)deviceOrientationDidChange:(UIInterfaceOrientation)newScreenOrientation
{
  if (_currentScreenOrientation == newScreenOrientation || newScreenOrientation == UIInterfaceOrientationUnknown) {
    return;
  }
  
  UIInterfaceOrientationMask currentOrientationMask = [self currentOrientationMask];
  
  // checks if screen orientation should be changed when user rotates the device
  if ([EXScreenOrientationUtilities doesOrientationMask:currentOrientationMask containOrientation:newScreenOrientation]) {
    // emit event if screen orientation was changed, but traitCollectionsDidChange will not be triggered
    if ([EXScreenOrientationUtilities doesDeviceSizeClassesAreEqual]
        || (UIInterfaceOrientationIsPortrait(newScreenOrientation) && UIInterfaceOrientationIsPortrait(_currentScreenOrientation))
        || (UIInterfaceOrientationIsLandscape(newScreenOrientation) && UIInterfaceOrientationIsLandscape(_currentScreenOrientation))) {
      [self screenOrientationDidChange:newScreenOrientation];
    }
  }
}

- (void)traitCollectionsDidChange:(UITraitCollection *)traitCollection
{
  UIUserInterfaceSizeClass verticalSizeClass = traitCollection.verticalSizeClass;
  UIUserInterfaceSizeClass horizontalSizeClass = traitCollection.horizontalSizeClass;
  UIInterfaceOrientation currentDeviceOrientation = [EXScreenOrientationUtilities UIDeviceOrientationToUIInterfaceOrientation:[[UIDevice currentDevice]  orientation]];
  UIInterfaceOrientationMask currentOrientationMask = [[[[UIApplication sharedApplication] keyWindow] rootViewController] supportedInterfaceOrientations];
   
  UIInterfaceOrientation newScreenOrientation = UIInterfaceOrientationUnknown;

  if (verticalSizeClass == UIUserInterfaceSizeClassRegular && horizontalSizeClass == UIUserInterfaceSizeClassCompact) {
    // portrait
    UIInterfaceOrientationMask portraitMask = currentOrientationMask & UIInterfaceOrientationPortrait;
    if (portraitMask == UIInterfaceOrientationMaskPortrait) {
      newScreenOrientation = UIInterfaceOrientationPortrait;
    } else if (portraitMask == UIInterfaceOrientationMaskPortraitUpsideDown) {
      newScreenOrientation = UIInterfaceOrientationPortraitUpsideDown;
    } else if (currentDeviceOrientation == UIInterfaceOrientationPortrait || currentDeviceOrientation == UIInterfaceOrientationPortraitUpsideDown) {
      newScreenOrientation = currentDeviceOrientation;
    }
  } else if ((verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassCompact)
              || (verticalSizeClass == UIUserInterfaceSizeClassCompact && horizontalSizeClass == UIUserInterfaceSizeClassRegular)){
     // landscape
      UIInterfaceOrientationMask landscapeMask = currentOrientationMask & UIInterfaceOrientationMaskLandscape;
     if (landscapeMask == UIInterfaceOrientationMaskLandscapeLeft) {
       newScreenOrientation = UIInterfaceOrientationLandscapeLeft;
     } else if (landscapeMask == UIInterfaceOrientationMaskLandscapeRight) {
       newScreenOrientation = UIInterfaceOrientationLandscapeRight;
     } else if (currentDeviceOrientation == UIInterfaceOrientationLandscapeLeft
                || currentDeviceOrientation == UIInterfaceOrientationLandscapeRight) {
       newScreenOrientation = currentDeviceOrientation;
     }
  }
  [self screenOrientationDidChange:newScreenOrientation];
}

-(void)screenOrientationDidChange:(UIInterfaceOrientation)newScreenOrientation {
  _currentScreenOrientation = newScreenOrientation;
  for (id module in [_notificationReceiver allObjects]) {
    [module screenOrientationDidChange:newScreenOrientation];
  }
}

#pragma mark - lifecycle

- (void)moduleDidForeground:(id)module
{
  _foregrounded = module;
  [self enforceDesiredDeviceOrientationWithOrientationMask:[self currentOrientationMask]];
}

- (void)moduleDidBackground:(id)module
{
  if (_foregrounded == module) {
    _foregrounded = nil;
  }
}

- (void)moduleWillDeallocate:(id)module
{
  [_moduleMask removeObjectForKey:module];
  
  for (int i = 0; i < _notificationReceiver.count; i++) {
    id pointer = [_notificationReceiver pointerAtIndex:i];
    if (pointer == (__bridge void * _Nullable)(module) || !pointer) {
      [_notificationReceiver removePointerAtIndex:i];
      i--;
    }
  }
  [_notificationReceiver compact];
}

- (void)registerModuleToReceiveNotification:(id)module
{
  [_notificationReceiver addPointer:(__bridge void * _Nullable)(module)];
}

@end
