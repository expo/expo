// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <React/RCTDevLoadingViewProtocol.h>
#import <React/RCTEventEmitter.h>

@interface EXDisabledDevLoadingView : RCTEventEmitter <RCTDevLoadingViewProtocol, RCTBridgeModule>

@end
