//
//  EXCommitTimeManifestComparator.h
//  EXOta
//
//  Created by Michał Czernek on 05/11/2019.
//

#import <Foundation/Foundation.h>
#import "EXOtaUpdater.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXCommitTimeManifestComparator : NSObject<ManifestComparator>

- (id)initWithNativeComparator:(id<ManifestComparator>)nativeComparator;

@end

NS_ASSUME_NONNULL_END
