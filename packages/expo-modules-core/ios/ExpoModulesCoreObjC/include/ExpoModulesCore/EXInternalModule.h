// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Register a class implementing this protocol in EXModuleClasses
// of EXModuleRegistryProvider (macros defined in EXDefines.h should help you)
// to make the module available under any of `exportedInterfaces`
// via EXModuleRegistry.

@protocol EXInternalModule <NSObject>

- (instancetype)init;
+ (const NSArray<Protocol *> *)exportedInterfaces;

@end
