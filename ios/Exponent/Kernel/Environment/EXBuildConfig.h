// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXBuildConfig : NSObject

+ (instancetype)sharedInstance;

@property (nonatomic, readonly) BOOL isDevKernel;
@property (nonatomic, readonly) NSString *kernelManifestJsonString;
@property (nonatomic, strong) NSString *temporarySdkVersion;

@end
