#import "ABI29_0_0AIRMapOverlayManager.h"

#import <ReactABI29_0_0/ABI29_0_0RCTConvert+CoreLocation.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManager.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import "ABI29_0_0AIRMapOverlay.h"

@interface ABI29_0_0AIRMapOverlayManager () <MKMapViewDelegate>

@end

@implementation ABI29_0_0AIRMapOverlayManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI29_0_0AIRMapOverlay *overlay = [ABI29_0_0AIRMapOverlay new];
    overlay.bridge = self.bridge;
    return overlay;
}

ABI29_0_0RCT_REMAP_VIEW_PROPERTY(bounds, boundsRect, NSArray)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)

@end

