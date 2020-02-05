// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMFaceDetectorInterface/UMFaceDetectorManagerProvider.h>

@interface EXFaceDetectorManagerProvider : NSObject <UMInternalModule, UMFaceDetectorManagerProvider, UMModuleRegistryConsumer>

@end
