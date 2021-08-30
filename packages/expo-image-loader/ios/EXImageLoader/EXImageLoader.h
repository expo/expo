// Copyright 2019-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXImageLoaderInterface.h>
#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface EXImageLoader : NSObject <RCTBridgeModule, EXInternalModule, EXImageLoaderInterface>

@end
