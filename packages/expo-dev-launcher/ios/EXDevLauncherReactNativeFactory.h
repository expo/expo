#pragma once

#if __has_include(<React-RCTAppDelegate/RCTReactNativeFactory.h>)
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
#elif __has_include(<React_RCTAppDelegate/RCTReactNativeFactory.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTReactNativeFactory.h>
#endif

@interface RCTReactNativeFactory () <
    RCTComponentViewFactoryComponentProvider,
    RCTHostDelegate,
    RCTJSRuntimeConfiguratorProtocol,
    RCTTurboModuleManagerDelegate>
@end

@interface EXDevLauncherReactNativeFactory : RCTReactNativeFactory

@end
