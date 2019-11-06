// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<EXFacebook/EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <EXFacebook/EXFacebook.h>
#import <UMCore/UMAppLifecycleListener.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@interface EXScopedFacebook : EXFacebook <UMAppLifecycleListener, UMModuleRegistryConsumer>

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params;

@end
#endif
