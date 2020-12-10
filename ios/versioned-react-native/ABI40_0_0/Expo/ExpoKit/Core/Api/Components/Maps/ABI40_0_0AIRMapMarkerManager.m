/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI40_0_0AIRMapMarkerManager.h"

#import <ABI40_0_0React/ABI40_0_0RCTConvert+CoreLocation.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>
#import "ABI40_0_0AIRMapMarker.h"

@interface ABI40_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI40_0_0AIRMapMarkerManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI40_0_0AIRMapMarker *marker = [ABI40_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI40_0_0RCTBubblingEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI40_0_0RCTDirectEventBlock)


ABI40_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI40_0_0ReactTag];
        if (![view isKindOfClass:[ABI40_0_0AIRMapMarker class]]) {
            ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0AIRMap, got: %@", view);
        } else {
            [(ABI40_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI40_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI40_0_0ReactTag];
        if (![view isKindOfClass:[ABI40_0_0AIRMapMarker class]]) {
            ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0AIRMap, got: %@", view);
        } else {
            [(ABI40_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI40_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI40_0_0ReactTag];
        if (![view isKindOfClass:[ABI40_0_0AIRMapMarker class]]) {
            ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
