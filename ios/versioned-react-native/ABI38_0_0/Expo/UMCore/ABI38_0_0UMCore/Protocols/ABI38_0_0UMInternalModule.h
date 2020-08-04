// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMDefines.h>

// Register a class implementing this protocol in ABI38_0_0UMModuleClasses
// of ABI38_0_0UMModuleRegistryProvider (macros defined in ABI38_0_0UMDefines.h should help you)
// to make the module available under any of `exportedInterfaces`
// via ABI38_0_0UMModuleRegistry.

@protocol ABI38_0_0UMInternalModule <NSObject>

- (instancetype)init;
+ (const NSArray<Protocol *> *)exportedInterfaces;

@end
