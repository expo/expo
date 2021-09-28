/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI43_0_0AIRMapMarkerManager.h"

#import <ABI43_0_0React/ABI43_0_0RCTConvert+CoreLocation.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>
#import "ABI43_0_0AIRMapMarker.h"

@interface ABI43_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI43_0_0AIRMapMarkerManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI43_0_0AIRMapMarker *marker = [ABI43_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI43_0_0RCTBubblingEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI43_0_0RCTDirectEventBlock)


ABI43_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI43_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI43_0_0ReactTag];
        if (![view isKindOfClass:[ABI43_0_0AIRMapMarker class]]) {
            ABI43_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI43_0_0AIRMap, got: %@", view);
        } else {
            [(ABI43_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI43_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI43_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI43_0_0ReactTag];
        if (![view isKindOfClass:[ABI43_0_0AIRMapMarker class]]) {
            ABI43_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI43_0_0AIRMap, got: %@", view);
        } else {
            [(ABI43_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI43_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI43_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI43_0_0ReactTag];
        if (![view isKindOfClass:[ABI43_0_0AIRMapMarker class]]) {
            ABI43_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI43_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
