// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXSharing/EXSharingModule.h>
#import <EXCore/EXUtilitiesInterface.h>

@interface EXSharingModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong) UIDocumentInteractionController *documentInteractionController;

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
  NSURL *url = [NSURL URLWithString:fileUrl];
  
  _documentInteractionController = [UIDocumentInteractionController interactionControllerWithURL:url];
  _documentInteractionController.delegate = self;
  _documentInteractionController.UTI = params[@"UTI"];
  
  dispatch_async(dispatch_get_main_queue(), ^{
    UIView * rootView = [[[[[UIApplication sharedApplication] delegate] window] rootViewController] view];
    BOOL canOpen = [self->_documentInteractionController presentOpenInMenuFromRect:CGRectZero inView:rootView animated:YES];
    NSMutableArray *result = [[NSMutableArray alloc] init];
    if(canOpen) resolve(result);
    else {
      NSError *error = [[NSError alloc] init];
      reject(@"cannot_handle_file", @"Can not handle file", error);
    }
    
  });
}

- (void)documentInteractionControllerDidDismissOpenInMenu:(UIDocumentInteractionController *)controller
{
  // clear reference when done sharing
  _documentInteractionController = NULL;
}

@end
