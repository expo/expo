//
//  EXRevisionIdManifestComparator.h
//  EXOta
//
//  Created by Michał Czernek on 14/10/2019.
//

#import <Foundation/Foundation.h>
#import <EXOta/EXOtaUpdater.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXRevisionIdManifestComparator : NSObject<ManifestComparator>

-(id) initWithNativeComparator:(id<ManifestComparator>)nativeComparator;

@end

NS_ASSUME_NONNULL_END
