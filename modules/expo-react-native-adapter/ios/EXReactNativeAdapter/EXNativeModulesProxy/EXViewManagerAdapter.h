// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTViewManager.h>
#import <EXCore/EXViewManager.h>
#import <EXReactNativeAdapter/EXBridgeModule.h>
#import <EXReactNativeAdapter/EXNativeModulesProxy.h>

@interface EXViewManagerAdapter : RCTViewManager

- (instancetype)initWithViewManager:(id<EXViewManager>)viewManager;

@end
