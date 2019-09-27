//
//  EXOta.h
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import <Foundation/Foundation.h>
#import "EXOtaUpdater.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXManifestComparator

- (NSInteger) compare:(NSDictionary*)first with:(NSDictionary*)second;

@end

@protocol EXOtaConfig

@property (readonly) id<EXManifestRequestConfig> manifestConfig;
@property (readonly) id<EXManifestComparator> manifestComparator;
@property (atomic, readonly) NSInteger bundleDownloadTimeout;

@end

@interface EXOta : NSObject

@end

NS_ASSUME_NONNULL_END
