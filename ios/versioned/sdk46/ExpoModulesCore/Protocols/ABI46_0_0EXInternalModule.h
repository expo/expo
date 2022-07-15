// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Register a class implementing this protocol in ABI46_0_0EXModuleClasses
// of ABI46_0_0EXModuleRegistryProvider (macros defined in ABI46_0_0EXDefines.h should help you)
// to make the module available under any of `exportedInterfaces`
// via ABI46_0_0EXModuleRegistry.

@protocol ABI46_0_0EXInternalModule <NSObject>

- (instancetype)init;
+ (const NSArray<Protocol *> *)exportedInterfaces;

@end
