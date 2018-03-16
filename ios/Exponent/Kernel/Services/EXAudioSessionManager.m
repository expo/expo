// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <React/RCTLog.h>

#import "EXAudioSessionManager.h"
#import "EXUnversioned.h"

NSString * const EXAudioSessionManagerErrorDomain = @"EXAudioSessionManager";

@interface EXAudioSessionManager ()

@property (nonatomic, assign) BOOL sessionIsActive;
@property (nonatomic, strong) NSString *activeCategory;
@property (nonatomic, assign) AVAudioSessionCategoryOptions activeOptions;

@property (nonatomic, weak) id activeScopedModule;
@property (nonatomic, strong) NSMutableSet<id> *allModules;
@property (nonatomic, strong) NSMutableSet<NSString *> *activeModules;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSString *> *moduleCategory;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSNumber *> *moduleCategoryOptions;

@end

@implementation EXAudioSessionManager

- (instancetype)init
{
  if ((self = [super init])) {
    _sessionIsActive = NO;
    _allModules = [[NSMutableSet alloc] init];
    _activeModules = [[NSMutableSet alloc] init];
    _moduleCategory = [[NSMutableDictionary alloc] init];
    _moduleCategoryOptions = [[NSMutableDictionary alloc] init];

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
  if (_activeScopedModule) {
    [_activeScopedModule handleAudioSessionInterruption:notification];
  }
}

- (void)handleMediaServicesReset:(NSNotification *)notification
{
  for (id scopedModule in _allModules) {
    [scopedModule handleMediaServicesReset:notification];
  }
}

#pragma mark - EXAVScopedModuleDelegate

- (NSError *)setActive:(BOOL)active forScopedModule:(id)scopedModule {
  NSString *experienceId = [EXScopedEventEmitter getExperienceIdFromEventEmitter:scopedModule];
  if (!experienceId) {
    return [self _getNoExperienceIdError];
  }

  BOOL overridenActive = [_activeModules containsObject:experienceId];

  if (active) {
    [_activeModules addObject:experienceId];
  } else {
    [_activeModules removeObject:experienceId];
  }

  if (_activeScopedModule == scopedModule && active != overridenActive) {
    return [self _updateSessionConfigurationForScopedModule:scopedModule];
  }
  return nil;
}

- (NSError *)setCategory:(NSString *)category withOptions:(AVAudioSessionCategoryOptions)options forScopedModule:(id)scopedModule {
  NSString *experienceId = [EXScopedEventEmitter getExperienceIdFromEventEmitter:scopedModule];
  if (!experienceId) {
    return [self _getNoExperienceIdError];
  }

  NSString *overridenCategory = [_moduleCategory objectForKey:experienceId];
  NSNumber *overridenOptions = [_moduleCategoryOptions objectForKey:experienceId];

  [_moduleCategory setObject:category forKey:experienceId];
  [_moduleCategoryOptions setObject:@(options) forKey:experienceId];

  BOOL oldSettingsWerePresent = overridenCategory && overridenOptions;
  BOOL newSettingsAreDifferent = !oldSettingsWerePresent || ![overridenCategory isEqualToString:category] || ([overridenOptions unsignedIntegerValue] != options);

  if (_activeScopedModule == scopedModule && newSettingsAreDifferent) {
    return [self _updateSessionConfigurationForScopedModule:scopedModule];
  }
  return nil;
}

- (void)scopedModuleDidBackground:(id)scopedModule
{
  if (_activeScopedModule == scopedModule) {
    _activeScopedModule = nil;
  }

  // Any possible failures are silent
  [self _updateSessionConfigurationForScopedModule:_activeScopedModule];
}

- (void)scopedModuleDidForeground:(id)scopedModule
{
  _activeScopedModule = scopedModule;
  [_allModules addObject:scopedModule];

  // Any possible failures are silent
  [self _updateSessionConfigurationForScopedModule:_activeScopedModule];
}

- (void)scopedModuleWillDeallocate:(id)scopedModule
{
  // In case of reloading we won't get a notification about backgrounding,
  // but still we would like to start afresh with an inactive audio session.
  if (scopedModule == _activeScopedModule) {
    [self scopedModuleDidBackground:scopedModule];
  }

  NSString *experienceId = [EXScopedEventEmitter getExperienceIdFromEventEmitter:scopedModule];
  [_allModules removeObject:scopedModule];
  [_activeModules removeObject:experienceId];
  [_moduleCategory removeObjectForKey:experienceId];
  [_moduleCategoryOptions removeObjectForKey:experienceId];
}

# pragma mark - Utilities

- (NSError *)_updateSessionConfigurationForScopedModule:(id)scopedModule
{
  NSString *experienceId = [EXScopedEventEmitter getExperienceIdFromEventEmitter:scopedModule];

  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSError *error;

  BOOL shouldBeActive = [_activeModules containsObject:experienceId];
  NSString *category = [self _getRequestedCategoryForScopedModule:scopedModule];
  AVAudioSessionCategoryOptions options = [self _getCategoryOptionsForScopedModule:scopedModule];

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

- (NSString *)_getRequestedCategoryForScopedModule:(id)scopedModule
{
  NSString *experienceId = [EXScopedEventEmitter getExperienceIdFromEventEmitter:scopedModule];
  NSString *category = [_moduleCategory objectForKey:experienceId];
  if (category) {
    return category;
  }
  return AVAudioSessionCategorySoloAmbient;
}

- (AVAudioSessionCategoryOptions)_getCategoryOptionsForScopedModule:(id)scopedModule
{
  NSString *experienceId = [EXScopedEventEmitter getExperienceIdFromEventEmitter:scopedModule];
  NSNumber *categoryOptions = [_moduleCategoryOptions objectForKey:experienceId];
  if (categoryOptions) {
    return [categoryOptions unsignedIntegerValue];
  }
  return 0;
}

- (NSError *)_getNoExperienceIdError
{
  return [NSError errorWithDomain:EXAudioSessionManagerErrorDomain
                             code:EXAudioSessionManagerErrorCodeNoExperienceId
                         userInfo:@{
                                    NSLocalizedDescriptionKey: @"Experience requesting Audio Session changes has no ID"
                                    }];
}

@end

