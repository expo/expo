// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMModuleRegistry.h>

// Implement this protocol in any module registered
// in UMModuleRegistry to receive an instance of the module registry
// when it's initialized (ready to provide references to other modules).

@protocol UMModuleRegistryConsumer <NSObject>

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry;

@end
