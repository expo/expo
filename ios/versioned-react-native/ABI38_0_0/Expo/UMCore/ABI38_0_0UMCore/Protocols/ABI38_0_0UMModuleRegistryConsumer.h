// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistry.h>

// Implement this protocol in any module registered
// in ABI38_0_0UMModuleRegistry to receive an instance of the module registry
// when it's initialized (ready to provide references to other modules).

@protocol ABI38_0_0UMModuleRegistryConsumer <NSObject>

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry;

@end
