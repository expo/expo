// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXSharing/ABI46_0_0EXSharingModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUtilitiesInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXFileSystemInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXFilePermissionModuleInterface.h>

@interface ABI46_0_0EXSharingModule ()

@property (nonatomic, weak) ABI46_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) UIDocumentInteractionController *documentInteractionController;

@property (nonatomic, strong) ABI46_0_0EXPromiseResolveBlock pendingResolver;

@end

@implementation ABI46_0_0EXSharingModule

ABI46_0_0EX_EXPORT_MODULE(ExpoSharing);

- (void)setModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI46_0_0EX_EXPORT_METHOD_AS(shareAsync,
                    fileUrl:(NSString *)fileUrl
                    params:(NSDictionary *)params
                    resolve:(ABI46_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  if (_documentInteractionController) {
    NSString *errorMessage = @"Another item is being shared. Await the `shareAsync` request and then share the item again.";
    reject(@"E_SHARING_MUL", errorMessage, ABI46_0_0EXErrorWithMessage(errorMessage));
    return;
  }

  NSURL *url = [NSURL URLWithString:fileUrl];

  id<ABI46_0_0EXFilePermissionModuleInterface> filePermissionsModule = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI46_0_0EXFilePermissionModuleInterface)];
  if (filePermissionsModule && !([filePermissionsModule getPathPermissions:url.path] & ABI46_0_0EXFileSystemPermissionRead)) {
    NSString *errorMessage = @"You don't have access to provided file.";
    reject(@"E_SHARING_PERM", errorMessage, ABI46_0_0EXErrorWithMessage(errorMessage));
    return;
  }

  _documentInteractionController = [UIDocumentInteractionController interactionControllerWithURL:url];
  _documentInteractionController.delegate = self;
  _documentInteractionController.UTI = params[@"UTI"];

  UIViewController *viewController = [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI46_0_0EXUtilitiesInterface)] currentViewController];

  ABI46_0_0EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI46_0_0EX_ENSURE_STRONGIFY(self);
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

  _documentInteractionController = nil;
}

@end
