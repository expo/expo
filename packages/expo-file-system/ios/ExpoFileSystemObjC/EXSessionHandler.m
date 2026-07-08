// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoFileSystem/EXSessionHandler.h>

#import <ExpoModulesCore/EXDefines.h>

@interface EXSessionHandler ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, void (^)(void)> *completionHandlers;

@end

@implementation EXSessionHandler

EX_REGISTER_SINGLETON_MODULE(SessionHandler);

- (instancetype)init
{
  if (self = [super init]) {
    _completionHandlers = [NSMutableDictionary dictionary];
  }
  
  return self;
}

- (void)invokeCompletionHandlerForSessionIdentifier:(NSString *)identifier
{
  if (!identifier) {
    return;
  }
 
  void (^completionHandler)(void) = _completionHandlers[identifier];
  if (completionHandler) {
    // We need to run completionHandler explicite on the main thread because is's part of UIKit
    dispatch_async(dispatch_get_main_queue(), ^{
      completionHandler();
    });
    [_completionHandlers removeObjectForKey:identifier];
  }
}

#pragma mark - AppDelegate

- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)(void))completionHandler
{
  _completionHandlers[identifier] = completionHandler;
}

@end
