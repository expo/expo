//
//  EXVersionNumberManifestComparator.h
//  DoubleConversion
//
//  Created by Michał Czernek on 08/10/2019.
//

#import <Foundation/Foundation.h>
#import "EXOtaUpdater.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXVersionNumberManifestComparator : NSObject<ManifestComparator>

- (id)initWithNativeComparator:(id<ManifestComparator>)nativeComparator;

@end

NS_ASSUME_NONNULL_END
