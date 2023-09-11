// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVFoundation/AVFoundation.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXEventEmitterService.h>
#import <ABI47_0_0EXSpeech/ABI47_0_0EXSpeech.h>

@interface ABI47_0_0EXSpeechUtteranceWithId : AVSpeechUtterance

@property (nonatomic) NSString* utteranceId;

- (instancetype)initWithString:(NSString *)string utteranceId:(NSString *)utteranceId;

@end

@implementation ABI47_0_0EXSpeechUtteranceWithId

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

@interface ABI47_0_0EXSpeech () <AVSpeechSynthesizerDelegate>

@property (nonatomic, strong) AVSpeechSynthesizer *synthesizer;
@property (nonatomic, weak) ABI47_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI47_0_0EXSpeech

ABI47_0_0EX_EXPORT_MODULE(ExponentSpeech)

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
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
  id<ABI47_0_0EXEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingStarted" body:@{ @"id": ((ABI47_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
 didCancelSpeechUtterance:(AVSpeechUtterance *)utterance
{
  id<ABI47_0_0EXEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingStopped" body:@{ @"id": ((ABI47_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
 didFinishSpeechUtterance:(AVSpeechUtterance *)utterance
{
  id<ABI47_0_0EXEventEmitterService> emitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXEventEmitterService)];
  if (emitter != nil) {
    [emitter sendEventWithName:@"Exponent.speakingDone" body:@{ @"id": ((ABI47_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
  }
}


ABI47_0_0EX_EXPORT_METHOD_AS(speak,
                    speak:(nonnull NSString *)utteranceId
                    text:(nonnull NSString *)text
                    options:(NSDictionary *)options
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  if (_synthesizer == nil) {
    _synthesizer = [[AVSpeechSynthesizer alloc] init];
    _synthesizer.delegate = self;
  }

  AVSpeechUtterance *utterance = [[ABI47_0_0EXSpeechUtteranceWithId alloc] initWithString:text utteranceId:utteranceId];

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

ABI47_0_0EX_EXPORT_METHOD_AS(getVoices,
                    getVoices:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
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

ABI47_0_0EX_EXPORT_METHOD_AS(stop,
                    stop:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  [_synthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  resolve(nil);
}

ABI47_0_0EX_EXPORT_METHOD_AS(pause,
                    pause:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  [_synthesizer pauseSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  resolve(nil);
}

ABI47_0_0EX_EXPORT_METHOD_AS(resume,
                    resume:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  [_synthesizer continueSpeaking];
  resolve(nil);
}

ABI47_0_0EX_EXPORT_METHOD_AS(isSpeaking,
                    isSpeaking:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject) {
  resolve(@([_synthesizer isSpeaking]));
}

@end
  
