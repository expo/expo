// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ExpoModulesCore/EXEventEmitterService.h>
#import <EXSpeech/EXSpeech.h>

@interface EXSpeechUtteranceWithId : AVSpeechUtterance

@property (nonatomic) NSString* utteranceId;

- (instancetype)initWithString:(NSString *)string utteranceId:(NSString *)utteranceId;

@end

@implementation EXSpeechUtteranceWithId

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

@interface EXSpeech () <AVSpeechSynthesizerDelegate>

@property (nonatomic, strong) AVSpeechSynthesizer *synthesizer;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXSpeech

EX_EXPORT_MODULE(ExponentSpeech)

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
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
  id<EXEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingStarted" body:@{ @"id": ((EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
 didCancelSpeechUtterance:(AVSpeechUtterance *)utterance
{
  id<EXEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingStopped" body:@{ @"id": ((EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
 didFinishSpeechUtterance:(AVSpeechUtterance *)utterance
{
  id<EXEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingDone" body:@{ @"id": ((EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}


EX_EXPORT_METHOD_AS(speak,
                    speak:(nonnull NSString *)utteranceId
                    text:(nonnull NSString *)text
                    options:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  if (_synthesizer == nil) {
    _synthesizer = [[AVSpeechSynthesizer alloc] init];
    _synthesizer.delegate = self;
  }

  AVSpeechUtterance *utterance = [[EXSpeechUtteranceWithId alloc] initWithString:text utteranceId:utteranceId];

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

EX_EXPORT_METHOD_AS(getVoices,
                    getVoices:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
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

EX_EXPORT_METHOD_AS(stop,
                    stop:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [_synthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(pause,
                    pause:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [_synthesizer pauseSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(resume,
                    resume:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  [_synthesizer continueSpeaking];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(isSpeaking,
                    isSpeaking:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  resolve(@([_synthesizer isSpeaking]));
}

@end
  
