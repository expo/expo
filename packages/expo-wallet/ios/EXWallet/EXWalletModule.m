// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXWallet/EXWalletModule.h>
#import <UMCore/UMUtilities.h>
#import <PassKit/PassKit.h>

@interface EXWalletModule ()<PKAddPassesViewControllerDelegate>

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id <UMEventEmitterService> eventEmitter;
@property (nonatomic, assign) BOOL hasListeners;
@property (nonatomic, strong) PKPass *pass;
@property (nonatomic, strong) PKPassLibrary *passLibrary;
@end

@implementation EXWalletModule

UM_EXPORT_MODULE(ExpoWallet);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Expo.addPassesViewControllerDidFinish"];
}

- (void)startObserving
{
  _hasListeners = YES;
}

- (void)stopObserving
{
  _hasListeners = NO;
}

- (void)invalidate
{
  _eventEmitter = nil;
}

UM_EXPORT_METHOD_AS(canAddPassesAsync, canAddPassesAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve(@([PKAddPassesViewController canAddPasses]));
}

UM_EXPORT_METHOD_AS(addPassFromUrlAsync, addPassFromUrlAsync:(NSString *)passFromUrl addPassFromUrlAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  NSURL *passUrl = [[NSURL alloc] initWithString:passFromUrl];
  if (!passUrl) {
    reject(@"ERR_WALLET_INVALID_PASS", @"The Url does not have valid passes", nil);
    return;
  }

  NSData *data = [[NSData alloc] initWithContentsOfURL:passUrl];
  if (!data) {
    reject(@"ERR_WALLET_INVALID_PASS", @"The Url does not have valid passes", nil);
    return;
  }

  [self addPasses:data resolver:resolve rejecter:reject];
}

- (void) addPasses:(NSData *)passData resolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject{
  NSError *parsePassErr;
  self.pass = [[PKPass alloc] initWithData:passData error:&parsePassErr];
  if(parsePassErr != nil){
    reject(@"ERR_WALLET_INVALID_PASS", @"The provided data does not have valid passes", parsePassErr);
    return;
  }
  self.passLibrary = [[PKPassLibrary alloc] init];
  // If pass already in library
  if([self.passLibrary containsPass:(self.pass)]){
    resolve(@(YES));
    return;
  }
  dispatch_async(dispatch_get_main_queue(), ^{
    UIViewController *viewController = [UIApplication sharedApplication].keyWindow.rootViewController;
    if (viewController) {
      PKAddPassesViewController *passController = [[PKAddPassesViewController alloc] initWithPass:self.pass];
      passController.delegate = self;
      [viewController presentViewController:passController animated:YES completion:^{
        resolve(@(YES));
      }];
      return;
    }
    reject(@"ERR_WALLET_VIEW_PASS_FAILED", @"Failed to present PKAddPassesViewController.", nil);
  });

}

#pragma mark - PKAddPassesViewControllerDelegate

- (void)addPassesViewControllerDidFinish:(PKAddPassesViewController *)controller {
  [controller dismissViewControllerAnimated:YES completion:^{
    if (self->_hasListeners) {
      [self->_eventEmitter sendEventWithName:@"Expo.addPassesViewControllerDidFinish" body:nil];
    }
    // Clean up
    controller.delegate = nil;
    self.passLibrary = nil;
    self.pass = nil;
  }];
}
@end
