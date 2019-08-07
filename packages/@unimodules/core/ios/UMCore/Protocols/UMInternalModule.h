// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMDefines.h>

// Register a class implementing this protocol in UMModuleClasses
// of UMModuleRegistryProvider (macros defined in UMDefines.h should help you)
// to make the module available under any of `exportedInterfaces`
// via UMModuleRegistry.

@protocol UMInternalModule <NSObject>

- (instancetype)init;
+ (const NSArray<Protocol *> *)exportedInterfaces;

@end
