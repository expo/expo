/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI44_0_0AIRMapMarkerManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTConvert+CoreLocation.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>
#import "ABI44_0_0AIRMapMarker.h"

@interface ABI44_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI44_0_0AIRMapMarkerManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI44_0_0AIRMapMarker *marker = [ABI44_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI44_0_0RCTBubblingEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI44_0_0RCTDirectEventBlock)


ABI44_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI44_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI44_0_0ReactTag];
        if (![view isKindOfClass:[ABI44_0_0AIRMapMarker class]]) {
            ABI44_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI44_0_0AIRMap, got: %@", view);
        } else {
            [(ABI44_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI44_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI44_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI44_0_0ReactTag];
        if (![view isKindOfClass:[ABI44_0_0AIRMapMarker class]]) {
            ABI44_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI44_0_0AIRMap, got: %@", view);
        } else {
            [(ABI44_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI44_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI44_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI44_0_0ReactTag];
        if (![view isKindOfClass:[ABI44_0_0AIRMapMarker class]]) {
            ABI44_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI44_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
