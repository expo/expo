//
//  ABI42_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI42_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI42_0_0AIRGoogleMapHeatmap.h"
#import "ABI42_0_0AIRGoogleMap.h"
#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>

@interface ABI42_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI42_0_0AIRGoogleMapHeatmapManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI42_0_0AIRGoogleMapHeatmap *heatmap = [ABI42_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end