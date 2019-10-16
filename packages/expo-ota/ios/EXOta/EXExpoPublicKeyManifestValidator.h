//
//  EXExpoPublicKeyManifestValidator.h
//  EXOta
//
//  Created by Michał Czernek on 16/10/2019.
//

#import <Foundation/Foundation.h>
#import "EXOta.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXExpoPublicKeyManifestValidator: NSObject<ManifestResponseValidator>

- (id)initWithPublicKeyUrl:(NSString*)publicKeyUrl andTimeout:(NSInteger)timeout;

@end

NS_ASSUME_NONNULL_END
