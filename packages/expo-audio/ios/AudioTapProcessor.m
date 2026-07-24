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
  // POC: pitch shifting via a NewTimePitch audio unit rendered inside the tap.
  AudioUnit timePitchUnit;
  Float64 sampleTime;
  // Written by the control thread, read/applied on the audio thread (see tapProcess).
  float pitchCents;
  float appliedPitchCents;
  Boolean needsReset;
} AVAudioTapProcessorContext;

// Input callback for the NewTimePitch unit: pulls the tap's source audio on demand.
static OSStatus PitchUnitInputCallback(void *inRefCon,
                                       AudioUnitRenderActionFlags *ioActionFlags,
                                       const AudioTimeStamp *inTimeStamp,
                                       UInt32 inBusNumber,
                                       UInt32 inNumberFrames,
                                       AudioBufferList *ioData) {
  MTAudioProcessingTapRef tap = (MTAudioProcessingTapRef)inRefCon;
  CMItemCount framesProvided = 0;
  OSStatus status = MTAudioProcessingTapGetSourceAudio(tap, inNumberFrames, ioData, NULL, NULL, &framesProvided);
  if (status != noErr) {
    // Not enough source audio available (e.g. priming): output silence for this slice.
    for (UInt32 i = 0; i < ioData->mNumberBuffers; i++) {
      if (ioData->mBuffers[i].mData) {
        memset(ioData->mBuffers[i].mData, 0, ioData->mBuffers[i].mDataByteSize);
      }
    }
    if (ioActionFlags) {
      *ioActionFlags |= kAudioUnitRenderAction_OutputIsSilence;
    }
  }
  return noErr;
}


@implementation AudioTapProcessor {
  os_unfair_lock _lock;
  MTAudioProcessingTapRef _audioProcessingTap;
  BOOL _isTapInstalled;
  BOOL _isInvalidated;
  float _pitchCents;
}

- (float)pitchCents {
  os_unfair_lock_lock(&_lock);
  float value = _pitchCents;
  os_unfair_lock_unlock(&_lock);
  return value;
}

- (void)setPitchCents:(float)pitchCents {
  os_unfair_lock_lock(&_lock);
  _pitchCents = pitchCents;
  if (_audioProcessingTap) {
    AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(_audioProcessingTap);
    if (context) {
      // Only publish the value here; the audio thread applies it to the unit in
      // tapProcess. This avoids touching (or disposing) the AudioUnit from two
      // threads at once.
      context->pitchCents = pitchCents;
    }
  }
  os_unfair_lock_unlock(&_lock);
}

- (void)reset {
  os_unfair_lock_lock(&_lock);
  if (_audioProcessingTap) {
    AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(_audioProcessingTap);
    if (context) {
      // Flush buffered samples on the audio thread after a discontinuity (seek).
      context->needsReset = true;
    }
  }
  os_unfair_lock_unlock(&_lock);
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
  callbacks.unprepare = tapUnprepare;
  callbacks.process = tapProcess;
  
  OSStatus status = MTAudioProcessingTapCreate(kCFAllocatorDefault, &callbacks, kMTAudioProcessingTapCreationFlag_PostEffects, &_audioProcessingTap);
  if (status == noErr) {
    AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(_audioProcessingTap);
    if (context) {
      context->pitchCents = _pitchCents;
    }
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
    if (context->timePitchUnit) {
      AudioUnitUninitialize(context->timePitchUnit);
      AudioComponentInstanceDispose(context->timePitchUnit);
      context->timePitchUnit = NULL;
    }
    context->isValid = false;
    context->self = NULL;
    free(context);
  }
}

// Creates and initializes a NewTimePitch unit for the given processing format.
// Returns an initialized unit (tempo fixed at 1.0), or NULL on failure.
static AudioUnit CreatePitchUnit(MTAudioProcessingTapRef tap, CMItemCount maxFrames, const AudioStreamBasicDescription *format) {
  AudioComponentDescription desc = {0};
  desc.componentType = kAudioUnitType_FormatConverter;
  desc.componentSubType = kAudioUnitSubType_NewTimePitch;
  desc.componentManufacturer = kAudioUnitManufacturer_Apple;

  AudioComponent component = AudioComponentFindNext(NULL, &desc);
  if (!component) {
    NSLog(@"[pitch] NewTimePitch component unavailable");
    return NULL;
  }

  AudioUnit unit = NULL;
  OSStatus status = AudioComponentInstanceNew(component, &unit);
  if (status != noErr || unit == NULL) {
    NSLog(@"[pitch] Failed to create NewTimePitch unit: %d", (int)status);
    return NULL;
  }

  status = AudioUnitSetProperty(unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Input, 0, format, sizeof(AudioStreamBasicDescription));
  if (status != noErr) {
    NSLog(@"[pitch] Failed to set input format (%d) - pitch disabled, audio will pass through", (int)status);
    AudioComponentInstanceDispose(unit);
    return NULL;
  }
  status = AudioUnitSetProperty(unit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output, 0, format, sizeof(AudioStreamBasicDescription));
  if (status != noErr) {
    NSLog(@"[pitch] Failed to set output format (%d) - pitch disabled", (int)status);
    AudioComponentInstanceDispose(unit);
    return NULL;
  }

  UInt32 maxFramesPerSlice = (UInt32)maxFrames;
  AudioUnitSetProperty(unit, kAudioUnitProperty_MaximumFramesPerSlice, kAudioUnitScope_Global, 0, &maxFramesPerSlice, sizeof(maxFramesPerSlice));

  AURenderCallbackStruct input = {0};
  input.inputProc = PitchUnitInputCallback;
  input.inputProcRefCon = tap;
  status = AudioUnitSetProperty(unit, kAudioUnitProperty_SetRenderCallback, kAudioUnitScope_Input, 0, &input, sizeof(input));
  if (status != noErr) {
    NSLog(@"[pitch] Failed to set input callback: %d", (int)status);
    AudioComponentInstanceDispose(unit);
    return NULL;
  }

  status = AudioUnitInitialize(unit);
  if (status != noErr) {
    NSLog(@"[pitch] Failed to initialize NewTimePitch unit: %d", (int)status);
    AudioComponentInstanceDispose(unit);
    return NULL;
  }

  // Keep tempo unchanged; only shift pitch.
  AudioUnitSetParameter(unit, kNewTimePitchParam_Rate, kAudioUnitScope_Global, 0, 1.0, 0);
  return unit;
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

  context->sampleTime = 0;
  context->needsReset = false;

  // Only build the (relatively expensive) pitch unit when pitch shifting is
  // actually engaged. When the tap is installed purely for audio sampling
  // (pitchCents == 0) we skip it entirely; the tap is rebuilt if pitch is
  // engaged later (see AudioPlayer.updatePitchTap).
  if (context->pitchCents != 0.0f) {
    AudioUnit unit = CreatePitchUnit(tap, maxFrames, processingFormat);
    if (unit) {
      AudioUnitSetParameter(unit, kNewTimePitchParam_Pitch, kAudioUnitScope_Global, 0, context->pitchCents, 0);
      context->appliedPitchCents = context->pitchCents;
      context->timePitchUnit = unit;
    }
  }
}

void tapUnprepare(MTAudioProcessingTapRef tap) {
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);
  if (context && context->timePitchUnit) {
    AudioUnitUninitialize(context->timePitchUnit);
    AudioComponentInstanceDispose(context->timePitchUnit);
    context->timePitchUnit = NULL;
  }
}

void tapProcess(MTAudioProcessingTapRef tap, CMItemCount numberFrames, MTAudioProcessingTapFlags flags, AudioBufferList *bufferListInOut, CMItemCount *numberFramesOut, MTAudioProcessingTapFlags *flagsOut) {
  AVAudioTapProcessorContext *context = (AVAudioTapProcessorContext *)MTAudioProcessingTapGetStorage(tap);

  BOOL pitched = NO;
  if (context && context->timePitchUnit && context->pitchCents != 0.0f) {
    // Flush buffered samples after a discontinuity (seek), on the audio thread.
    if (context->needsReset) {
      AudioUnitReset(context->timePitchUnit, kAudioUnitScope_Global, 0);
      context->needsReset = false;
    }

    // Apply the latest pitch value here (audio thread) rather than from the setter,
    // so the unit is only ever touched from one thread. Skip if unchanged.
    if (context->pitchCents != context->appliedPitchCents) {
      AudioUnitSetParameter(context->timePitchUnit, kNewTimePitchParam_Pitch, kAudioUnitScope_Global, 0, context->pitchCents, 0);
      context->appliedPitchCents = context->pitchCents;
    }

    // Render source audio through the NewTimePitch unit, writing the result back
    // into bufferListInOut (the buffers AVFoundation plays). The unit pulls the
    // source audio itself via PitchUnitInputCallback.
    AudioTimeStamp timeStamp = {0};
    timeStamp.mSampleTime = context->sampleTime;
    timeStamp.mFlags = kAudioTimeStampSampleTimeValid;
    AudioUnitRenderActionFlags renderFlags = 0;

    OSStatus renderStatus = AudioUnitRender(context->timePitchUnit, &renderFlags, &timeStamp, 0, (UInt32)numberFrames, bufferListInOut);
    if (renderStatus == noErr) {
      context->sampleTime += numberFrames;
      if (numberFramesOut) {
        *numberFramesOut = numberFrames;
      }
      if (flagsOut) {
        *flagsOut = 0;
      }
      pitched = YES;
    }
    // On failure we fall through to passthrough below. No logging here: this runs
    // on the real-time audio thread where NSLog must not be called.
  }

  if (!pitched) {
    OSStatus status = MTAudioProcessingTapGetSourceAudio(tap, numberFrames, bufferListInOut, flagsOut, NULL, numberFramesOut);
    if (status != noErr) {
      return;
    }
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
