/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI38_0_0AIRMapMarkerManager.h"

#import <ABI38_0_0React/ABI38_0_0RCTConvert+CoreLocation.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>
#import <ABI38_0_0React/ABI38_0_0UIView+React.h>
#import "ABI38_0_0AIRMapMarker.h"

@interface ABI38_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI38_0_0AIRMapMarkerManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI38_0_0AIRMapMarker *marker = [ABI38_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI38_0_0RCTBubblingEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI38_0_0RCTDirectEventBlock)


ABI38_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI38_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI38_0_0ReactTag];
        if (![view isKindOfClass:[ABI38_0_0AIRMapMarker class]]) {
            ABI38_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI38_0_0AIRMap, got: %@", view);
        } else {
            [(ABI38_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI38_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI38_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI38_0_0ReactTag];
        if (![view isKindOfClass:[ABI38_0_0AIRMapMarker class]]) {
            ABI38_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI38_0_0AIRMap, got: %@", view);
        } else {
            [(ABI38_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI38_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI38_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI38_0_0ReactTag];
        if (![view isKindOfClass:[ABI38_0_0AIRMapMarker class]]) {
            ABI38_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI38_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
