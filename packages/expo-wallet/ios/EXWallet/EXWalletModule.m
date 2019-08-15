// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXWallet/EXWalletModule.h>
#import <PassKit/PassKit.h>

@interface EXWalletModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, strong) UMPromiseResolveBlock mResolve;
@property (nonatomic, strong) PKPass *pass;
@property (nonatomic, strong) PKPassLibrary *passLibrary;

@end

@implementation EXWalletModule

UM_EXPORT_MODULE(ExpoWallet);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(canAddPassesAsync, canAddPassesAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve(@([PKAddPassesViewController canAddPasses]));
}

UM_EXPORT_METHOD_AS(addPassFromUrlAsync, addPassFromUrlAsync:(NSString *)passFromUrl addPassFromUrlAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSURL *passUrl = [[NSURL alloc] initWithString:passFromUrl];
    if (!passUrl) {
      reject(@"ERR_WALLET_INVALID_PASS", @"The URL does not have valid passes", nil);
      return;
    }
    
    NSData *data = [[NSData alloc] initWithContentsOfURL:passUrl];
    if (!data) {
      reject(@"ERR_WALLET_INVALID_PASS", @"The URL does not have valid passes", nil);
      return;
    }
    
    [self addPasses:data resolver:resolve rejecter:reject];
  });
}

- (void) addPasses:(NSData *)passData resolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject{
  NSError *parsePassErr;
  self.pass = [[PKPass alloc] initWithData:passData error:&parsePassErr];
  if(parsePassErr != nil){
    reject(@"ERR_WALLET_INVALID_PASS", @"The provided data does not have valid passes", parsePassErr);
    return;
  }
  self.passLibrary = [[PKPassLibrary alloc] init];
  //if pass already in library
  if([self.passLibrary containsPass:(self.pass)]){
    resolve(@(YES));
    return;
  }
  UIViewController *viewController = [UIApplication sharedApplication].keyWindow.rootViewController;
  
  PKAddPassesViewController *passController = [[PKAddPassesViewController alloc] initWithPass:self.pass];
  passController.delegate = self;
  self.mResolve = resolve;
  
  while (viewController.presentedViewController) {
    viewController = viewController.presentedViewController;
  }
  
  [viewController presentViewController:passController animated:YES completion:nil];
}

#pragma mark - PKAddPassesViewControllerDelegate

- (void)addPassesViewControllerDidFinish:(PKAddPassesViewController *)controller {
  [controller dismissViewControllerAnimated:YES completion:^{
    if (self.mResolve) {
      self.mResolve(@([self.passLibrary containsPass:self.pass]));
      self.mResolve = nil;
    }
    //clean up
    controller.delegate = nil;
    self.passLibrary = nil;
    self.pass = nil;
  }];
}
@end
