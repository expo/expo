// Copyright 2017-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUIManager.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppLifecycleService.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXFileSystemInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsMethodsDelegate.h>

#import <ABI43_0_0EXAV/ABI43_0_0EXAV.h>
#import <ABI43_0_0EXAV/ABI43_0_0EXAVPlayerData.h>
#import <ABI43_0_0EXAV/ABI43_0_0EXVideoView.h>
#import <ABI43_0_0EXAV/ABI43_0_0EXAudioRecordingPermissionRequester.h>

NSString *const ABI43_0_0EXAudioRecordingOptionsIsMeteringEnabledKey = @"isMeteringEnabled";
NSString *const ABI43_0_0EXAudioRecordingOptionsKeepAudioActiveHintKey = @"keepAudioActiveHint";
NSString *const ABI43_0_0EXAudioRecordingOptionsKey = @"ios";
NSString *const ABI43_0_0EXAudioRecordingOptionExtensionKey = @"extension";
NSString *const ABI43_0_0EXAudioRecordingOptionOutputFormatKey = @"outputFormat";
NSString *const ABI43_0_0EXAudioRecordingOptionAudioQualityKey = @"audioQuality";
NSString *const ABI43_0_0EXAudioRecordingOptionSampleRateKey = @"sampleRate";
NSString *const ABI43_0_0EXAudioRecordingOptionNumberOfChannelsKey = @"numberOfChannels";
NSString *const ABI43_0_0EXAudioRecordingOptionBitRateKey = @"bitRate";
NSString *const ABI43_0_0EXAudioRecordingOptionBitRateStrategyKey = @"bitRateStrategy";
NSString *const ABI43_0_0EXAudioRecordingOptionBitDepthHintKey = @"bitDepthHint";
NSString *const ABI43_0_0EXAudioRecordingOptionLinearPCMBitDepthKey = @"linearPCMBitDepth";
NSString *const ABI43_0_0EXAudioRecordingOptionLinearPCMIsBigEndianKey = @"linearPCMIsBigEndian";
NSString *const ABI43_0_0EXAudioRecordingOptionLinearPCMIsFloatKey = @"linearPCMIsFloat";

NSString *const ABI43_0_0EXDidUpdatePlaybackStatusEventName = @"didUpdatePlaybackStatus";

NSString *const ABI43_0_0EXDidUpdateMetadataEventName = @"didUpdateMetadata";

@interface ABI43_0_0EXAV ()

@property (nonatomic, weak) id kernelAudioSessionManagerDelegate;
@property (nonatomic, weak) id kernelPermissionsServiceDelegate;

@property (nonatomic, assign) BOOL audioIsEnabled;
@property (nonatomic, assign) ABI43_0_0EXAVAudioSessionMode currentAudioSessionMode;
@property (nonatomic, assign) BOOL isBackgrounded;

@property (nonatomic, assign) ABI43_0_0EXAudioInterruptionMode audioInterruptionMode;
@property (nonatomic, assign) BOOL playsInSilentMode;
@property (nonatomic, assign) BOOL allowsAudioRecording;
@property (nonatomic, assign) BOOL staysActiveInBackground;

@property (nonatomic, assign) int soundDictionaryKeyCount;
@property (nonatomic, strong) NSMutableDictionary <NSNumber *, ABI43_0_0EXAVPlayerData *> *soundDictionary;
@property (nonatomic, assign) BOOL isBeingObserved;
@property (nonatomic, strong) NSHashTable <NSObject<ABI43_0_0EXAVObject> *> *videoSet;

@property (nonatomic, strong) NSString *audioRecorderFilename;
@property (nonatomic, strong) NSDictionary *audioRecorderSettings;
@property (nonatomic, strong) AVAudioRecorder *audioRecorder;
@property (nonatomic, assign) BOOL audioRecorderIsPreparing;
@property (nonatomic, assign) BOOL audioRecorderShouldBeginRecording;
@property (nonatomic, assign) int audioRecorderDurationMillis;

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI43_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI43_0_0EXAV

ABI43_0_0EX_EXPORT_MODULE(ExponentAV);

- (instancetype)init
{
  if (self = [super init]) {
    _audioIsEnabled = YES;
    _currentAudioSessionMode = ABI43_0_0EXAVAudioSessionModeInactive;
    _isBackgrounded = NO;
    
    _audioInterruptionMode = ABI43_0_0EXAudioInterruptionModeMixWithOthers;
    _playsInSilentMode = false;
    _allowsAudioRecording = false;
    _staysActiveInBackground = false;
    
    _soundDictionaryKeyCount = 0;
    _soundDictionary = [NSMutableDictionary new];
    _isBeingObserved = NO;
    _videoSet = [NSHashTable weakObjectsHashTable];
    
    _audioRecorderFilename = nil;
    _audioRecorderSettings = nil;
    _audioRecorder = nil;
    _audioRecorderIsPreparing = false;
    _audioRecorderShouldBeginRecording = false;
    _audioRecorderDurationMillis = 0;
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(ABI43_0_0EXAVInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"Qualities": @{
        @"Low": AVAudioTimePitchAlgorithmLowQualityZeroLatency,
        @"Medium": AVAudioTimePitchAlgorithmTimeDomain,
        @"High": AVAudioTimePitchAlgorithmSpectral
    }
  };
}

#pragma mark - Expo experience lifecycle

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXAppLifecycleService)] unregisterAppLifecycleListener:self];
  _moduleRegistry = moduleRegistry;
  _kernelAudioSessionManagerDelegate = [_moduleRegistry getSingletonModuleForName:@"AudioSessionManager"];
  if (!_isBackgrounded) {
    [_kernelAudioSessionManagerDelegate moduleDidForeground:self];
  }
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXAppLifecycleService)] registerAppLifecycleListener:self];
  _permissionsManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXPermissionsInterface)];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXAudioRecordingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

- (void)onAppForegrounded
{
  [_kernelAudioSessionManagerDelegate moduleDidForeground:self];
  _isBackgrounded = NO;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI43_0_0EXAVObject> *exAVObject) {
    [exAVObject appDidForeground];
  }];
}

- (void)onAppBackgrounded
{
  _isBackgrounded = YES;
  if (!_staysActiveInBackground) {
    [self _deactivateAudioSession]; // This will pause all players and stop all recordings
    
    [self _runBlockForAllAVObjects:^(NSObject<ABI43_0_0EXAVObject> *exAVObject) {
      [exAVObject appDidBackgroundStayActive:NO];
    }];
    [_kernelAudioSessionManagerDelegate moduleDidBackground:self];
  } else {
    [self _runBlockForAllAVObjects:^(NSObject<ABI43_0_0EXAVObject> *exAVObject) {
      [exAVObject appDidBackgroundStayActive:YES];
    }];
  }
}

#pragma mark - ABI43_0_0RCTEventEmitter

- (void)startObserving
{
  _isBeingObserved = YES;
}

- (void)stopObserving
{
  _isBeingObserved = NO;
}

#pragma mark - Global audio state control API

- (void)registerVideoForAudioLifecycle:(NSObject<ABI43_0_0EXAVObject> *)video
{
  [_videoSet addObject:video];
}

- (void)unregisterVideoForAudioLifecycle:(NSObject<ABI43_0_0EXAVObject> *)video
{
  [_videoSet removeObject:video];
}

- (void)_runBlockForAllAVObjects:(void (^)(NSObject<ABI43_0_0EXAVObject> *exAVObject))block
{
  for (ABI43_0_0EXAVPlayerData *data in [_soundDictionary allValues]) {
    block(data);
  }
  for (NSObject<ABI43_0_0EXAVObject> *video in [_videoSet allObjects]) {
    block(video);
  }
}

// This method is placed here so that it is easily referrable from _setAudioSessionCategoryForAudioMode.
- (NSError *)_setAudioMode:(NSDictionary *)mode
{
  BOOL playsInSilentMode = ((NSNumber *)mode[@"playsInSilentModeIOS"]).boolValue;
  ABI43_0_0EXAudioInterruptionMode interruptionMode = ((NSNumber *)mode[@"interruptionModeIOS"]).intValue;
  BOOL allowsRecording = ((NSNumber *)mode[@"allowsRecordingIOS"]).boolValue;
  BOOL shouldPlayInBackground = ((NSNumber *)mode[@"staysActiveInBackground"]).boolValue;
  
  if (!playsInSilentMode && interruptionMode == ABI43_0_0EXAudioInterruptionModeDuckOthers) {
    return ABI43_0_0EXErrorWithMessage(@"Impossible audio mode: playsInSilentMode == false and duckOthers == true cannot be set on iOS.");
  } else if (!playsInSilentMode && allowsRecording) {
    return ABI43_0_0EXErrorWithMessage(@"Impossible audio mode: playsInSilentMode == false and allowsRecording == true cannot be set on iOS.");
  } else if (!playsInSilentMode && shouldPlayInBackground) {
    return ABI43_0_0EXErrorWithMessage(@"Impossible audio mode: playsInSilentMode == false and staysActiveInBackground == true cannot be set on iOS.");
  } else {
    if (!allowsRecording) {
      if (_audioRecorder && [_audioRecorder isRecording]) {
        [_audioRecorder pause];
      }
    }
    
    _playsInSilentMode = playsInSilentMode;
    _audioInterruptionMode = interruptionMode;
    _allowsAudioRecording = allowsRecording;
    _staysActiveInBackground = shouldPlayInBackground;
    
    if (_currentAudioSessionMode != ABI43_0_0EXAVAudioSessionModeInactive) {
      return [self _updateAudioSessionCategoryForAudioSessionMode:[self _getAudioSessionModeRequired]];
    }
    return nil;
  }
}

- (NSError *)_updateAudioSessionCategoryForAudioSessionMode:(ABI43_0_0EXAVAudioSessionMode)audioSessionMode
{
  AVAudioSessionCategory requiredAudioCategory;
  AVAudioSessionCategoryOptions requiredAudioCategoryOptions = 0;
  
  if (!_playsInSilentMode) {
    // _allowsRecording is guaranteed to be false, and _interruptionMode is guaranteed to not be ABI43_0_0EXAudioInterruptionModeDuckOthers (see above)
    if (_audioInterruptionMode == ABI43_0_0EXAudioInterruptionModeDoNotMix) {
      requiredAudioCategory = AVAudioSessionCategorySoloAmbient;
    } else {
      requiredAudioCategory = AVAudioSessionCategoryAmbient;
    }
  } else {
    ABI43_0_0EXAudioInterruptionMode activeInterruptionMode = audioSessionMode == ABI43_0_0EXAVAudioSessionModeActiveMuted ? ABI43_0_0EXAudioInterruptionModeMixWithOthers : _audioInterruptionMode;
    NSString *category = _allowsAudioRecording ? AVAudioSessionCategoryPlayAndRecord : AVAudioSessionCategoryPlayback;
    requiredAudioCategory = category;
    switch (activeInterruptionMode) {
      case ABI43_0_0EXAudioInterruptionModeDoNotMix:
        break;
      case ABI43_0_0EXAudioInterruptionModeDuckOthers:
        requiredAudioCategoryOptions = AVAudioSessionCategoryOptionDuckOthers;
        break;
      case ABI43_0_0EXAudioInterruptionModeMixWithOthers:
      default:
        requiredAudioCategoryOptions = AVAudioSessionCategoryOptionMixWithOthers;
        break;
    }
  }
  
  if ([[_kernelAudioSessionManagerDelegate activeCategory] isEqual:requiredAudioCategory] && [_kernelAudioSessionManagerDelegate activeCategoryOptions] == requiredAudioCategoryOptions) {
    return nil;
  }
  
  return [_kernelAudioSessionManagerDelegate setCategory:requiredAudioCategory withOptions:requiredAudioCategoryOptions forModule:self];
}

- (ABI43_0_0EXAVAudioSessionMode)_getAudioSessionModeRequired
{
  __block ABI43_0_0EXAVAudioSessionMode audioSessionModeRequired = ABI43_0_0EXAVAudioSessionModeInactive;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI43_0_0EXAVObject> *exAVObject) {
    ABI43_0_0EXAVAudioSessionMode audioSessionModeRequiredByThisObject = [exAVObject getAudioSessionModeRequired];
    if (audioSessionModeRequiredByThisObject > audioSessionModeRequired) {
      audioSessionModeRequired = audioSessionModeRequiredByThisObject;
    }
  }];
  
  if (_audioRecorder) {
    if (_audioRecorderShouldBeginRecording || [_audioRecorder isRecording]) {
      audioSessionModeRequired = ABI43_0_0EXAVAudioSessionModeActive;
    } else if (_audioRecorderIsPreparing && audioSessionModeRequired == ABI43_0_0EXAVAudioSessionModeInactive) {
      audioSessionModeRequired = ABI43_0_0EXAVAudioSessionModeActiveMuted;
    }
  }
  
  return audioSessionModeRequired;
}

- (NSError *)promoteAudioSessionIfNecessary
{
  if (!_audioIsEnabled) {
    return ABI43_0_0EXErrorWithMessage(@"Expo Audio is disabled, so the audio session could not be activated.");
  }
  if (_isBackgrounded && !_staysActiveInBackground && ![_kernelAudioSessionManagerDelegate isActiveForModule:self]) {
    return ABI43_0_0EXErrorWithMessage(@"This experience is currently in the background, so the audio session could not be activated.");
  }
  
  ABI43_0_0EXAVAudioSessionMode audioSessionModeRequired = [self _getAudioSessionModeRequired];
  
  if (audioSessionModeRequired == ABI43_0_0EXAVAudioSessionModeInactive) {
    return nil;
  }
  
  NSError *error;
  
  error = [self _updateAudioSessionCategoryForAudioSessionMode:audioSessionModeRequired];
  if (error) {
    return error;
  }
  
  error = [_kernelAudioSessionManagerDelegate setActive:YES forModule:self];
  if (error) {
    return error;
  }
  
  _currentAudioSessionMode = audioSessionModeRequired;
  return nil;
}

- (NSError *)_deactivateAudioSession
{
  if (_currentAudioSessionMode == ABI43_0_0EXAVAudioSessionModeInactive) {
    return nil;
  }
  
  // We must have all players, recorders, and videos paused in order to effectively deactivate the session.
  [self _runBlockForAllAVObjects:^(NSObject<ABI43_0_0EXAVObject> *exAVObject) {
    [exAVObject pauseImmediately];
  }];
  if (_audioRecorder && [_audioRecorder isRecording]) {
    [_audioRecorder pause];
  }
  
  NSError *error = [_kernelAudioSessionManagerDelegate setActive:NO forModule:self];
  
  if (!error) {
    _currentAudioSessionMode = ABI43_0_0EXAVAudioSessionModeInactive;
  }
  return error;
}

- (NSError *)demoteAudioSessionIfPossible
{
  ABI43_0_0EXAVAudioSessionMode audioSessionModeRequired = [self _getAudioSessionModeRequired];
  
  // Current audio session mode is lower than the required one
  // (we should rather promote the session than demote it).
  if (_currentAudioSessionMode <= audioSessionModeRequired) {
    return nil;
  }
  
  // We require the session to be muted and it is active.
  // Let's only update the category.
  if (audioSessionModeRequired == ABI43_0_0EXAVAudioSessionModeActiveMuted) {
    NSError *error = [self _updateAudioSessionCategoryForAudioSessionMode:audioSessionModeRequired];
    if (!error) {
      _currentAudioSessionMode = ABI43_0_0EXAVAudioSessionModeActiveMuted;
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
    _currentAudioSessionMode = ABI43_0_0EXAVAudioSessionModeInactive;
  }
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI43_0_0EXAVObject> *exAVObject) {
    [exAVObject handleAudioSessionInterruption:notification];
  }];
}

- (void)handleMediaServicesReset:(NSNotification *)notification
{
  // See here: https://developer.apple.com/library/content/qa/qa1749/_index.html
  // (this is an unlikely notification to receive, but best practices suggests that we catch it just in case)
  
  _currentAudioSessionMode = ABI43_0_0EXAVAudioSessionModeInactive;
  
  [self _runBlockForAllAVObjects:^(NSObject<ABI43_0_0EXAVObject> *exAVObject) {
    [exAVObject handleMediaServicesReset:nil];
  }];
  
  if (_audioRecorder) {
    [self _removeAudioRecorder:NO];
    [self _createNewAudioRecorder];
    [_audioRecorder prepareToRecord];
  }
}

#pragma mark - Internal sound playback helper methods

- (void)_runBlock:(void (^)(ABI43_0_0EXAVPlayerData *data))block
  withSoundForKey:(nonnull NSNumber *)key
     withRejecter:(ABI43_0_0EXPromiseRejectBlock)reject
{
  ABI43_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    block(data);
  } else {
    reject(@"E_AUDIO_NOPLAYER", @"Sound object not loaded. Did you unload it using Audio.unloadAsync?", nil);
  }
}

- (void)_removeSoundForKey:(NSNumber *)key
{
  ABI43_0_0EXAVPlayerData *data = _soundDictionary[key];
  if (data) {
    [data pauseImmediately];
    _soundDictionary[key] = nil;
    [self demoteAudioSessionIfPossible];
  }
}

#pragma mark - Internal video playback helper method

- (void)_runBlock:(void (^)(ABI43_0_0EXVideoView *view))block
withEXVideoViewForTag:(nonnull NSNumber *)reactTag
     withRejecter:(ABI43_0_0EXPromiseRejectBlock)reject
{
  // TODO check that the bridge is still valid after the dispatch
  // TODO check if the queues are ok
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXUIManager)] executeUIBlock:^(id view) {
    if ([view isKindOfClass:[ABI43_0_0EXVideoView class]]) {
      block(view);
    } else {
      reject(@"E_VIDEO_TAGINCORRECT", [NSString stringWithFormat:@"Invalid view returned from registry, expecting ABI43_0_0EXVideo, got: %@", view], nil);
    }
  } forView:reactTag ofClass:[ABI43_0_0EXVideoView class]];
}

#pragma mark - Internal audio recording helper methods

- (NSString *)_getBitRateStrategyFromEnum:(NSNumber *)bitRateEnumSelected
{
  if (bitRateEnumSelected) {
    switch ([bitRateEnumSelected integerValue]) {
      case ABI43_0_0EXAudioRecordingOptionBitRateStrategyConstant:
        return AVAudioBitRateStrategy_Constant;
      case ABI43_0_0EXAudioRecordingOptionBitRateStrategyLongTermAverage:
        return AVAudioBitRateStrategy_LongTermAverage;
      case ABI43_0_0EXAudioRecordingOptionBitRateStrategyVariableConstrained:
        return AVAudioBitRateStrategy_VariableConstrained;
        break;
      case ABI43_0_0EXAudioRecordingOptionBitRateStrategyVariable:
        return AVAudioBitRateStrategy_Variable;
      default:
        return nil;
    }
  }
  return nil;
}

- (NSDictionary<NSString *, NSString *> *)_getAVKeysForRecordingOptionsKeys:(NSString *)bitRateStrategy
{
  return @{ABI43_0_0EXAudioRecordingOptionOutputFormatKey: AVFormatIDKey,
           ABI43_0_0EXAudioRecordingOptionAudioQualityKey:
             bitRateStrategy == AVAudioBitRateStrategy_Variable
           ? AVEncoderAudioQualityForVBRKey : AVEncoderAudioQualityKey,
           ABI43_0_0EXAudioRecordingOptionSampleRateKey: AVSampleRateKey,
           ABI43_0_0EXAudioRecordingOptionNumberOfChannelsKey: AVNumberOfChannelsKey,
           ABI43_0_0EXAudioRecordingOptionBitRateKey: AVEncoderBitRateKey,
           ABI43_0_0EXAudioRecordingOptionBitDepthHintKey: AVEncoderBitDepthHintKey,
           ABI43_0_0EXAudioRecordingOptionLinearPCMBitDepthKey: AVLinearPCMBitDepthKey,
           ABI43_0_0EXAudioRecordingOptionLinearPCMIsBigEndianKey: AVLinearPCMIsBigEndianKey,
           ABI43_0_0EXAudioRecordingOptionLinearPCMIsFloatKey: AVLinearPCMIsFloatKey};
}

- (UInt32)_getFormatIDFromString:(NSString *)typeString
{
  const char *s = typeString.UTF8String;
  UInt32 typeCode = s[3] | (s[2] << 8) | (s[1] << 16) | (s[0] << 24);
  return typeCode;
}

- (void)_setNewAudioRecorderFilenameAndSettings:(NSDictionary *)optionsFromJS
{
  NSDictionary *iosOptionsFromJS = optionsFromJS[ABI43_0_0EXAudioRecordingOptionsKey];
  
  NSString *extension = iosOptionsFromJS[ABI43_0_0EXAudioRecordingOptionExtensionKey];
  _audioRecorderFilename = [NSString stringWithFormat:@"recording-%@%@", [[NSUUID UUID] UUIDString], extension];
  
  NSString *bitRateStrategy = [self _getBitRateStrategyFromEnum:iosOptionsFromJS[ABI43_0_0EXAudioRecordingOptionBitRateStrategyKey]];
  NSDictionary<NSString *, NSString *> *avKeysForRecordingOptionsKeys = [self _getAVKeysForRecordingOptionsKeys:bitRateStrategy];
  
  NSMutableDictionary *recorderSettings = [NSMutableDictionary new];
  for (NSString *recordingOptionsKey in avKeysForRecordingOptionsKeys) {
    if (iosOptionsFromJS[recordingOptionsKey]) {
      recorderSettings[avKeysForRecordingOptionsKeys[recordingOptionsKey]] = iosOptionsFromJS[recordingOptionsKey];
    }
  }
  recorderSettings[AVEncoderBitRateStrategyKey] = bitRateStrategy;
  
  if (
      iosOptionsFromJS[ABI43_0_0EXAudioRecordingOptionOutputFormatKey] &&
      [iosOptionsFromJS[ABI43_0_0EXAudioRecordingOptionOutputFormatKey] isKindOfClass:[NSString class]]
      ) {
    recorderSettings[AVFormatIDKey] =
    @([self _getFormatIDFromString:iosOptionsFromJS[ABI43_0_0EXAudioRecordingOptionOutputFormatKey]]);
  }
  
  _audioRecorderSettings = recorderSettings;
}

- (NSError *)_createNewAudioRecorder
{
  if (_audioRecorder) {
    return ABI43_0_0EXErrorWithMessage(@"Recorder is already prepared.");
  }
  
  id<ABI43_0_0EXFileSystemInterface> fileSystem = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXFileSystemInterface)];
  
  if (!fileSystem) {
    return ABI43_0_0EXErrorWithMessage(@"No FileSystem module.");
  }
  
  NSString *directory = [fileSystem.cachesDirectory stringByAppendingPathComponent:@"AV"];
  [fileSystem ensureDirExistsWithPath:directory];
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

    NSMutableDictionary *result = [@{
      @"canRecord": @(YES),
      @"isRecording": @([_audioRecorder isRecording]),
      @"durationMillis": @(durationMillis),
    } mutableCopy];

    if (_audioRecorder.meteringEnabled) {
      [_audioRecorder updateMeters];
      float currentLevel = [_audioRecorder averagePowerForChannel: 0];
      result[@"metering"] = @(currentLevel);
    }

    return result;
  } else {
    return nil;
  }
}

- (BOOL)_checkAudioRecorderExistsOrReject:(ABI43_0_0EXPromiseRejectBlock)reject
{
  if (_audioRecorder == nil) {
    reject(@"E_AUDIO_NORECORDER", @"Recorder does not exist. Prepare it first using Audio.prepareToRecordAsync.", nil);
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
    _audioRecorderDurationMillis = 0;
  }
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI43_0_0EXDidUpdatePlaybackStatusEventName, ABI43_0_0EXDidUpdateMetadataEventName, @"ExponentAV.onError"];
}

#pragma mark - Audio API: Global settings

ABI43_0_0EX_EXPORT_METHOD_AS(setAudioIsEnabled,
                    setAudioIsEnabled:(BOOL)value
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  _audioIsEnabled = value;
  
  if (!value) {
    [self _deactivateAudioSession];
  }
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(setAudioMode,
                    setAudioMode:(NSDictionary *)mode
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  NSError *error = [self _setAudioMode:mode];
  
  if (error) {
    reject(@"E_AUDIO_AUDIOMODE", nil, error);
  } else {
    resolve(nil);
  }
}

#pragma mark - Unified playback API - Audio

ABI43_0_0EX_EXPORT_METHOD_AS(loadForSound,
                    loadForSound:(NSDictionary *)source
                    withStatus:(NSDictionary *)status
                    resolver:(ABI43_0_0EXPromiseResolveBlock)loadSuccess
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)loadError)
{
  NSNumber *key = @(_soundDictionaryKeyCount++);
  
  ABI43_0_0EX_WEAKIFY(self);
  ABI43_0_0EXAVPlayerData *data = [[ABI43_0_0EXAVPlayerData alloc] initWithEXAV:self
                                                   withSource:source
                                                   withStatus:status
                                          withLoadFinishBlock:^(BOOL success, NSDictionary *successStatus, NSString *error) {
    ABI43_0_0EX_ENSURE_STRONGIFY(self);
    if (success) {
      loadSuccess(@[key, successStatus]);
    } else {
      [self _removeSoundForKey:key];
      loadError(@"ABI43_0_0EXAV", error, nil);
    }
  }];
  data.errorCallback = ^(NSString *error) {
    ABI43_0_0EX_ENSURE_STRONGIFY(self);
    [self sendEventWithName:@"ExponentAV.onError" body:@{
      @"key": key,
      @"error": error
    }];
    [self _removeSoundForKey:key];
  };
  
  data.statusUpdateCallback = ^(NSDictionary *status) {
    ABI43_0_0EX_ENSURE_STRONGIFY(self);
    if (self.isBeingObserved) {
      NSDictionary<NSString *, id> *response = @{@"key": key, @"status": status};
      [self sendEventWithName:ABI43_0_0EXDidUpdatePlaybackStatusEventName body:response];
    }
  };
  
  data.metadataUpdateCallback = ^(NSDictionary *metadata) {
    ABI43_0_0EX_ENSURE_STRONGIFY(self);
      if (self.isBeingObserved) {
        NSDictionary<NSString *, id> *response = @{@"key": key, @"metadata": metadata};
        [self sendEventWithName:ABI43_0_0EXDidUpdateMetadataEventName body:response];
      }
  };
    
  _soundDictionary[key] = data;
}

- (void)sendEventWithName:(NSString *)eventName body:(NSDictionary *)body
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXEventEmitterService)] sendEventWithName:eventName body:body];
}

ABI43_0_0EX_EXPORT_METHOD_AS(unloadForSound,
                    unloadForSound:(NSNumber *)key
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXAVPlayerData *data) {
    [self _removeSoundForKey:key];
    resolve([ABI43_0_0EXAVPlayerData getUnloadedStatus]);
  } withSoundForKey:key withRejecter:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(setStatusForSound,
                    setStatusForSound:(NSNumber *)key
                    withStatus:(NSDictionary *)status
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXAVPlayerData *data) {
    [data setStatus:status
           resolver:resolve
           rejecter:reject];
  } withSoundForKey:key withRejecter:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(getStatusForSound,
                    getStatusForSound:(NSNumber *)key
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXAVPlayerData *data) {
    NSDictionary *status = [data getStatus];
    resolve(status);
  } withSoundForKey:key withRejecter:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(replaySound,
                    replaySound:(NSNumber *)key
                    withStatus:(NSDictionary *)status
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXAVPlayerData *data) {
    [data replayWithStatus:status
                  resolver:resolve
                  rejecter:reject];
  } withSoundForKey:key withRejecter:reject];
}

#pragma mark - Unified playback API - Video

ABI43_0_0EX_EXPORT_METHOD_AS(loadForVideo,
                    loadForVideo:(NSNumber *)reactTag
                    source:(NSDictionary *)source
                    withStatus:(NSDictionary *)status
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXVideoView *view) {
    [view setSource:source withStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(unloadForVideo,
                    unloadForVideo:(NSNumber *)reactTag
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXVideoView *view) {
    [view setSource:nil withStatus:nil resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(setStatusForVideo,
                    setStatusForVideo:(NSNumber *)reactTag
                    withStatus:(NSDictionary *)status
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXVideoView *view) {
    [view setStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(replayVideo,
                    replayVideo:(NSNumber *)reactTag
                    withStatus:(NSDictionary *)status
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXVideoView *view) {
    [view replayWithStatus:status resolver:resolve rejecter:reject];
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(getStatusForVideo,
                    getStatusForVideo:(NSNumber *)reactTag
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [self _runBlock:^(ABI43_0_0EXVideoView *view) {
    resolve(view.status);
  } withEXVideoViewForTag:reactTag withRejecter:reject];
}

// Note that setStatusUpdateCallback happens in the JS for video via onStatusUpdate

#pragma mark - Audio API: Recording

ABI43_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXAudioRecordingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXAudioRecordingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(prepareAudioRecorder,
                    prepareAudioRecorder:(NSDictionary *)options
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if (![_permissionsManager hasGrantedPermissionUsingRequesterClass:[ABI43_0_0EXAudioRecordingPermissionRequester class]]) {
    reject(@"E_MISSING_PERMISSION", @"Missing audio recording permission.", nil);
    return;
  }
  if (!_allowsAudioRecording) {
    reject(@"E_AUDIO_AUDIOMODE", @"Recording not allowed on iOS. Enable with Audio.setAudioModeAsync.", nil);
    return;
  }
  
  [self _setNewAudioRecorderFilenameAndSettings:options];
  NSError *error = [self _createNewAudioRecorder];
  
  if (_audioRecorder && !error) {
    _audioRecorderIsPreparing = true;
    error = [self promoteAudioSessionIfNecessary];
    if (error) {
      _audioRecorderIsPreparing = false;
      [self _removeAudioRecorder:YES];
      reject(@"E_AUDIO_RECORDERNOTCREATED", [NSString stringWithFormat:@"Prepare encountered an error: %@", error.description], error);
      return;
    } else if (![_audioRecorder prepareToRecord]) {
      _audioRecorderIsPreparing = false;
      [self _removeAudioRecorder:YES];
      reject(@"E_AUDIO_RECORDERNOTCREATED", @"Prepare encountered an error: recorder not prepared.", nil);
      return;
    }
    if (options[ABI43_0_0EXAudioRecordingOptionsIsMeteringEnabledKey]) {
      _audioRecorder.meteringEnabled = true;
    }
    
    resolve(@{@"uri": [[_audioRecorder url] absoluteString],
                @"status": [self _getAudioRecorderStatus]});
    _audioRecorderIsPreparing = false;
    if (!options[ABI43_0_0EXAudioRecordingOptionsKeepAudioActiveHintKey]) {
      [self demoteAudioSessionIfPossible];
    }
  } else {
    reject(@"E_AUDIO_RECORDERNOTCREATED", [NSString stringWithFormat:@"Prepare encountered an error: %@", error.description], error);
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(startAudioRecording,
                    startAudioRecording:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if (![_permissionsManager hasGrantedPermissionUsingRequesterClass:[ABI43_0_0EXAudioRecordingPermissionRequester class]]) {
    reject(@"E_MISSING_PERMISSION", @"Missing audio recording permission.", nil);
    return;
  }
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (!_allowsAudioRecording) {
      reject(@"E_AUDIO_AUDIOMODE", @"Recording not allowed on iOS. Enable with Audio.setAudioModeAsync.", nil);
    } else if (!_audioRecorder.recording) {
      _audioRecorderShouldBeginRecording = true;
      NSError *error = [self promoteAudioSessionIfNecessary];
      if (!error) {
        if ([_audioRecorder record]) {
          resolve([self _getAudioRecorderStatus]);
        } else {
          reject(@"E_AUDIO_RECORDING", @"Start encountered an error: recording not started.", nil);
        }
      } else {
        reject(@"E_AUDIO_RECORDING", [NSString stringWithFormat:@"Start encountered an error: %@", error.description], error);
      }
    } else {
      resolve([self _getAudioRecorderStatus]);
    }
  }
  _audioRecorderShouldBeginRecording = false;
}

ABI43_0_0EX_EXPORT_METHOD_AS(pauseAudioRecording,
                    pauseAudioRecording:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    if (_audioRecorder.recording) {
      [_audioRecorder pause];
      [self demoteAudioSessionIfPossible];
    }
    resolve([self _getAudioRecorderStatus]);
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(stopAudioRecording,
                    stopAudioRecording:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
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

ABI43_0_0EX_EXPORT_METHOD_AS(getAudioRecordingStatus,
                    getAudioRecordingStatus:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    resolve([self _getAudioRecorderStatus]);
  }
}

ABI43_0_0EX_EXPORT_METHOD_AS(unloadAudioRecorder,
                    unloadAudioRecorder:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  if ([self _checkAudioRecorderExistsOrReject:reject]) {
    [self _removeAudioRecorder:YES];
    resolve(nil);
  }
}

#pragma mark - Lifecycle

- (void)dealloc
{
  [_kernelAudioSessionManagerDelegate moduleWillDeallocate:self];
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXAppLifecycleService)] unregisterAppLifecycleListener:self];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  
  // This will clear all @properties and deactivate the audio session:
  
  for (NSObject<ABI43_0_0EXAVObject> *video in [_videoSet allObjects]) {
    [video pauseImmediately];
    [_videoSet removeObject:video];
  }
  [self _removeAudioRecorder:YES];
  for (NSNumber *key in [_soundDictionary allKeys]) {
    [self _removeSoundForKey:key];
  }
}

@end
