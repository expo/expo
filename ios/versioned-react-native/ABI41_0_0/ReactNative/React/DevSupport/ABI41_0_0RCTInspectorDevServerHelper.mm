/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTInspectorDevServerHelper.h>

#if ABI41_0_0RCT_DEV

#import <ABI41_0_0React/ABI41_0_0RCTLog.h>
#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTDefines.h>
#import <ABI41_0_0React/ABI41_0_0RCTInspectorPackagerConnection.h>

static NSString *const kDebuggerMsgDisable = @"{ \"id\":1,\"method\":\"Debugger.disable\" }";

static NSString *getServerHost(NSURL *bundleURL, NSNumber *port)
{
  NSString *host = [bundleURL host];
  if (!host) {
    host = @"localhost";
  }

  // this is consistent with the Android implementation, where http:// is the
  // hardcoded implicit scheme for the debug server. Note, packagerURL
  // technically looks like it could handle schemes/protocols other than HTTP,
  // so rather than force HTTP, leave it be for now, in case someone is relying
  // on that ability when developing against iOS.
  return [NSString stringWithFormat:@"%@:%@", host, port];
}

static NSURL *getInspectorDeviceUrl(NSURL *bundleURL)
{
  NSNumber *inspectorProxyPort = @8081;
  NSString *inspectorProxyPortStr = [[[NSProcessInfo processInfo] environment] objectForKey:@"ABI41_0_0RCT_METRO_PORT"];
  if (inspectorProxyPortStr && [inspectorProxyPortStr length] > 0) {
    inspectorProxyPort = [NSNumber numberWithInt:[inspectorProxyPortStr intValue]];
  }
  NSString *escapedDeviceName = [[[UIDevice currentDevice] name]
      stringByAddingPercentEncodingWithAllowedCharacters:NSCharacterSet.URLQueryAllowedCharacterSet];
  NSString *escapedAppName = [[[NSBundle mainBundle] bundleIdentifier]
      stringByAddingPercentEncodingWithAllowedCharacters:NSCharacterSet.URLQueryAllowedCharacterSet];
  return [NSURL URLWithString:[NSString stringWithFormat:@"http://%@/inspector/device?name=%@&app=%@",
                                                         getServerHost(bundleURL, inspectorProxyPort),
                                                         escapedDeviceName,
                                                         escapedAppName]];
}

@implementation ABI41_0_0RCTInspectorDevServerHelper

ABI41_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

static NSMutableDictionary<NSString *, ABI41_0_0RCTInspectorPackagerConnection *> *socketConnections = nil;

static void sendEventToAllConnections(NSString *event)
{
  for (NSString *socketId in socketConnections) {
    [socketConnections[socketId] sendEventToAllConnections:event];
  }
}

+ (void)disableDebugger
{
  sendEventToAllConnections(kDebuggerMsgDisable);
}

+ (ABI41_0_0RCTInspectorPackagerConnection *)connectWithBundleURL:(NSURL *)bundleURL
{
  NSURL *inspectorURL = getInspectorDeviceUrl(bundleURL);

  // Note, using a static dictionary isn't really the greatest design, but
  // the packager connection does the same thing, so it's at least consistent.
  // This is a static map that holds different inspector clients per the inspectorURL
  if (socketConnections == nil) {
    socketConnections = [NSMutableDictionary new];
  }

  NSString *key = [inspectorURL absoluteString];
  ABI41_0_0RCTInspectorPackagerConnection *connection = socketConnections[key];
  if (!connection || !connection.isConnected) {
    connection = [[ABI41_0_0RCTInspectorPackagerConnection alloc] initWithURL:inspectorURL];
    socketConnections[key] = connection;
    [connection connect];
  }

  return connection;
}

@end

#endif
