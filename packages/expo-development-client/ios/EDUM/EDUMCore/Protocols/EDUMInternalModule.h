// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMDefines.h>

// Register a class implementing this protocol in EDUMModuleClasses
// of EDUMModuleRegistryProvider (macros defined in EDUMDefines.h should help you)
// to make the module available under any of `exportedInterfaces`
// via EDUMModuleRegistry.

@protocol EDUMInternalModule <NSObject>

- (instancetype)init;
+ (const NSArray<Protocol *> *)exportedInterfaces;

@end
