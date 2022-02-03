//
//  ABI44_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI44_0_0HAVE_GOOGLE_MAPS

#import "ABI44_0_0AIRGoogleMapPolylineManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTConvert+CoreLocation.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>
#import "ABI44_0_0RCTConvert+AirMap.h"
#import "ABI44_0_0AIRGoogleMapPolyline.h"

@interface ABI44_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI44_0_0AIRGoogleMapPolylineManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRGoogleMapPolyline *polyline = [ABI44_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI44_0_0AIRMapCoordinateArray)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI44_0_0RCTBubblingEventBlock)

@end

#endif
