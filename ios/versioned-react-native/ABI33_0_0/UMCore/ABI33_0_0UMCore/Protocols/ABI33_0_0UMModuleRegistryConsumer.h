// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistry.h>

// Implement this protocol in any module registered
// in ABI33_0_0UMModuleRegistry to receive an instance of the module registry
// when it's initialized (ready to provide references to other modules).

@protocol ABI33_0_0UMModuleRegistryConsumer <NSObject>

- (void)setModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry;

@end
