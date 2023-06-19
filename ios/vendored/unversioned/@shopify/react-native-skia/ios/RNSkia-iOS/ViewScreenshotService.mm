#import "ViewScreenshotService.h"
#import <QuartzCore/QuartzCore.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkData.h"

#pragma clang diagnostic pop

@implementation ViewScreenshotService {
  RCTUIManager *_uiManager;
}

- (instancetype)initWithUiManager:(RCTUIManager *)uiManager {
  if (self = [super init]) {
    _uiManager = uiManager;
  }
  return self;
}

- (sk_sp<SkImage>)screenshotOfViewWithTag:(NSNumber *)viewTag {
  // Find view corresponding to the tag
  auto view = [_uiManager viewForReactTag:viewTag];
  if (view == NULL) {
    RCTFatal(RCTErrorWithMessage(@"Could not find view with tag"));
  }

  // Get size
  CGSize size = view.frame.size;

  // Setup context
  UIGraphicsImageRendererFormat *format =
      [UIGraphicsImageRendererFormat defaultFormat];
  format.opaque = NO;

  // Explicitly ask for the standard format to get ARGB 32bits and not 64bits.
  if (@available(iOS 12.0, *)) {
    format.preferredRange = UIGraphicsImageRendererFormatRangeStandard;
  } else {
    // Fallback on earlier versions
    format.prefersExtendedRange = false;
  }

  UIGraphicsImageRenderer *renderer =
      [[UIGraphicsImageRenderer alloc] initWithSize:size format:format];

  // Render to context - this is now the only part of this function that shows
  // up in the profiler!
  UIImage *image = [renderer
      imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull context) {
        [view drawViewHierarchyInRect:(CGRect){CGPointZero, size}
                   afterScreenUpdates:YES];
      }];

  // Convert from UIImage -> CGImage -> SkImage
  CGImageRef cgImage = image.CGImage;

  // Get some info about the image
  auto width = CGImageGetWidth(cgImage);
  auto height = CGImageGetHeight(cgImage);
  auto bytesPerRow = CGImageGetBytesPerRow(cgImage);

  // Convert from UIImage -> SkImage, start by getting the pixels directly from
  // the CGImage:
  auto dataRef = CGDataProviderCopyData(CGImageGetDataProvider(cgImage));
  auto length = CFDataGetLength(dataRef);
  void *data = CFDataGetMutableBytePtr((CFMutableDataRef)dataRef);

  // Now we'll capture the data in an SkData object and control releasing it:
  auto skData = SkData::MakeWithProc(
      data, length,
      [](const void *ptr, void *context) {
        CFDataRef dataRef = (CFDataRef)context;
        CFRelease(dataRef);
      },
      (void *)dataRef);

  // Make SkImageInfo
  // We're using kBGRA_8888_SkColorType since this is what we get when the
  // UIGraphicsImageRenderer uses the standard format (the extended is using
  // 64bits so it is not suitable for us).
  SkImageInfo info =
      SkImageInfo::Make(static_cast<int>(width), static_cast<int>(height),
                        kBGRA_8888_SkColorType, kPremul_SkAlphaType);

  // ... and then create the SkImage itself!
  return SkImages::RasterFromData(info, skData, bytesPerRow);
}

@end
