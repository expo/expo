#import "ABI34_0_0EXViewShot.h"
#import <AVFoundation/AVFoundation.h>
#import <ReactABI34_0_0/ABI34_0_0RCTLog.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUtils.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTScrollView.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManager.h>
#if __has_include(<ReactABI34_0_0/ABI34_0_0RCTUIManagerUtils.h>)
#import <ReactABI34_0_0/ABI34_0_0RCTUIManagerUtils.h>
#endif
#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>

@implementation ABI34_0_0EXViewShot

ABI34_0_0RCT_EXPORT_MODULE(ABI34_0_0RNViewShot)

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return ABI34_0_0RCTGetUIManagerQueue();
}

ABI34_0_0RCT_EXPORT_METHOD(captureScreen: (NSDictionary *)options
                  resolve:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI34_0_0RCTPromiseRejectBlock)reject) 
{
  [self captureRef: [NSNumber numberWithInt:-1] withOptions:options resolve:resolve reject:reject];
}

ABI34_0_0RCT_EXPORT_METHOD(releaseCapture:(nonnull NSString *)uri)
{
  NSString *directory = [NSTemporaryDirectory() stringByAppendingPathComponent:@"ReactABI34_0_0Native"];
  // Ensure it's a valid file in the tmp directory
  if ([uri hasPrefix:directory] && ![uri isEqualToString:directory]) {
    NSFileManager *fileManager = [NSFileManager new];
    if ([fileManager fileExistsAtPath:uri]) {
      [fileManager removeItemAtPath:uri error:NULL];
    }
  }
}

ABI34_0_0RCT_EXPORT_METHOD(captureRef:(nonnull NSNumber *)target
                  withOptions:(NSDictionary *)options
                  resolve:(ABI34_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI34_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    // Get view
    UIView *view;

    if ([target intValue] == -1) {
      UIWindow *window = [[UIApplication sharedApplication] keyWindow];
      view = window.rootViewController.view;
    } else {
      view = viewRegistry[target];
    }

    if (!view) {
      reject(ABI34_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"No view found with ReactABI34_0_0Tag: %@", target], nil);
      return;
    }

    // Get options
    CGSize size = [ABI34_0_0RCTConvert CGSize:options];
    NSString *format = [ABI34_0_0RCTConvert NSString:options[@"format"]];
    NSString *result = [ABI34_0_0RCTConvert NSString:options[@"result"]];
    BOOL snapshotContentContainer = [ABI34_0_0RCTConvert BOOL:options[@"snapshotContentContainer"]];

    // Capture image
    BOOL success;

    UIView* rendered;
    UIScrollView* scrollView;
    if (snapshotContentContainer) {
      if (![view isKindOfClass:[ABI34_0_0RCTScrollView class]]) {
        reject(ABI34_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"snapshotContentContainer can only be used on a ABI34_0_0RCTScrollView. instead got: %@", view], nil);
        return;
      }
      ABI34_0_0RCTScrollView* rctScrollView = view;
      scrollView = rctScrollView.scrollView;
      rendered = scrollView;
    }
    else {
      rendered = view;
    }

    if (size.width < 0.1 || size.height < 0.1) {
      size = snapshotContentContainer ? scrollView.contentSize : view.bounds.size;
    }
    if (size.width < 0.1 || size.height < 0.1) {
      reject(ABI34_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"The content size must not be zero or negative. Got: (%g, %g)", size.width, size.height], nil);
      return;
    }

    CGPoint savedContentOffset;
    CGRect savedFrame;
    if (snapshotContentContainer) {
      // Save scroll & frame and set it temporarily to the full content size
      savedContentOffset = scrollView.contentOffset;
      savedFrame = scrollView.frame;
      scrollView.contentOffset = CGPointZero;
      scrollView.frame = CGRectMake(0, 0, scrollView.contentSize.width, scrollView.contentSize.height);
    }

    UIGraphicsBeginImageContextWithOptions(size, NO, 0);
    
    success = [rendered drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (snapshotContentContainer) {
      // Restore scroll & frame
      scrollView.contentOffset = savedContentOffset;
      scrollView.frame = savedFrame;
    }

    if (!success) {
      reject(ABI34_0_0RCTErrorUnspecified, @"The view cannot be captured. drawViewHierarchyInRect was not successful. This is a potential technical or security limitation.", nil);
      return;
    }

    if (!image) {
      reject(ABI34_0_0RCTErrorUnspecified, @"Failed to capture view snapshot. UIGraphicsGetImageFromCurrentImageContext() returned nil!", nil);
      return;
    }

    // Convert image to data (on a background thread)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

      NSData *data;
      if ([format isEqualToString:@"jpg"]) {
        CGFloat quality = [ABI34_0_0RCTConvert CGFloat:options[@"quality"]];
        data = UIImageJPEGRepresentation(image, quality);
      }
      else {
        data = UIImagePNGRepresentation(image);
      }

      NSError *error = nil;
      NSString *res = nil;
      if ([result isEqualToString:@"base64"]) {
        // Return as a base64 raw string
        res = [data base64EncodedStringWithOptions: NSDataBase64Encoding64CharacterLineLength];
      }
      else if ([result isEqualToString:@"data-uri"]) {
        // Return as a base64 data uri string
        NSString *base64 = [data base64EncodedStringWithOptions: NSDataBase64Encoding64CharacterLineLength];
        NSString *imageFormat = ([format isEqualToString:@"jpg"]) ? @"jpeg" : format;
        res = [NSString stringWithFormat:@"data:image/%@;base64,%@", imageFormat, base64];
      }
      else {
        // Save to a temp file
        NSString *path = ABI34_0_0RCTTempFilePath(format, &error);
        if (path && !error) {
          if ([data writeToFile:path options:(NSDataWritingOptions)0 error:&error]) {
            res = path;
          }
        }
      }

      if (res && !error) {
        resolve(res);
        return;
      }

      // If we reached here, something went wrong
      if (error) reject(ABI34_0_0RCTErrorUnspecified, error.localizedDescription, error);
      else reject(ABI34_0_0RCTErrorUnspecified, @"viewshot unknown error", nil);
    });
  }];
}


@end
