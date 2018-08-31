// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXSpeech.h"
#import <ReactABI30_0_0/ABI30_0_0RCTEventEmitter.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventDispatcher.h>
#import <AVFoundation/AVFoundation.h>

@interface ABI30_0_0EXSpeechUtteranceWithId : AVSpeechUtterance

@property (nonatomic) NSString* utteranceId;

- (instancetype)initWithString:(NSString *)string utteranceId:(NSString *)utteranceId;

@end

@implementation ABI30_0_0EXSpeechUtteranceWithId

- (instancetype)initWithString:(NSString *)string utteranceId:(NSString *)utteranceId
{
  self = [super initWithString:string];
  if (self) {
    _utteranceId = utteranceId;
  }
  return self;
}

@end

@interface ABI30_0_0EXSpeech () <AVSpeechSynthesizerDelegate>

@property (nonatomic, strong) AVSpeechSynthesizer *synthesizer;

@end

@implementation ABI30_0_0EXSpeech

ABI30_0_0RCT_EXPORT_MODULE(ExponentSpeech)

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Exponent.speakingStarted", @"Exponent.speakingDone", @"Exponent.speakingStopped", @"Exponent.speakingError"];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
  didStartSpeechUtterance:(AVSpeechUtterance *)utterance
{
  [self sendEventWithName:@"Exponent.speakingStarted" body:@{ @"id": ((ABI30_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
 didCancelSpeechUtterance:(AVSpeechUtterance *)utterance
{
  [self sendEventWithName:@"Exponent.speakingStopped" body:@{ @"id": ((ABI30_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer
 didFinishSpeechUtterance:(AVSpeechUtterance *)utterance
{
  [self sendEventWithName:@"Exponent.speakingDone" body:@{ @"id": ((ABI30_0_0EXSpeechUtteranceWithId *) utterance).utteranceId }];
}


  ABI30_0_0RCT_EXPORT_METHOD(speak:(nonnull NSString *)utteranceId text:(nonnull NSString *)text options:(NSDictionary *)options) {
    if (_synthesizer == nil) {
      _synthesizer = [[AVSpeechSynthesizer alloc] init];
      _synthesizer.delegate = self;
    }
    
    AVSpeechUtterance *utterance = [[ABI30_0_0EXSpeechUtteranceWithId alloc] initWithString:text utteranceId:utteranceId];
    
    NSString *language = options[@"language"];
    NSNumber *pitch = options[@"pitch"];
    NSNumber *rate = options[@"rate"];
    
    if (language != nil) {
      utterance.voice = [AVSpeechSynthesisVoice voiceWithLanguage:language];
    }
    if (pitch != nil) {
      utterance.pitchMultiplier = [pitch floatValue];
    }
    if (rate != nil) {
      utterance.rate = [rate floatValue] * AVSpeechUtteranceDefaultSpeechRate;
    }
    
    [_synthesizer speakUtterance:utterance];
  }
  
  ABI30_0_0RCT_EXPORT_METHOD(stop) {
    [_synthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  }

  ABI30_0_0RCT_EXPORT_METHOD(pause) {
    [_synthesizer pauseSpeakingAtBoundary:AVSpeechBoundaryImmediate];
  }

  ABI30_0_0RCT_EXPORT_METHOD(resume) {
    [_synthesizer continueSpeaking];
  }
  
  ABI30_0_0RCT_REMAP_METHOD(isSpeaking, resolver:(ABI30_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI30_0_0RCTPromiseRejectBlock)reject) {
    resolve(@([_synthesizer isSpeaking]));
  }
  
  @end
  
