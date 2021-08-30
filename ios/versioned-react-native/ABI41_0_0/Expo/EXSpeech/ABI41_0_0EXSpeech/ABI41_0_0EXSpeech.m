// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitterService.h>
#import <ABI41_0_0EXSpeech/ABI41_0_0EXSpeech.h>

@interface ABI41_0_0EXSpeechUtteranceWithId : AVSpeechUtterance

@property (nonatomic) NSString* utteranceId;

- (instancetype)initWithString:(NSString *)string utteranceId:(NSString *)utteranceId;

@end

@implementation ABI41_0_0EXSpeechUtteranceWithId

static NSString *const INVALID_VOICE_ERROR_CODE = @"INVALID_VOICE_IDENTIFIER";
static NSString *const INVALID_VOICE_ERROR_MSG = @"Cannot find voice with identifier: %@!";

- (instancetype)initWithString:(NSString *)string utteranceId:(NSString *)utteranceId
{
  self = [super initWithString:string];
  if (self) {
    _utteranceId = utteranceId;
  }
  return self;
}

@end

@interface ABI41_0_0EXSpeech () <AVSpeechSynthesizerDelegate>

@property (nonatomic, strong) AVSpeechSynthesizer *synthesizer;
@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI41_0_0EXSpeech

ABI41_0_0UM_EXPORT_MODULE(ExponentSpeech)

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Exponent.speakingStarted", @"Exponent.speakingDone", @"Exponent.speakingStopped", @"Exponent.speakingError"];
}

- (void)startObserving {
}


- (void)stopObserving {
}


- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
  didStartSpeechUtterance:(AVSpeechUtterance *)utterance
{
  id<ABI41_0_0UMEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingStarted" body:@{ @"id": ((ABI41_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
 didCancelSpeechUtterance:(AVSpeechUtterance *)utterance
{
  id<ABI41_0_0UMEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingStopped" body:@{ @"id": ((ABI41_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
 didFinishSpeechUtterance:(AVSpeechUtterance *)utterance
{
  id<ABI41_0_0UMEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingDone" body:@{ @"id": ((ABI41_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}


ABI41_0_0UM_EXPORT_METHOD_AS(speak,
                    speak:(nonnull NSString *)utteranceId
                    text:(nonnull NSString *)text
                    options:(NSDictionary *)options
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  if (_synthesizer == nil) {
    _synthesizer = [[AVSpeechSynthesizer alloc] init];
    _synthesizer.delegate = self;
  }

  AVSpeechUtterance *utterance = [[ABI41_0_0EXSpeechUtteranceWithId alloc] initWithString:text utteranceId:utteranceId];

  NSString *language = options[@"language"];
  NSString *voice = options[@"voice"];
  NSNumber *pitch = options[@"pitch"];
  NSNumber *rate = options[@"rate"];

  if (language != nil) {
    utterance.voice = [AVSpeechSynthesisVoice voiceWithLanguage:language];
  }
  if (voice != nil) {
    utterance.voice = [AVSpeechSynthesisVoice voiceWithIdentifier:voice];
    if (utterance.voice == nil) {
      reject(INVALID_VOICE_ERROR_CODE, [NSString stringWithFormat:INVALID_VOICE_ERROR_MSG, voice], nil);
      return;
    }
  }
  if (pitch != nil) {
    utterance.pitchMultiplier = [pitch floatValue];
  }
  if (rate != nil) {
    utterance.rate = [rate floatValue] * AVSpeechUtteranceDefaultSpeechRate;
  }

  [_synthesizer speakUtterance:utterance];
  resolve(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(getVoices,
                    getVoices:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  NSArray<AVSpeechSynthesisVoice *> *availableVoices = [AVSpeechSynthesisVoice speechVoices];
  NSMutableArray<NSDictionary *> *availableVoicesResult = [NSMutableArray array];
  for (AVSpeechSynthesisVoice* voice in availableVoices) {
    NSString *quality = @"Default";
    if (voice.quality == AVSpeechSynthesisVoiceQualityEnhanced) {
      quality = @"Enhanced";
    }
    NSDictionary *voiceInfo = @{
                                @"identifier" : voice.identifier,
                                @"name"       : voice.name,
                                @"quality"    : quality,
                                @"language"   : voice.language
                                };
    [availableVoicesResult addObject:voiceInfo];
  }
  resolve([availableVoicesResult mutableCopy]);
}

ABI41_0_0UM_EXPORT_METHOD_AS(stop,
                    stop:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  [_synthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  resolve(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(pause,
                    pause:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  [_synthesizer pauseSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  resolve(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(resume,
                    resume:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  [_synthesizer continueSpeaking];
  resolve(nil);
}

ABI41_0_0UM_EXPORT_METHOD_AS(isSpeaking,
                    isSpeaking:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject) {
  resolve(@([_synthesizer isSpeaking]));
}

@end
  
