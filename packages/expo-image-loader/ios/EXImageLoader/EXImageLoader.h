// Copyright 2019-present 650 Industries. All rights reserved.

#import <UMCore/UMInternalModule.h>
#import <UMImageLoaderInterface/UMImageLoaderInterface.h>
#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface EXImageLoader : NSObject <RCTBridgeModule, UMInternalModule, UMImageLoaderInterface>

@end
