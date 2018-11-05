// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXDefines.h>

// Register a class implementing this protocol in EXModuleClasses
// of EXModuleRegistryProvider (macros defined in EXDefines.h should help you)
// to make the module available under any of `exportedInterfaces`
// via EXModuleRegistry. EXModuleRegistryProvider will initialize your class
// `initWithExperienceId:` if you implement this method.

@protocol EXInternalModule <NSObject>

- (instancetype)init;
+ (const NSArray<Protocol *> *)exportedInterfaces;

@optional

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end
