// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistry.h>

// Implement this protocol in any module registered
// in EXModuleRegistry to receive an instance of the module registry
// when it's initialized (ready to provide references to other modules).

@protocol EXModuleRegistryConsumer <NSObject>

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry;

@end
