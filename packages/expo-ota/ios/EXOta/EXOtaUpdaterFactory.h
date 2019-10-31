//
//  EXOtaEventsFactory.h
//  DoubleConversion
//
//  Created by Michał Czernek on 31/10/2019.
//

#import <Foundation/Foundation.h>
#import <UMCore/UMEventEmitterService.h>
#import "EXOtaUpdater.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXOtaUpdaterFactory : NSObject

- (EXOtaUpdater*)updaterForId:(NSString* _Nullable)identifier initWithConfig:(nonnull id<EXOtaConfig>)config withPersistance:(nonnull EXOtaPersistance *)persistance;

+ (id) sharedFactory;

@end

NS_ASSUME_NONNULL_END
