// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#import <React/RCTUtils.h>

#import "EXAV.h"
#import "EXAVPlayerData.h"
#import "EXFileSystem.h"
#import "EXVideoView.h"
#import "EXUnversioned.h"
#import "EXAudioRecordingPermissionRequester.h"
#import "EXPermissions.h"
#import "EXScopedModuleRegistry.h"

NSString *const EXAudioRecordingOptionsKey = @"ios";
NSString *const EXAudioRecordingOptionExtensionKey = @"extension";
NSString *const EXAudioRecordingOptionOutputFormatKey = @"outputFormat";
NSString *const EXAudioRecordingOptionAudioQualityKey = @"audioQuality";
NSString *const EXAudioRecordingOptionSampleRateKey = @"sampleRate";
NSString *const EXAudioRecordingOptionNumberOfChannelsKey = @"numberOfChannels";
NSString *const EXAudioRecordingOptionBitRateKey = @"bitRate";
NSString *const EXAudioRecordingOptionBitRateStrategyKey = @"bitRateStrategy";
NSString *const EXAudioRecordingOptionBitDepthHintKey = @"bitDepthHint";
NSString *const EXAudioRecordingOptionLinearPCMBitDepthKey = @"linearPCMBitDepth";
NSString *const EXAudioRecordingOptionLinearPCMIsBigEndianKey = @"linearPCMIsBigEndian";
NSString *const EXAudioRecordingOptionLinearPCMIsFloatKey = @"linearPCMIsFloat";

NSString *const EXDidUpdatePlaybackStatusEventName = @"didUpdatePlaybackStatus";

@interface EXAV ()

@property (nonatomic, weak) id kernelAudioSessionManagerDelegate;
@property (nonatomic, weak) id kernelPermissionsServiceDelegate;

@property (nonatomic, assign) BOOL audioIsEnabled;
@property (nonatomic, assign) EXAVAudioSessionMode currentAudioSessionMode;
@property (nonatomic, assign) BOOL isBackgrounded;

@property (nonatomic, assign) EXAudioInterruptionMode audioInterruptionMode;
@property (nonatomic, assign) BOOL playsInSilentMode;
@property (nonatomic, assign) BOOL allowsAudioRecording;

@property (nonatomic, assign) int soundDictionaryKeyCount;
@property (nonatomic, strong) NSMutableDictionary <NSNumber *, EXAVPlayerData *> *soundDictionary;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, strong) NSMutableSet <NSObject<EXAVObject> *> *videoSet;

@property (nonatomic, strong) NSString *audioRecorderFilename;
@property (nonatomic, strong) NSDictionary *audioRecorderSettings;
@property (nonatomic, strong) AVAudioRecorder *audioRecorder;
@property (nonatomic, assign) BOOL audioRecorderIsPreparing;
@property (nonatomic, assign) BOOL audioRecorderShouldBeginRecording;
@property (nonatomic, assign) int audioRecorderDurationMillis;

@end

@implementation EXAV

@synthesize methodQueue = _methodQueue;

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegates:(NSDictionary *)kernelServiceInstances params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegates:kernelServiceInstances params:params]) {
    _audioIsEnabled = YES;
    _currentAudioSessionMode = EXAVAudioSessionModeInactive;
    _isBackgrounded = NO;
    
    _audioInterruptionMode = EXAudioInterruptionModeMixWithOthers;
    _playsInSilentMode = false;
    _allowsAudioRecording = false;
    
    _soundDictionaryKeyCount = 0;
    _soundDictionary = [NSMutableDictionary new];
    _isBeingObserved = NO;
    _videoSet = [NSMutableSet new];
    
    _audioRecorderFilename = nil;
    _audioRecorderSettings = nil;
    _audioRecorder = nil;
    _audioRecorderIsPreparing = false;
    _audioRecorderShouldBeginRecording = false;
    _audioRecorderDurationMillis = 0;

    _kernelPermissionsServiceDelegate = kernelServiceInstances[@"PermissionsManager"];
    _kernelAudioSessionManagerDelegate = kernelServiceInstances[@"AudioSessionManager"];
    [_kernelAudioSessionManagerDelegate scopedModuleDidForeground:self];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

#pragma mark - Expo experience lifecycle

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

- (void)_bridgeDidForeground:(NSNotification *)notification
{
  [_kernelAudioSessionManagerDelegate scopedModuleDidForeground:self];
  _isBackgrounded = NO;
  
  [self _runBlockForAllAVObjects:^(NSObject<EXAVObject> *exAVObject) {
    [exAVObject bridgeDidForeground:notification];
  }];
}

- (void)_bridgeDidBackground:(NSNotification *)notification
{
  _isBackgrounded = YES;
  [self _deactivateAudioSession]; // This will pause all players and stop all recordings
  
  [self _runBlockForAllAVObjects:^(NSObject<EXAVObject> *exAVObject) {
    [exAVObject bridgeDidBackground:notification];
  }];
  [_kernelAudioSessionManagerDelegate scopedModuleDidBackground:self];
}

#pragma mark - RCTEventEmitter

- (void)startObserving
{
  _isBeingObserved = YES;
}

- (void)stopObserving
{
  _isBeingObserved = NO;
}

#pragma mark - Global audio state control API

- (void)registerVideoForAudioLifecycle:(NSObject<EXAVObject> *)video
{
  [_videoSet addObject:video];
}

- (void)unregisterVideoForAudioLifecycle:(NSObject<EXAVObject> *)video
{
  [_videoSet removeObject:video];
}

- (void)_runBlockForAllAVObjects:(void (^)(NSObject<EXAVObject> *exAVObject))block
{
  for (EXAVPlayerData *data in [_soundDictionary allValues]) {
    block(data);
  }
  for (NSObject<EXAVObject> *video in [_videoSet allObjects]) {
    block(video);
  }
}

// This method is placed here so that it is easily referrable from _setAudioSessionCategoryForAudioMode.
- (NSError *)_setAudioMode:(NSDictionary *)mode
{
  BOOL playsInSilentMode = ((NSNumber *)mode[@"playsInSilentModeIOS"]).boolValue;
  EXAudioInterruptionMode interruptionMode = ((NSNumber *)mode[@"interruptionModeIOS"]).intValue;
  BOOL allowsRecording = ((NSNumber *)mode[@"allowsRecordingIOS"]).boolValue;
  
  if (!playsInSilentMode && interruptionMode == EXAudioInterruptionModeDuckOthers) {
    return RCTErrorWithMessage(@"Impossible audio mode: playsInSilentMode and duckOthers cannot both be set on iOS.");
  } else if (!playsInSilentMode && allowsRecording) {
    return RCTErrorWithMessage(@"Impossible audio mode: playsInSilentMode and allowsRecording cannot both be set on iOS.");
  } else {
    if (!allowsRecording) {
      if (_audioRecorder && [_audioRecorder isRecording]) {
        [_audioRecorder pause];
      }
    }
    
    _playsInSilentMode = playsInSilentMode;
    _audioInterruptionMode = interruptionMode;
    _allowsAudioRecording = allowsRecording;
    
    if (_currentAudioSessionMode != EXAVAudioSessionModeInactive) {
      return [self _updateAudioSessionCategoryForAudioSessionMode:[self _getAudioSessionModeRequired]];
    }
    return nil;
  }
}

- (NSError *)_updateAudioSessionCategoryForAudioSessionMode:(EXAVAudioSessionMode)audioSessionMode
{
  NSError *error;
  EXAudioInterruptionMode activeInterruptionMode = audioSessionMode == EXAVAudioSessionModeActiveMuted
    ? EXAudioInterruptionModeMixWithOthers : _audioInterruptionMode;
  
  if (!_playsInSilentMode) {
    // _allowsRecording is guaranteed to be false, and _interruptionMode is guaranteed to not be EXAudioInterruptionModeDuckOthers (see above)
    if (_audioInterruptionMode == EXAudioInterruptionModeDoNotMix) {
      error = [_kernelAudioSessionManagerDelegate setCategory:AVAudioSessionCategorySoloAmbient withOptions:0 forScopedModule:self];
    } else {
      error = [_kernelAudioSessionManagerDelegate setCategory:AVAudioSessionCategoryAmbient withOptions:0 forScopedModule:self];
    }
  } else {
    NSString *category = _allowsAudioRecording ? AVAudioSessionCategoryPlayAndRecord : AVAudioSessionCategoryPlayback;
    switch (activeInterruptionMode) {
      case EXAudioInterruptionModeDoNotMix:
        error = [_kernelAudioSessionManagerDelegate setCategory:category withOptions:0 forScopedModule:self];
        break;
      case EXAudioInterruptionModeDuckOthers:
        error = [_kernelAudioSessionManagerDelegate setCategory:category withOptions:AVAudioSessionCategoryOptionDuckOthers forScopedModule:self];
        break;
      case EXAudioInterruptionModeMixWithOthers:
      default:
        error = [_kernelAudioSessionManagerDelegate setCategory:category withOptions:AVAudioSessionCategoryOptionMixWithOthers forScopedModule:self];
        break;
    }
  }
  return error;
}

- (EXAVAudioSessionMode)_getAudioSessionModeRequired
{
  __block EXAVAudioSessionMode audioSessionModeRequired = EXAVAudioSessionModeInactive;
  
  [self _runBlockForAllAVObjects:^(NSObject<EXAVObject> *exAVObject) {
    EXAVAudioSessionMode audioSessionModeRequiredByThisObject = [exAVObject getAudioSessionModeRequired];
    if (audioSessionModeRequiredByThisObject > audioSessionModeRequired) {
      audioSessionModeRequired = audioSessionModeRequiredByThisObject;
    }
  }];
  
  if (_audioRecorder) {
    if (_audioRecorderShouldBeginRecording || [_audioRecorder isRecording]) {
      audioSessionModeRequired = EXAVAudioSessionModeActive;
    } else if (_audioRecorderIsPreparing && audioSessionModeRequired == EXAVAudioSessionModeInactive) {
      audioSessionModeRequired = EXAVAudioSessionModeActiveMuted;
    }
  }
  
  return audioSessionModeRequired;
}

- (NSError *)promoteAudioSessionIfNecessary
{
  if (!_audioIsEnabled) {
    return RCTErrorWithMessage(@"Expo Audio is disabled, so the audio session could not be activated.");
  }
  if (_isBackgrounded) {
    return RCTErrorWithMessage(@"This experience is currently in the background, so the audio session could not be activated.");
  }
  
  EXAVAudioSessionMode audioSessionModeRequired = [self _getAudioSessionModeRequired];
  
  if (audioSessionModeRequired == EXAVAudioSessionModeInactive) {
    return nil;
  }
  
  NSError *error;

  error = [self _updateAudioSessionCategoryForAudioSessionMode:audioSessionModeRequired];
  if (error) {
    return error;
  }

  error = [_kernelAudioSessionManagerDelegate setActive:YES forScopedModule:self];
  if (error) {
    return error;
  }
  
  _currentAudioSessionMode = audioSessionModeRequired;
  return nil;
}

- (NSError *)_deactivateAudioSession
{
  if (_currentAudioSessionMode == EXAVAudioSessionModeInactive) {
    return nil;
  }
  
  // We must have all players, recorders, and videos paused in order to effectively deactivate the session.
  [self _runBlockForAllAVObjects:^(NSObject<EXAVObject> *exAVObject) {
    [exAVObject pauseImmediately];
  }];
  if (_audioRecorder && [_audioRecorder isRecording]) {
    [_audioRecorder pause];
  }
  
  NSError *error = [_kernelAudioSessionManagerDelegate setActive:NO forScopedModule:self];

  if (!error) {
    _currentAudioSessionMode = EXAVAudioSessionModeInactive;
  }
  return error;
}

- (NSError *)demoteAudioSessionIfPossible
{
  EXAVAudioSessionMode audioSessionModeRequired = [self _getAudioSessionModeRequired];
  
  // Current audio session mode is lower than the required one
  // (we should rather promote the session than demote it).
  if (_currentAudioSessionMode <= audioSessionModeRequired) {
    return nil;
  }
  
  // We require the session to be muted and it is active.
  // Let's only update the category.
  if (audioSessionModeRequired == EXAVAudioSessionModeActiveMuted) {
    NSError *error = [self _updateAudioSessionCategoryForAudioSessionMode:audioSessionModeRequired];
    if (!error) {
      _currentAudioSessionMode = EXAVAudioSessionModeActiveMuted;
    }
    return error;
  }

  // We require the session to be inactive and it is active, let's deactivate it!
  return [self _deactivateAudioSession];
}

- (void)handleAudioSessionInterruption:(NSNotification *)notification
{
  NSNumber *interruptionType = [[notification userInfo] objectForKey:AVAudioSessionInterruptionTypeKey];
  if (interruptionType.unsignedIntegerValue == AVAudioSessionInterruptionTypeBegan) {
    _currentAudioSessionMode = EXAVAudioSessionModeInactive;
  }
  
  [self _runBlockForAllAVObjects:^(NSObject<EXAVObject> *exAVObject) {
    [exAVObject handleAudioSessionInterruption:notification];
  }];
}

- (void)handleMediaServicesReset:(NSNotification *)notification
{
  // See here: https://developer.apple.com/library/content/qa/qa1749/_index.html
  // (this is an unlikely notification to receive, but best practices suggests that we catch it just in case)
  
  _currentAudioSessionMode = EXAVAudioSessionModeInactive;
  
  [self _runBlockForAllAVObjects:^(NSObject<EXAVObject> *exAVObject) {
    [exAVObject handleMediaServicesReset:nil];
  }];
  
  if (_audioRecorder) {
    [self _removeAudioRecorder:NO];
    [self _createNewAudioRecorder];
    [_audioRecorder prepareToRecord];
  }
}

#pragma mark - Internal sound playback helper methods

- (void)_runBlock:(void (^)(EXAVPlayerData *data))block
  withSoundForKey:(nonnull NSNumber *)key
     withRejecter:(RCTPromiseRejectBlock)reject
{
  EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    block(data);
  } else {
    reject(@"E_AUDIO_NOPLAYER", nil, RCTErrorWithMessage(@"Player does not exist."));
  }
}

- (void)_removeSoundForKey:(NSNumber *)key
{
  EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    [data pauseImmediately];
    [self demoteAudioSessionIfPossible];
  }
  _soundDictionary[key] = nil;
}

#pragma mark - Internal video playback helper method

- (void)_runBlock:(void (^)(EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)reactTag
     withRejecter:(RCTPromiseRejectBlock)reject
{
  // TODO check that the bridge is still valid after the dispatch
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView *view = [self.bridge.uiManager viewForReactTag:reactTag];
    if ([view isKindOfClass:[EXVideoView class]]) {
      dispatch_async(RCTGetUIManagerQueue(), ^{
        block((EXVideoView *)view);
      });
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Invalid view returned from registry, expecting EXVideo, got: %@", view];
      reject(@"E_VIDEO_TAGINCORRECT", nil, RCTErrorWithMessage(errorMessage));
    }
  });
}

#pragma mark - Internal audio recording helper methods

- (NSString *)_getBitRateStrategyFromEnum:(NSNumber *)bitRateEnumSelected
{
  if (bitRateEnumSelected) {
    switch ([bitRateEnumSelected integerValue]) {
      case EXAudioRecordingOptionBitRateStrategyConstant:
        return AVAudioBitRateStrategy_Constant;
      case EXAudioRecordingOptionBitRateStrategyLongTermAverage:
        return AVAudioBitRateStrategy_LongTermAverage;
      case EXAudioRecordingOptionBitRateStrategyVariableConstrained:
        return AVAudioBitRateStrategy_VariableConstrained;
        break;
      case EXAudioRecordingOptionBitRateStrategyVariable:
        return AVAudioBitRateStrategy_Variable;
      default:
        return nil;
    }
  }
  return nil;
}

- (NSDictionary<NSString *, NSString *> *)_getAVKeysForRecordingOptionsKeys:(NSString *)bitRateStrategy
{
  return @{EXAudioRecordingOptionOutputFormatKey: AVFormatIDKey,
           EXAudioRecordingOptionAudioQualityKey:
             bitRateStrategy == AVAudioBitRateStrategy_Variable
           ? AVEncoderAudioQualityForVBRKey : AVEncoderAudioQualityKey,
           EXAudioRecordingOptionSampleRateKey: AVSampleRateKey,
           EXAudioRecordingOptionNumberOfChannelsKey: AVNumberOfChannelsKey,
           EXAudioRecordingOptionBitRateKey: AVEncoderBitRateKey,
           EXAudioRecordingOptionBitDepthHintKey: AVEncoderBitDepthHintKey,
           EXAudioRecordingOptionLinearPCMBitDepthKey: AVLinearPCMBitDepthKey,
           EXAudioRecordingOptionLinearPCMIsBigEndianKey: AVLinearPCMIsBigEndianKey,
           EXAudioRecordingOptionLinearPCMIsFloatKey: AVLinearPCMIsFloatKey};
}

- (UInt32)_getFormatIDFromString:(NSString *)typeString
{
  const char *s = typeString.UTF8String;
  UInt32 typeCode = s[3] | (s[2] << 8) | (s[1] << 16) | (s[0] << 24);
  return typeCode;
}

- (void)_setNewAudioRecorderFilenameAndSettings:(NSDictionary *)optionsFromJS
{
  NSDictionary *iosOptionsFromJS = optionsFromJS[EXAudioRecordingOptionsKey];
  
  NSString *extension = iosOptionsFromJS[EXAudioRecordingOptionExtensionKey];
  _audioRecorderFilename = [NSString stringWithFormat:@"recording-%@%@", [[NSUUID UUID] UUIDString], extension];
  
  NSString *bitRateStrategy = [self _getBitRateStrategyFromEnum:iosOptionsFromJS[EXAudioRecordingOptionBitRateStrategyKey]];
  NSDictionary<NSString *, NSString *> *avKeysForRecordingOptionsKeys = [self _getAVKeysForRecordingOptionsKeys:bitRateStrategy];
  
  NSMutableDictionary *recorderSettings = [NSMutableDictionary new];
  for (NSString *recordingOptionsKey in avKeysForRecordingOptionsKeys) {
    if (iosOptionsFromJS[recordingOptionsKey]) {
      recorderSettings[avKeysForRecordingOptionsKeys[recordingOptionsKey]] = iosOptionsFromJS[recordingOptionsKey];
    }
  }
  recorderSettings[AVEncoderBitRateStrategyKey] = bitRateStrategy;

  if (
      iosOptionsFromJS[EXAudioRecordingOptionOutputFormatKey] &&
      [iosOptionsFromJS[EXAudioRecordingOptionOutputFormatKey] isKindOfClass:[NSString class]]
      ) {
    recorderSettings[AVFormatIDKey] =
      @([self _getFormatIDFromString:iosOptionsFromJS[EXAudioRecordingOptionOutputFormatKey]]);
  }
  
  _audioRecorderSettings = recorderSettings;
}

- (NSError *)_createNewAudioRecorder
{
  if (_audioRecorder) {
    return RCTErrorWithMessage(@"Recorder already exists.");
  }
  
  NSString *directory = [self.bridge.scopedModules.fileSystem.cachesDirectory stringByAppendingPathComponent:@"AV"];
  [EXFileSystem ensureDirExistsWithPath:directory];
  NSString *soundFilePath = [directory stringByAppendingPathComponent:_audioRecorderFilename];
  NSURL *soundFileURL = [NSURL fileURLWithPath:soundFilePath];
  
  NSError *error;
  AVAudioRecorder *recorder = [[AVAudioRecorder alloc] initWithURL:soundFileURL
                                                          settings:_audioRecorderSettings
                                                             error:&error];
  if (error == nil) {
    _audioRecorder = recorder;
  }
  return error;
}

- (int)_getDurationMillisOfRecordingAudioRecorder
{
  return _audioRecorder ? (int) (_audioRecorder.currentTime * 1000) : 0;
}

- (NSDictionary *)_getAudioRecorderStatus
{
  if (_audioRecorder) {
    int durationMillisFromRecorder = [self _getDurationMillisOfRecordingAudioRecorder];
    // After stop, the recorder's duration goes to zero, so we replace it with the correct duration in this case.
    int durationMillis = durationMillisFromRecorder == 0 ? _audioRecorderDurationMillis : durationMillisFromRecorder;
    return @{@"canRecord": @(YES),
             @"isRecording": @([_audioRecorder isRecording]),
             @"durationMillis": @(durationMillis)};
  } else {
    return nil;
  }
}

- (BOOL)_checkAudioRecorderExistsOrReject:(RCTPromiseRejectBlock)reject
{
  if (_audioRecorder == nil) {
    reject(@"E_AUDIO_NORECORDER", nil, RCTErrorWithMessage(@"Recorder does not exist."));
  }
  return _audioRecorder != nil;
}

- (void)_removeAudioRecorder:(BOOL)removeFilenameAndSettings
{
  if (_audioRecorder) {
    [_audioRecorder stop];
    [self demoteAudioSessionIfPossible];
    _audioRecorder = nil;
  }
  if (removeFilenameAndSettings) {
    _audioRecorderFilename = nil;
    _audioRecorderSettings = nil;
  }
}

EX_EXPORT_SCOPED_MULTISERVICE_MODULE(ExponentAV, @"AudioSessionManager", @"PermissionsManager");

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXDidUpdatePlaybackStatusEventName];
}

#pragma mark - Audio API: Global settings

RCT_EXPORT_METHOD(setAudioIsEnabled:(BOOL)value
                           resolver:(RCTPromiseResolveBlock)resolve
                           rejecter:(RCTPromiseRejectBlock)reject)
{
  _audioIsEnabled = value;
  
  if (!value) {
    [self _deactivateAudioSession];
  }
  resolve(nil);
}

RCT_EXPORT_METHOD(setAudioMode:(nonnull NSDictionary *)mode
                      resolver:(RCTPromiseResolveBlock)resolve
                      rejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *error = [self _setAudioMode:mode];
  
  if (error) {
    reject(@"E_AUDIO_AUDIOMODE", nil, error);
  } else {
    resolve(nil);
  }
}

#pragma mark - Unified playback API - Audio

RCT_EXPORT_METHOD(loadForSound:(nonnull NSDictionary *)source
                    withStatus:(nonnull NSDictionary *)status
                   withSuccess:(RCTResponseSenderBlock)loadSuccess
                     withError:(RCTResponseSenderBlock)loadError)
{
  NSNumber *key = @(_soundDictionaryKeyCount++);

  __weak __typeof__(self) weakSelf = self;
  EXAVPlayerData *data = [[EXAVPlayerData alloc] initWithEXAV:self
                                                   withSource:source
                                                   withStatus:status
                                         withLoadFinishBlock:^(BOOL success, NSDictionary *successStatus, NSString *error) {
                                           if (success) {
                                             loadSuccess(@[key, successStatus]);
                                           } else {
                                             [weakSelf _removeSoundForKey:key];
                                             loadError(@[error]);
                                           }
                                         }];
  data.errorCallback = ^(NSString *error) {
    __strong __typeof__(weakSelf) strongSelf = weakSelf;
    
    if (strongSelf) {
      [strongSelf _removeSoundForKey:key];
    }
  };
  
  data.statusUpdateCallback = ^(NSDictionary *status) {
    __strong __typeof__(weakSelf) strongSelf = weakSelf;
    if (strongSelf && strongSelf.isBeingObserved) {
      NSDictionary<NSString *, id> *response = @{@"key": key, @"status": status};
      [strongSelf sendEventWithName:EXDidUpdatePlaybackStatusEventName body:response];
    }
  };
  
  _soundDictionary[key] = data;
}

RCT_EXPORT_METHOD(unloadForSound:(nonnull NSNumber *)key
                        resolver:(RCTPromiseResolveBlock)resolve
                        rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAVPlayerData *data) {
    [self _removeSoundForKey:key];
    resolve([EXAVPlayerData getUnloadedStatus]);
  } withSoundForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(setStatusForSound:(nonnull NSNumber *)key
                         withStatus:(nonnull NSDictionary *)status
                           resolver:(RCTPromiseResolveBlock)resolve
                           rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAVPlayerData *data) {
    [data setStatus:status
           resolver:resolve
           rejecter:reject];
  } withSoundForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(getStatusForSound:(nonnull NSNumber *)key
                           resolver:(RCTPromiseResolveBlock)resolve
                           rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAVPlayerData *data) {
    NSDictionary *status = [data getStatus];
    resolve(status);
  } withSoundForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(replaySound:(nonnull NSNumber *)key
                   withStatus:(nonnull NSDictionary *)status
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXAVPlayerData *data) {
    [data replayWithStatus:status
                  resolver:resolve
                  rejecter:reject];
  } withSoundForKey:key withRejecter:reject];
}

RCT_EXPORT_METHOD(setErrorCallbackForSound:(nonnull NSNumber *)key
                              withCallback:(RCTResponseSenderBlock)callback)
{
  EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    __block BOOL used = NO; // RCTResponseSenderBlock can only be used once
    __weak __typeof__(self) weakSelf = self;
    data.errorCallback = ^(NSString *error) {
      __strong __typeof__(self) strongSelf = weakSelf;
      
      if (strongSelf && !used) {
        used = YES;
        [strongSelf _removeSoundForKey:key];
        callback(@[error]);
      }
    };
  }
}

#pragma mark - Unified playback API - Video

RCT_EXPORT_METHOD(loadForVideo:(nonnull NSNumber *)reactTag
                        source:(nonnull NSDictionary *)source
                    withStatus:(nonnull NSDictionary *)status
                      resolver:(RCTPromiseResolveBlock)resolve
                      rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXVideoView *view) {
    [view setSource:source withStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

RCT_EXPORT_METHOD(unloadForVideo:(nonnull NSNumber *)reactTag
                        resolver:(RCTPromiseResolveBlock)resolve
                        rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXVideoView *view) {
    [view setSource:nil withStatus:nil resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

RCT_EXPORT_METHOD(setStatusForVideo:(nonnull NSNumber *)reactTag
                         withStatus:(nonnull NSDictionary *)status
                           resolver:(RCTPromiseResolveBlock)resolve
                           rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXVideoView *view) {
    [view setStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

RCT_EXPORT_METHOD(replayVideo:(nonnull NSNumber *)reactTag
                   withStatus:(nonnull NSDictionary *)status
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXVideoView *view) {
    [view replayWithStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

RCT_EXPORT_METHOD(getStatusForVideo:(nonnull NSNumber *)reactTag
                           resolver:(RCTPromiseResolveBlock)resolve
                           rejecter:(RCTPromiseRejectBlock)reject)
{
  [self _runBlock:^(EXVideoView *view) {
    resolve(view.status);
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

// Note that setStatusUpdateCallback happens in the JS for video via onStatusUpdate

#pragma mark - Audio API: Recording

RCT_EXPORT_METHOD(prepareAudioRecorder:(nonnull NSDictionary *)options
                              resolver:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXAudioRecordingPermissionRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"audioRecording" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing audio recording permission.", nil);
    return;
  }

  [self _setNewAudioRecorderFilenameAndSettings:options];
  NSError *error = [self _createNewAudioRecorder];
  
  if (_audioRecorder && !error) {
    _audioRecorderIsPreparing = true;
    error = [self promoteAudioSessionIfNecessary];
    if (error) {
      reject(@"E_AUDIO_RECORDERNOTCREATED", @"Prepare encountered an error: audio session not activated!", error);
    } else if ([_audioRecorder prepareToRecord]) {
      resolve(@{@"uri": [[_audioRecorder url] absoluteString],
                @"status": [self _getAudioRecorderStatus]});
    } else {
      reject(@"E_AUDIO_RECORDERNOTCREATED", nil, RCTErrorWithMessage(@"Prepare encountered an error: recorder not prepared."));
    }
    _audioRecorderIsPreparing = false;
    [self demoteAudioSessionIfPossible];
  } else {
    reject(@"E_AUDIO_RECORDERNOTCREATED", @"Prepare encountered an error: recorder not created.", error);
  }
}

RCT_EXPORT_METHOD(startAudioRecording:(RCTPromiseResolveBlock)resolve
                             rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXAudioRecordingPermissionRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"audioRecording" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing audio recording permission.", nil);
    return;
  }
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (!_allowsAudioRecording) {
      reject(@"E_AUDIO_AUDIOMODE", nil, RCTErrorWithMessage(@"Recording not allowed on iOS."));
    } else if (!_audioRecorder.recording) {
      _audioRecorderShouldBeginRecording = true;
      NSError *error = [self promoteAudioSessionIfNecessary];
      if (!error) {
        if ([_audioRecorder record]) {
          resolve([self _getAudioRecorderStatus]);
        } else {
          reject(@"E_AUDIO_RECORDING", nil, RCTErrorWithMessage(@"Start encountered an error: recording not started."));
        }
      } else {
        reject(@"E_AUDIO_RECORDING", @"Start encountered an error: audio session not activated.", error);
      }
    } else {
      resolve([self _getAudioRecorderStatus]);
    }
  }
  _audioRecorderShouldBeginRecording = false;
}

RCT_EXPORT_METHOD(pauseAudioRecording:(RCTPromiseResolveBlock)resolve
                             rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (_audioRecorder.recording) {
      [_audioRecorder pause];
      [self demoteAudioSessionIfPossible];
    }
    resolve([self _getAudioRecorderStatus]);
  }
}

RCT_EXPORT_METHOD(stopAudioRecording:(RCTPromiseResolveBlock)resolve
                            rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (_audioRecorder.recording) {
      _audioRecorderDurationMillis = [self _getDurationMillisOfRecordingAudioRecorder];
      [_audioRecorder stop];
      [self demoteAudioSessionIfPossible];
    }
    resolve([self _getAudioRecorderStatus]);
  }
}

RCT_EXPORT_METHOD(getAudioRecordingStatus:(RCTPromiseResolveBlock)resolve
                                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    resolve([self _getAudioRecorderStatus]);
  }
}

RCT_EXPORT_METHOD(unloadAudioRecorder:(RCTPromiseResolveBlock)resolve
                             rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    [self _removeAudioRecorder:YES];
    resolve(nil);
  }
}

#pragma mark - Lifecycle

- (void)dealloc
{
  [_kernelAudioSessionManagerDelegate scopedModuleWillDeallocate:self];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  // This will clear all @properties and deactivate the audio session:
  
  for (NSObject<EXAVObject> *video in [_videoSet allObjects]) {
    [video pauseImmediately];
    [_videoSet removeObject:video];
  }
  [self _removeAudioRecorder:YES];
  for (NSNumber *key in [_soundDictionary allKeys]) {
    [self _removeSoundForKey:key];
  }
}


@end
