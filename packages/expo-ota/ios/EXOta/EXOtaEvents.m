//
//  EXOtaEvents.m
//  DoubleConversion
//
//  Created by Michał Czernek on 31/10/2019.
//

#import "EXOtaEvents.h"

@implementation EXOtaEvents
{
  id<UMEventEmitterService> eventEmitter;
}

NSString * const EXUpdatesEventName = @"Exponent.updatesEvent";

NSString * const EXUpdatesErrorEventType = @"error";
NSString * const EXUpdatesNotAvailableEventType = @"noUpdateAvailable";
NSString * const EXUpdatesDownloadStartEventType = @"downloadStart";
NSString * const EXUpdatesDownloadFinishedEventType = @"downloadFinished";

- (id)initWithEmitter:(id<UMEventEmitterService>)emitter;
{
  eventEmitter = emitter;
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXUpdatesEventName];
}

- (void)emitEventWithType:(NSString *)type
{
  [eventEmitter sendEventWithName:EXUpdatesEventName body:@{@"type": type}];
}

- (void)emitError
{
  [self emitEventWithType:EXUpdatesErrorEventType];
}

- (void)emitNoUpdateAvailable
{
  [self emitEventWithType:EXUpdatesNotAvailableEventType];
}

- (void)emitDownloadStart
{
  [self emitEventWithType:EXUpdatesDownloadStartEventType];
}

- (void)emitDownloadFinished
{
  [self emitEventWithType:EXUpdatesDownloadFinishedEventType];
}

@end
