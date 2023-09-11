// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXSharing/ABI48_0_0EXSharingModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXUtilitiesInterface.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXFileSystemInterface.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXFilePermissionModuleInterface.h>

@interface ABI48_0_0EXSharingModule ()

@property (nonatomic, weak) ABI48_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) UIDocumentInteractionController *documentInteractionController;

@property (nonatomic, strong) ABI48_0_0EXPromiseResolveBlock pendingResolver;

@end

@implementation ABI48_0_0EXSharingModule

ABI48_0_0EX_EXPORT_MODULE(ExpoSharing);

- (void)setModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI48_0_0EX_EXPORT_METHOD_AS(shareAsync,
                    fileUrl:(NSString *)fileUrl
                    params:(NSDictionary *)params
                    resolve:(ABI48_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  if (_documentInteractionController) {
    NSString *errorMessage = @"Another item is being shared. Await the `shareAsync` request and then share the item again.";
    reject(@"E_SHARING_MUL", errorMessage, ABI48_0_0EXErrorWithMessage(errorMessage));
    return;
  }

  NSURL *url = [NSURL URLWithString:fileUrl];

  id<ABI48_0_0EXFilePermissionModuleInterface> filePermissionsModule = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI48_0_0EXFilePermissionModuleInterface)];
  if (filePermissionsModule && !([filePermissionsModule getPathPermissions:url.path] & ABI48_0_0EXFileSystemPermissionRead)) {
    NSString *errorMessage = @"You don't have access to provided file.";
    reject(@"E_SHARING_PERM", errorMessage, ABI48_0_0EXErrorWithMessage(errorMessage));
    return;
  }

  _documentInteractionController = [UIDocumentInteractionController interactionControllerWithURL:url];
  _documentInteractionController.delegate = self;
  _documentInteractionController.UTI = params[@"UTI"];

  ABI48_0_0EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI48_0_0EX_ENSURE_STRONGIFY(self);
    UIViewController *viewController = [[self.moduleRegistry getModuleImplementingProtocol:@protocol(ABI48_0_0EXUtilitiesInterface)] currentViewController];
    UIView *rootView = [viewController view];
    if ([self.documentInteractionController presentOpenInMenuFromRect:CGRectZero inView:rootView animated:YES]) {
      self.pendingResolver = resolve;
    } else {
      reject(@"ERR_SHARING_UNSUPPORTED_TYPE", @"Could not share file since there were no apps registered for its type", nil);
      self.documentInteractionController = nil;
    }
  });
}

- (void)documentInteractionControllerDidDismissOpenInMenu:(UIDocumentInteractionController *)controller
{
  _pendingResolver(nil);
  _pendingResolver = nil;

  // This delegate method is called whenever:
  // a) the share sheet is canceled
  // b) an app is chosen, it's dialog opened, and the share is confirmed/ sent
  // c) an app is chosen, it's dialog opened, and that dialog is canceled
  // In case c), the share sheet remains open, even though the promise was resolved
  // Future attempts to share without closing the sheet will fail to attach the file, so we need to close it
  // No other delegate methods fire only when the share sheet is dismissed, unfortunately
  ABI48_0_0EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI48_0_0EX_ENSURE_STRONGIFY(self);
    [self.documentInteractionController dismissMenuAnimated:true];
    self.documentInteractionController = nil;
  });
}

@end
