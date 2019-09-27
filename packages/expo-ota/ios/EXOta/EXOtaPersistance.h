//
//  EXOtaPersistance.h
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import <Foundation/Foundation.h>
#import "EXKeyValueStorage.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXOtaPersistance : NSObject

-(id )initWithStorage:(EXKeyValueStorage*)storage andId:(NSString*)appId;

-(void)storeManifest:(NSDictionary*)manifest withBundle:(NSData*)bundle;

-(void)markDownloadedAsCurrent;

-(void)removeDownloadedBundle;

-(NSDictionary*)readManifest;

-(NSString*)bundlePath;

@end

NS_ASSUME_NONNULL_END
