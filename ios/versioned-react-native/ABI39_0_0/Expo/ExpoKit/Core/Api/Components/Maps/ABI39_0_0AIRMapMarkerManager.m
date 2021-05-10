/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI39_0_0AIRMapMarkerManager.h"

#import <ABI39_0_0React/ABI39_0_0RCTConvert+CoreLocation.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>
#import "ABI39_0_0AIRMapMarker.h"

@interface ABI39_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI39_0_0AIRMapMarkerManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI39_0_0AIRMapMarker *marker = [ABI39_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI39_0_0RCTBubblingEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI39_0_0RCTDirectEventBlock)


ABI39_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI39_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI39_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI39_0_0ReactTag];
        if (![view isKindOfClass:[ABI39_0_0AIRMapMarker class]]) {
            ABI39_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI39_0_0AIRMap, got: %@", view);
        } else {
            [(ABI39_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI39_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI39_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI39_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI39_0_0ReactTag];
        if (![view isKindOfClass:[ABI39_0_0AIRMapMarker class]]) {
            ABI39_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI39_0_0AIRMap, got: %@", view);
        } else {
            [(ABI39_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI39_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI39_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI39_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI39_0_0ReactTag];
        if (![view isKindOfClass:[ABI39_0_0AIRMapMarker class]]) {
            ABI39_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI39_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
