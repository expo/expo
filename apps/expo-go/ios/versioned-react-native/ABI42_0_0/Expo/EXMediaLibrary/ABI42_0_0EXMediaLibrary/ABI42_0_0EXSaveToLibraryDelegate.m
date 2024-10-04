// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXMediaLibrary/ABI42_0_0EXSaveToLibraryDelegate.h>

@interface ABI42_0_0EXSaveToLibraryDelegate ()

@property (nonatomic, strong) ABI42_0_0EXSaveToLibraryCallback callback;

@end

@implementation ABI42_0_0EXSaveToLibraryDelegate : NSObject

- (void)writeImage:(UIImage *)image withCallback:(ABI42_0_0EXSaveToLibraryCallback)callback
{
  _callback = callback;
  UIImageWriteToSavedPhotosAlbum(image,
                                 self,
                                 @selector(image:didFinishSavingWithError:contextInfo:),
                                 nil);
}

- (void)writeVideo:(NSString *)movieUrl withCallback:(ABI42_0_0EXSaveToLibraryCallback) callback
{
  _callback = callback;
  UISaveVideoAtPathToSavedPhotosAlbum(movieUrl,
                                      self,
                                      @selector(video:didFinishSavingWithError:contextInfo:),
                                      nil);
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
