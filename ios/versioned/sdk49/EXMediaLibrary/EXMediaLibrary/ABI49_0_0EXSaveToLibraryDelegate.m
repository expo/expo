// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXMediaLibrary/ABI49_0_0EXSaveToLibraryDelegate.h>

@interface ABI49_0_0EXSaveToLibraryDelegate ()

@property (nonatomic, strong) ABI49_0_0EXSaveToLibraryCallback callback;

@end

@implementation ABI49_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI49_0_0EXSaveToLibraryCallback)callback
{
  _callback = callback;
  UIImageWriteToSavedPhotosAlbum(image,
                                 self,
                                 @selector(image:didFinishSavingWithError:contextInfo:),
                                 nil);
}

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI49_0_0EXSaveToLibraryCallback) callback
{
  _callback = callback;
  UISaveVideoAtPathToSavedPhotosAlbum(movieUrl,
                                      self,
                                      @selector(video:didFinishSavingWithError:contextInfo:),
                                      nil);
}

- (void)writeGIF:(NSURL *)gifUrl withCallback:(ABI49_0_0EXSaveToLibraryCallback) callback
{
  _callback = callback;
  [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
    NSData *data = [NSData dataWithContentsOfURL:gifUrl];
    PHAssetCreationRequest *request = [PHAssetCreationRequest creationRequestForAsset];
    [request addResourceWithType:PHAssetResourceTypePhoto data:data options:NULL];
  } completionHandler:^(BOOL success, NSError *error) {
    [self triggerCallback:nil withError:error];
  }];
}

- (void)image:(UIImage*)image
        didFinishSavingWithError:(NSError *)error
        contextInfo:(void *)info
{
  [self triggerCallback:image withError:error];
}

- (void)video:(NSString *)videoPath
        didFinishSavingWithError:(NSError *)error
        contextInfo:(void *)contextInfo
{
  [self triggerCallback:videoPath withError:error];
}

- (void)triggerCallback:(id)asset
              withError:(NSError *)error
{
  if (self.callback) {
    self.callback(asset, error);
  }
}

@end
