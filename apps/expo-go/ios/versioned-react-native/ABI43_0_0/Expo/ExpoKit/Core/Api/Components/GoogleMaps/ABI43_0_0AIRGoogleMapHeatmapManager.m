//
//  ABI43_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI43_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI43_0_0AIRGoogleMapHeatmap.h"
#import "ABI43_0_0AIRGoogleMap.h"
#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import <ABI43_0_0React/ABI43_0_0UIView+React.h>

@interface ABI43_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI43_0_0AIRGoogleMapHeatmapManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRGoogleMapHeatmap *heatmap = [ABI43_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end