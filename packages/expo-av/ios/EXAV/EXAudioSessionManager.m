// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ExpoModulesCore/EXDefines.h>

#import <EXAV/EXAudioSessionManager.h>

#import <EXAV/EXAV.h>

@interface EXAudioSessionManager ()

@property (nonatomic, assign) BOOL sessionIsActive;
@property (nonatomic, strong) NSString *activeCategory;
@property (nonatomic, assign) AVAudioSessionCategoryOptions activeOptions;

@property (nonatomic, strong) NSPointerArray *foregroundedModules;
@property (nonatomic, strong) NSMapTable<id, NSNumber *> *activeModules;
@property (nonatomic, strong) NSMapTable<id, NSString *> *moduleCategory;
@property (nonatomic, strong) NSMapTable<id, NSNumber *> *moduleCategoryOptions;

@end

@implementation EXAudioSessionManager

EX_REGISTER_SINGLETON_MODULE(AudioSessionManager);

- (instancetype)init
{
  if ((self = [super init])) {
    _sessionIsActive = NO;
    _foregroundedModules = [NSPointerArray weakObjectsPointerArray];
    _activeModules = [NSMapTable weakToStrongObjectsMapTable];
    _moduleCategory = [NSMapTable weakToStrongObjectsMapTable];
    _moduleCategoryOptions = [NSMapTable weakToStrongObjectsMapTable];

    AVAudioSession *session = [AVAudioSession sharedInstance];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAudioSessionInterruption:)
                                                 name:AVAudioSessionInterruptionNotification
                                               object:session];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleMediaServicesReset:)
                                                 name:AVAudioSessionMediaServicesWereResetNotification
                                               object:session];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)handleAudioSessionInterruption:(NSNotification *)notification
{
  for (id foregroundedModule in [_foregroundedModules allObjects]) {
    [foregroundedModule handleAudioSessionInterruption:notification];
  }
}

- (void)handleMediaServicesReset:(NSNotification *)notification
{
  for (id foregroundedModule in [_foregroundedModules allObjects]) {
    [foregroundedModule handleMediaServicesReset:notification];
  }
}

#pragma mark - EXAVScopedModuleDelegate

- (BOOL)isActiveForModule:(id)module {
  return [[_activeModules objectForKey:module] boolValue];
}

- (NSString *)activeCategory
{
  return [[AVAudioSession sharedInstance] category];
}

- (AVAudioSessionCategoryOptions)activeCategoryOptions
{
  return [[AVAudioSession sharedInstance] categoryOptions];
}

- (NSError *)setActive:(BOOL)active forModule:(id)module {
  BOOL prevActive = [self _shouldBeActive];

  if (active) {
    [_activeModules setObject:@(YES) forKey:module];
  } else {
    [_activeModules removeObjectForKey:module];
  }

  if (active != prevActive) {
    NSError *error = [self _updateSessionConfiguration];
    if (error && active) {
      [_activeModules removeObjectForKey:module];
    }
    return error;
  }
  return nil;
}

- (NSError *)setCategory:(NSString *)category withOptions:(AVAudioSessionCategoryOptions)options forModule:(id)module {
  NSString *overridenCategory = [_moduleCategory objectForKey:module];
  NSNumber *overridenOptions = [_moduleCategoryOptions objectForKey:module];

  [_moduleCategory setObject:category forKey:module];
  [_moduleCategoryOptions setObject:@(options) forKey:module];

  BOOL oldSettingsWerePresent = overridenCategory && overridenOptions;
  BOOL newSettingsAreDifferent = !oldSettingsWerePresent || ![overridenCategory isEqualToString:category] || ([overridenOptions unsignedIntegerValue] != options);

  if ([[_foregroundedModules allObjects] containsObject:module] && newSettingsAreDifferent) {
    return [self _updateSessionConfiguration];
  }
  return nil;
}

- (void)moduleDidBackground:(id)backgroundingModule
{
  for (int i = 0; i < _foregroundedModules.count; i++) {
    id pointer = [_foregroundedModules pointerAtIndex:i];
    if (pointer == (__bridge void * _Nullable)(backgroundingModule) || !pointer) {
      [_foregroundedModules removePointerAtIndex:i];
      i--;
    }
  }
  // compact doesn't work, that's why we need the `|| !pointer` above
  // http://www.openradar.me/15396578
  [_foregroundedModules compact];

  // Any possible failures are silent
  [self _updateSessionConfiguration];
}

- (void)moduleDidForeground:(id)module
{
  // Check if module was already foregrounded
  for (int i = 0; i < _foregroundedModules.count; i++) {
    id pointer = [_foregroundedModules pointerAtIndex:i];
    if (pointer == (__bridge void * _Nullable)(module)) {
      return;
    }
  }

  [_foregroundedModules addPointer:(__bridge void * _Nullable)(module)];

  // Any possible failures are silent
  [self _updateSessionConfiguration];
}

- (void)moduleWillDeallocate:(id)module
{
  // In case of reloading we won't get a notification about backgrounding,
  // but still we would like to start afresh with an inactive audio session.
  [self moduleDidBackground:module];
  [_activeModules removeObjectForKey:module];
  [_moduleCategory removeObjectForKey:module];
  [_moduleCategoryOptions removeObjectForKey:module];
}

# pragma mark - Utilities

- (NSError *)_updateSessionConfiguration
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSError *error;

  BOOL shouldBeActive = [self _shouldBeActive];
  NSString *category = [self _getRequestedCategory];
  AVAudioSessionCategoryOptions options = [self _getCategoryOptions];

  // If the session ought to be deactivated let's deactivate it and then configure.
  // And if the session should be activated, let's configure it first!

  if (!shouldBeActive && _sessionIsActive) {
    [session setActive:NO error:&error];
    if (!error) {
      _sessionIsActive = NO;
    }
  }

  if (error) {
    return error;
  }

  if (!_activeCategory || ![category isEqualToString:_activeCategory] || options != _activeOptions) {
    [session setCategory:category withOptions:options error:&error];
    if (!error) {
      _activeOptions = options;
      _activeCategory = category;
    }
  }

  if (error) {
    return error;
  }

  if (shouldBeActive && !_sessionIsActive) {
    [session setActive:YES error:&error];
    if (!error) {
      _sessionIsActive = YES;
    }
  }

  if (error) {
    return error;
  }

  return nil;
}

- (BOOL)_shouldBeActive
{
  for (id module in [_foregroundedModules allObjects]) {
    if ([[_activeModules objectForKey:module] boolValue]) {
      return YES;
    }
  }
  return NO;
}

- (NSString *)_getRequestedCategory
{
  NSArray *foregroundedModules = [_foregroundedModules allObjects];
  for (int i = (int) foregroundedModules.count - 1; i >= 0; i--) {
    NSString *category = [_moduleCategory objectForKey:foregroundedModules[i]];
    if (category) {
      return category;
    }
  }

  return AVAudioSessionCategorySoloAmbient;
}

- (AVAudioSessionCategoryOptions)_getCategoryOptions
{
  NSArray *foregroundedModules = [_foregroundedModules allObjects];
  for (int i = (int) foregroundedModules.count - 1; i >= 0; i--) {
    NSNumber *categoryOptions = [_moduleCategoryOptions objectForKey:foregroundedModules[i]];
    if (categoryOptions) {
      return [categoryOptions unsignedIntegerValue];
    }
  }

  return 0;
}

@end

