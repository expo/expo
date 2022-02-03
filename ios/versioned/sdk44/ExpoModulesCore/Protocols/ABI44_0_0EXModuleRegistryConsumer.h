// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistry.h>

// Implement this protocol in any module registered
// in ABI44_0_0EXModuleRegistry to receive an instance of the module registry
// when it's initialized (ready to provide references to other modules).

@protocol ABI44_0_0EXModuleRegistryConsumer <NSObject>

- (void)setModuleRegistry:(nonnull ABI44_0_0EXModuleRegistry *)moduleRegistry;

@end
