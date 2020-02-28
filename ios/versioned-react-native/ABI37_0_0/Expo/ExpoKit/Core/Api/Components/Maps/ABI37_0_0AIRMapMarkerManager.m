/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI37_0_0AIRMapMarkerManager.h"

#import <ABI37_0_0React/ABI37_0_0RCTConvert+CoreLocation.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>
#import "ABI37_0_0AIRMapMarker.h"

@interface ABI37_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI37_0_0AIRMapMarkerManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI37_0_0AIRMapMarker *marker = [ABI37_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI37_0_0RCTBubblingEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI37_0_0RCTDirectEventBlock)


ABI37_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI37_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI37_0_0ReactTag];
        if (![view isKindOfClass:[ABI37_0_0AIRMapMarker class]]) {
            ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0AIRMap, got: %@", view);
        } else {
            [(ABI37_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI37_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI37_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI37_0_0ReactTag];
        if (![view isKindOfClass:[ABI37_0_0AIRMapMarker class]]) {
            ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0AIRMap, got: %@", view);
        } else {
            [(ABI37_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI37_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI37_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI37_0_0ReactTag];
        if (![view isKindOfClass:[ABI37_0_0AIRMapMarker class]]) {
            ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
