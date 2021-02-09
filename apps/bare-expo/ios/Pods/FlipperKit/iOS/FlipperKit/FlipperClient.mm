/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "FlipperClient.h"
#import <Flipper/FlipperCertificateProvider.h>
#import <Flipper/FlipperClient.h>
#import <UIKit/UIKit.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/ScopedEventBaseThread.h>
#include <memory>
#import "FlipperClient+Testing.h"
#import "FlipperCppWrapperPlugin.h"
#import "FlipperKitCertificateProvider.h"
#import "SKEnvironmentVariables.h"
#include "SKStateUpdateCPPWrapper.h"
#if !TARGET_OS_SIMULATOR
#import <FKPortForwarding/FKPortForwardingServer.h>
#endif

using WrapperPlugin = facebook::flipper::FlipperCppWrapperPlugin;

@implementation FlipperClient {
  facebook::flipper::FlipperClient* _cppClient;
  folly::ScopedEventBaseThread sonarThread;
  folly::ScopedEventBaseThread connectionThread;
  id<FlipperKitCertificateProvider> _certProvider;
#if !TARGET_OS_SIMULATOR
  FKPortForwardingServer* _secureServer;
  FKPortForwardingServer* _insecureServer;
#endif
}

+ (instancetype)sharedClient {
  static FlipperClient* sharedClient = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    try {
      sharedClient = [[self alloc] init];
    } catch (const std::exception& e) {
      // fail.
      sharedClient = nil;
    }
  });
  return sharedClient;
}
- (instancetype)init {
  if (self = [super init]) {
    UIDevice* device = [UIDevice currentDevice];
    NSString* deviceName = [device name];
    NSBundle* bundle = [NSBundle mainBundle];
    NSString* appName =
        [bundle objectForInfoDictionaryKey:(NSString*)kCFBundleNameKey];
    NSString* appId = [bundle bundleIdentifier];
    NSString* privateAppDirectory = NSSearchPathForDirectoriesInDomains(
        NSApplicationSupportDirectory, NSUserDomainMask, YES)[0];
    NSFileManager* manager = [NSFileManager defaultManager];
    if ([manager fileExistsAtPath:privateAppDirectory isDirectory:NULL] == NO &&
        ![manager createDirectoryAtPath:privateAppDirectory
            withIntermediateDirectories:YES
                             attributes:nil
                                  error:nil]) {
      return nil;
    }

#if TARGET_OS_SIMULATOR
    deviceName = [NSString stringWithFormat:@"%@ %@",
                                            [[UIDevice currentDevice] model],
                                            @"Simulator"];
#endif

    static const std::string UNKNOWN = std::string("unknown");
    try {
      facebook::flipper::FlipperClient::init(
          {{
               "localhost",
               "iOS",
               [deviceName UTF8String],
               UNKNOWN,
               [appName UTF8String] ?: UNKNOWN,
               [appId UTF8String] ?: UNKNOWN,
               [privateAppDirectory UTF8String],
           },
           sonarThread.getEventBase(),
           connectionThread.getEventBase(),
           [SKEnvironmentVariables getInsecurePort],
           [SKEnvironmentVariables getSecurePort]});
      _cppClient = facebook::flipper::FlipperClient::instance();
    } catch (const std::system_error& e) {
      // Probably ran out of disk space.
      return nil;
    }
  }
  return self;
}

- (void)setCertificateProvider:(id<FlipperKitCertificateProvider>)provider {
  _certProvider = provider;
  std::shared_ptr<facebook::flipper::FlipperCertificateProvider>* prov =
      static_cast<
          std::shared_ptr<facebook::flipper::FlipperCertificateProvider>*>(
          [provider getCPPCertificateProvider]);
  _cppClient->setCertificateProvider(*prov);
}

- (id<FlipperKitCertificateProvider>)getCertificateProvider {
  return _certProvider;
}

- (void)refreshPlugins {
  _cppClient->refreshPlugins();
}

- (void)addPlugin:(NSObject<FlipperPlugin>*)plugin {
  _cppClient->addPlugin(std::make_shared<WrapperPlugin>(plugin));
}

- (void)removePlugin:(NSObject<FlipperPlugin>*)plugin {
  _cppClient->removePlugin(std::make_shared<WrapperPlugin>(plugin));
}

- (NSObject<FlipperPlugin>*)pluginWithIdentifier:(NSString*)identifier {
  auto cppPlugin = _cppClient->getPlugin([identifier UTF8String]);
  if (auto wrapper = dynamic_cast<WrapperPlugin*>(cppPlugin.get())) {
    return wrapper->getObjCPlugin();
  }
  return nil;
}

- (void)start {
#if !TARGET_OS_SIMULATOR
  _secureServer = [FKPortForwardingServer new];
  [_secureServer forwardConnectionsFromPort:8088];
  [_secureServer listenForMultiplexingChannelOnPort:8078];
  _insecureServer = [FKPortForwardingServer new];
  [_insecureServer forwardConnectionsFromPort:8089];
  [_insecureServer listenForMultiplexingChannelOnPort:8079];
#endif
  _cppClient->start();
}

- (void)stop {
  _cppClient->stop();
#if !TARGET_OS_SIMULATOR
  [_secureServer close];
  _secureServer = nil;
  [_insecureServer close];
  _insecureServer = nil;
#endif
}

- (NSString*)getState {
  return @(_cppClient->getState().c_str());
}

- (NSArray*)getStateElements {
  NSMutableArray<NSDictionary<NSString*, NSString*>*>* const array =
      [NSMutableArray array];

  for (facebook::flipper::StateElement element :
       _cppClient->getStateElements()) {
    facebook::flipper::State state = element.state_;
    NSString* stateString;
    switch (state) {
      case facebook::flipper::in_progress:
        stateString = @"⏳ ";
        break;

      case facebook::flipper::success:
        stateString = @"✅ ";
        break;

      case facebook::flipper::failed:
        stateString = @"❌ ";
        break;

      default:
        stateString = @"❓ ";
        break;
    }
    [array addObject:@{
      @"name" : [NSString stringWithUTF8String:element.name_.c_str()],
      @"state" : stateString
    }];
  }
  return array;
}

- (void)subscribeForUpdates:(id<FlipperStateUpdateListener>)controller {
  auto stateListener = std::make_shared<SKStateUpdateCPPWrapper>(controller);
  _cppClient->setStateListener(stateListener);
}

@end

@implementation FlipperClient (Testing)

- (instancetype)initWithCppClient:(facebook::flipper::FlipperClient*)cppClient {
  if (self = [super init]) {
    _cppClient = cppClient;
  }
  return self;
}

@end

#endif
