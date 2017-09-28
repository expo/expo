// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

typedef enum EXKernelDevManifestSource {
  kEXKernelDevManifestSourceNone,
  kEXKernelDevManifestSourceLocal,
  kEXKernelDevManifestSourcePublished,
} EXKernelDevManifestSource;

@interface EXBuildConstants : NSObject

+ (instancetype)sharedInstance;

@property (nonatomic, readonly) BOOL isDevKernel;
@property (nonatomic, readonly) EXKernelDevManifestSource kernelDevManifestSource;
@property (nonatomic, readonly) NSString *kernelManifestJsonString;
@property (nonatomic, strong) NSString *temporarySdkVersion;
@property (nonatomic, strong) NSString *expoKitDevelopmentUrl;
@property (nonatomic, strong) NSString *expoRuntimeVersion;

@end
