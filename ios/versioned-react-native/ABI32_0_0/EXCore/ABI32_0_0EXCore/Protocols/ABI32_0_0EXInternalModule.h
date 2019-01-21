// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXDefines.h>

// Register a class implementing this protocol in ABI32_0_0EXModuleClasses
// of ABI32_0_0EXModuleRegistryProvider (macros defined in ABI32_0_0EXDefines.h should help you)
// to make the module available under any of `exportedInterfaces`
// via ABI32_0_0EXModuleRegistry. ABI32_0_0EXModuleRegistryProvider will initialize your class
// `initWithExperienceId:` if you implement this method.

@protocol ABI32_0_0EXInternalModule <NSObject>

- (instancetype)init;
+ (const NSArray<Protocol *> *)exportedInterfaces;

@optional

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end
