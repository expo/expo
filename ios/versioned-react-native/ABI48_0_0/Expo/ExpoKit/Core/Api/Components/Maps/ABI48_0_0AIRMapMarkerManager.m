/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI48_0_0AIRMapMarkerManager.h"

#import <ABI48_0_0React/ABI48_0_0RCTConvert+CoreLocation.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>
#import "ABI48_0_0AIRMapMarker.h"

@interface ABI48_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI48_0_0AIRMapMarkerManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI48_0_0AIRMapMarker *marker = [ABI48_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(isPreselected, BOOL)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI48_0_0RCTBubblingEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI48_0_0RCTDirectEventBlock)


ABI48_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI48_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI48_0_0ReactTag];
        if (![view isKindOfClass:[ABI48_0_0AIRMapMarker class]]) {
            ABI48_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI48_0_0AIRMap, got: %@", view);
        } else {
            [(ABI48_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI48_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI48_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI48_0_0ReactTag];
        if (![view isKindOfClass:[ABI48_0_0AIRMapMarker class]]) {
            ABI48_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI48_0_0AIRMap, got: %@", view);
        } else {
            [(ABI48_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI48_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI48_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI48_0_0ReactTag];
        if (![view isKindOfClass:[ABI48_0_0AIRMapMarker class]]) {
            ABI48_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI48_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
