//
//  EXOtaEvents.h
//  DoubleConversion
//
//  Created by Michał Czernek on 31/10/2019.
//

#import <Foundation/Foundation.h>
#import <UMCore/UMEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXOtaEvents : NSObject

- (NSArray<NSString*>*)supportedEvents;
- (id)initWithEmitter:(id<UMEventEmitterService>)emitter;
- (void)emitError;
- (void)emitNoUpdateAvailable;
- (void)emitDownloadStart;
- (void)emitDownloadFinished;

@end

NS_ASSUME_NONNULL_END
