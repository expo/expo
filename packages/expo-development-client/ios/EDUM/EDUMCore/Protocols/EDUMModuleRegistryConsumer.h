// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMModuleRegistry.h>

// Implement this protocol in any module registered
// in EDUMModuleRegistry to receive an instance of the module registry
// when it's initialized (ready to provide references to other modules).

@protocol EDUMModuleRegistryConsumer <NSObject>

- (void)setModuleRegistry:(EDUMModuleRegistry *)moduleRegistry;

@end
