// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXSharing/EXSharingModule.h>
#import <ExpoModulesCore/EXUtilitiesInterface.h>
#import <ExpoModulesCore/EXFileSystemInterface.h>
#import <ExpoModulesCore/EXFilePermissionModuleInterface.h>

@interface EXSharingModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) UIDocumentInteractionController *documentInteractionController;

@property (nonatomic, strong) EXPromiseResolveBlock pendingResolver;

@end

@implementation EXSharingModule

EX_EXPORT_MODULE(ExpoSharing);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

EX_EXPORT_METHOD_AS(shareAsync,
                    fileUrl:(NSString *)fileUrl
                    params:(NSDictionary *)params
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (_documentInteractionController) {
    NSString *errorMessage = @"Another item is being shared. Await the `shareAsync` request and then share the item again.";
    reject(@"E_SHARING_MUL", errorMessage, EXErrorWithMessage(errorMessage));
    return;
  }

  NSURL *url = [NSURL URLWithString:fileUrl];

  id<EXFilePermissionModuleInterface> filePermissionsModule = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXFilePermissionModuleInterface)];
  if (filePermissionsModule && !([filePermissionsModule getPathPermissions:url.path] & EXFileSystemPermissionRead)) {
    NSString *errorMessage = @"You don't have access to provided file.";
    reject(@"E_SHARING_PERM", errorMessage, EXErrorWithMessage(errorMessage));
    return;
  }

  _documentInteractionController = [UIDocumentInteractionController interactionControllerWithURL:url];
  _documentInteractionController.delegate = self;
  _documentInteractionController.UTI = params[@"UTI"];

  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    UIViewController *viewController = [[self.moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)] currentViewController];
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
  EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    EX_ENSURE_STRONGIFY(self);
    [self.documentInteractionController dismissMenuAnimated:true];
    self.documentInteractionController = nil;
  });
}

@end
