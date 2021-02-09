// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXFacebook/ABI38_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI38_0_0EXFacebook/ABI38_0_0EXFacebook.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMAppLifecycleListener.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

@interface ABI38_0_0EXScopedFacebook : ABI38_0_0EXFacebook <ABI38_0_0UMAppLifecycleListener, ABI38_0_0UMModuleRegistryConsumer>

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
