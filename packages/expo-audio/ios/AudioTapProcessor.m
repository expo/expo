// Copyright 2016-present 650 Industries. All rights reserved.

#import "AudioTapProcessor.h"
#import <AudioToolbox/AudioToolbox.h>
#import <os/lock.h>

NS_ASSUME_NONNULL_BEGIN

typedef struct AVAudioTapProcessorContext {
  Boolean isNonInterleaved;
  Boolean supportedTapProcessingFormat;
  void *self;
  Boolean isValid;
} AVAudioTapProcessorContext;


@implementation AudioTapProcessor {
  os_unfair_lock _lock;
  MTAudioProcessingTapRef _audioProcessingTap;
  BOOL _isTapInstalled;
  BOOL _isInvalidated;
}

- (instancetype)initWithPlayer:(AVPlayer *)player {
  self = [super init];
  if (self) {
    _player = player;
    _lock = OS_UNFAIR_LOCK_INIT;
    _isTapInstalled = NO;
    _isInvalidated = NO;
    _audioProcessingTap = NULL;
  }
  return self;
}

- (BOOL)isTapInstalled {
  os_unfair_lock_lock(&_lock);
  BOOL installed = _isTapInstalled;
  os_unfair_lock_unlock(&_lock);
  return installed;
}

- (BOOL)installTap {
  os_unfair_lock_lock(&_lock);
  
  if (_isInvalidated || _isTapInstalled) {
    os_unfair_lock_unlock(&_lock);
    return _isTapInstalled;
  }
  
  if (![_player currentItem]) {
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
  
  AVAssetTrack *track = _player.currentItem.tracks.firstObject.assetTrack;
  if (!track) {
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
  
  AVMutableAudioMix *audioMix = [AVMutableAudioMix audioMix];
  if (!audioMix) {
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
  
  AVMutableAudioMixInputParameters *audioMixInputParameters = [AVMutableAudioMixInputParameters audioMixInputParametersWithTrack:track];
  if (!audioMixInputParameters) {
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
  
  MTAudioProcessingTapCallbacks callbacks;
  callbacks.version = kMTAudioProcessingTapCallbacksVersion_0;
  callbacks.clientInfo = (__bridge void *)self;
  callbacks.init = tapInit;
  callbacks.finalize = tapFinalize;
  callbacks.prepare = tapPrepare;
  callbacks.unprepare = nil;
  callbacks.process = tapProcess;
  
  OSStatus status = MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PostEffects, &_audioProcessingTap);
  if (status == noErr) {
    audioMixInputParameters.audioTapProcessor = _audioProcessingTap;
    audioMix.inputParameters = @[audioMixInputParameters];
    [_player.currentItem setAudioMix:audioMix];
    _isTapInstalled = YES;
    os_unfair_lock_unlock(&_lock);
    return YES;
  } else {
    NSLog(@"Failed to create audio processing tap: %d", (int)status);
    os_unfair_lock_unlock(&_lock);
    return NO;
  }
}

- (void)uninstallTap {
  os_unfair_lock_lock(&_lock);
  
  if (_isTapInstalled && !_isInvalidated) {
    [_player.currentItem setAudioMix:nil];
    _isTapInstalled = NO;
    
    if (_audioProcessingTap) {
      AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(_audioProcessingTap);
      if (context) {
        context->isValid = NO;
        context->self = NULL;
      }
    }
    
    _audioProcessingTap = NULL;
  }
  
  os_unfair_lock_unlock(&_lock);
}

- (void)invalidate {
  os_unfair_lock_lock(&_lock);
  
  _isInvalidated = YES;
  self.sampleBufferCallback = nil;
  
  if (_isTapInstalled) {
    [_player.currentItem setAudioMix:nil];
    _isTapInstalled = NO;
    
    if (_audioProcessingTap) {
      AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(_audioProcessingTap);
      if (context) {
        context->isValid = NO;
        context->self = NULL;
      }
    }
    _audioProcessingTap = NULL;
  }
  
  os_unfair_lock_unlock(&_lock);
}

- (void)dealloc {
  [self invalidate];
}

#pragma mark - Audio Sample Buffer Callbacks (MTAudioProcessingTapCallbacks)

void tapInit(MTAudioProcessingTapRef tap, void *clientInfo, void **tapStorageOut) {
  AVAudioTapProcessorContext *context = calloc(1, sizeof(AVAudioTapProcessorContext));
  if (context) {
    context->isNonInterleaved = false;
    context->self = clientInfo;
    context->isValid = true;
    *tapStorageOut = context;
  } else {
    *tapStorageOut = NULL;
  }
}

void tapFinalize(MTAudioProcessingTapRef tap) {
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
  if (context) {
    context->isValid = false;
    context->self = NULL;
    free(context);
  }
}

void tapPrepare(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *processingFormat) {
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
  context->supportedTapProcessingFormat = true;
  
  if (processingFormat->mFormatID != kAudioFormatLinearPCM) {
    NSLog(@"Audio Format ID for audioProcessingTap: LinearPCM");
  }
  
  if (!(processingFormat->mFormatFlags & kAudioFormatFlagIsFloat)) {
    NSLog(@"Audio Format ID for audioProcessingTap: Float only");
  }
  
  if (processingFormat->mFormatFlags & kAudioFormatFlagIsNonInterleaved) {
    context->isNonInterleaved = true;
  }
}

void tapProcess(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut) {
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
  
  OSStatus status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, NULL, numberFramesOut);
  if (status != noErr) {
    return;
  }
  
  if (!context || !context->isValid || !context->self) {
    return;
  }
  
  AudioTapProcessor *processor = (__bridge AudioTapProcessor *)context->self;
  
  if (!context->isValid) {
    return;
  }
  
  SampleBufferCallback callback = processor.sampleBufferCallback;
  if (callback && bufferListInOut && bufferListInOut->mNumberBuffers > 0) {
    double timestamp = 0.0; 
    callback(&bufferListInOut->mBuffers[0], (long)numberFrames, timestamp);
  }
}


@end

NS_ASSUME_NONNULL_END
