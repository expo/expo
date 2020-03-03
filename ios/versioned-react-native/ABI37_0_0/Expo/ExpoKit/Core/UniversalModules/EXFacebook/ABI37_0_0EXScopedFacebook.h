// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI37_0_0EXFacebook/ABI37_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI37_0_0EXFacebook/ABI37_0_0EXFacebook.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppLifecycleListener.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

@interface ABI37_0_0EXScopedFacebook : ABI37_0_0EXFacebook <ABI37_0_0UMAppLifecycleListener, ABI37_0_0UMModuleRegistryConsumer>

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
