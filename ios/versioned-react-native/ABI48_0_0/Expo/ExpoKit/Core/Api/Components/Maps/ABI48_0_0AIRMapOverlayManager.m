#import "ABI48_0_0AIRMapOverlayManager.h"

#import <ABI48_0_0React/ABI48_0_0RCTConvert+CoreLocation.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>
#import "ABI48_0_0AIRMapOverlay.h"

@interface ABI48_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI48_0_0AIRMapOverlayManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI48_0_0AIRMapOverlay *overlay = [ABI48_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI48_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

