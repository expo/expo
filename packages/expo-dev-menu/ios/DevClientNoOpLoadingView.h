// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<React/RCTDevLoadingViewProtocol.h>)

#import <React/RCTDefines.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTDevLoadingViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@interface DevClientNoOpLoadingView : NSObject <RCTDevLoadingViewProtocol, RCTBridgeModule>

@end

NS_ASSUME_NONNULL_END

#endif
