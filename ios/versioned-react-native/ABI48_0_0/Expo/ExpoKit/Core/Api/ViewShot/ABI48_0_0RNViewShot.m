#import "ABI48_0_0RNViewShot.h"
#import <AVFoundation/AVFoundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTScrollView.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#if __has_include(<ABI48_0_0React/ABI48_0_0RCTUIManagerUtils.h>)
#import <ABI48_0_0React/ABI48_0_0RCTUIManagerUtils.h>
#endif
#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>

@implementation ABI48_0_0RNViewShot

ABI48_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return ABI48_0_0RCTGetUIManagerQueue();
}

ABI48_0_0RCT_EXPORT_METHOD(captureScreen: (NSDictionary *)options
                  resolve:(ABI48_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI48_0_0RCTPromiseRejectBlock)reject) 
{
  [self captureRef: [NSNumber numberWithInt:-1] withOptions:options resolve:resolve reject:reject];
}

ABI48_0_0RCT_EXPORT_METHOD(releaseCapture:(nonnull NSString *)uri)
{
  NSString *directory = [NSTemporaryDirectory() stringByAppendingPathComponent:@"ABI48_0_0ReactNative"];
  // Ensure it's a valid file in the tmp directory
  if ([uri hasPrefix:directory] && ![uri isEqualToString:directory]) {
    NSFileManager *fileManager = [NSFileManager new];
    if ([fileManager fileExistsAtPath:uri]) {
      [fileManager removeItemAtPath:uri error:NULL];
    }
  }
}

ABI48_0_0RCT_EXPORT_METHOD(captureRef:(nonnull NSNumber *)target
                  withOptions:(NSDictionary *)options
                  resolve:(ABI48_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI48_0_0RCTPromiseRejectBlock)reject)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    // Get view
    UIView *view;

    if ([target intValue] == -1) {
      UIWindow *window = [[UIApplication sharedApplication] keyWindow];
      view = window;
    } else {
      view = viewRegistry[target];
    }

    if (!view) {
      reject(ABI48_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"No view found with ABI48_0_0ReactTag: %@", target], nil);
      return;
    }

    // Get options
    CGSize size = [ABI48_0_0RCTConvert CGSize:options];
    NSString *format = [ABI48_0_0RCTConvert NSString:options[@"format"]];
    NSString *result = [ABI48_0_0RCTConvert NSString:options[@"result"]];
    BOOL renderInContext = [ABI48_0_0RCTConvert BOOL:options[@"useRenderInContext"]];
    BOOL snapshotContentContainer = [ABI48_0_0RCTConvert BOOL:options[@"snapshotContentContainer"]];

    // Capture image
    BOOL success;

    UIView* rendered;
    UIScrollView* scrollView;
    if (snapshotContentContainer) {
      if (![view isKindOfClass:[ABI48_0_0RCTScrollView class]]) {
        reject(ABI48_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"snapshotContentContainer can only be used on a ABI48_0_0RCTScrollView. instead got: %@", view], nil);
        return;
      }
      ABI48_0_0RCTScrollView* rctScrollView = (ABI48_0_0RCTScrollView *)view;
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
      reject(ABI48_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"The content size must not be zero or negative. Got: (%g, %g)", size.width, size.height], nil);
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
    
    if (renderInContext) {
      // this comes with some trade-offs such as inability to capture gradients or scrollview's content in full but it works for large views
      [rendered.layer renderInContext: UIGraphicsGetCurrentContext()];
      success = YES;
    }
    else {
      // this doesn't work for large views and reports incorrect success even though the image is blank
      success = [rendered drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
    }
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (snapshotContentContainer) {
      // Restore scroll & frame
      scrollView.contentOffset = savedContentOffset;
      scrollView.frame = savedFrame;
    }

    if (!success) {
      reject(ABI48_0_0RCTErrorUnspecified, @"The view cannot be captured. drawViewHierarchyInRect was not successful. This is a potential technical or security limitation.", nil);
      return;
    }

    if (!image) {
      reject(ABI48_0_0RCTErrorUnspecified, @"Failed to capture view snapshot. UIGraphicsGetImageFromCurrentImageContext() returned nil!", nil);
      return;
    }

    // Convert image to data (on a background thread)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

      NSData *data;
      if ([format isEqualToString:@"jpg"]) {
        CGFloat quality = [ABI48_0_0RCTConvert CGFloat:options[@"quality"]];
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
        NSString *path = ABI48_0_0RCTTempFilePath(format, &error);
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
      if (error) reject(ABI48_0_0RCTErrorUnspecified, error.localizedDescription, error);
      else reject(ABI48_0_0RCTErrorUnspecified, @"viewshot unknown error", nil);
    });
  }];
}


@end
