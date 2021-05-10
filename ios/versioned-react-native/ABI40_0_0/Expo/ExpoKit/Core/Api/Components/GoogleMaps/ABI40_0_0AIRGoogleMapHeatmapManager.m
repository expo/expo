//
//  ABI40_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI40_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI40_0_0AIRGoogleMapHeatmap.h"
#import "ABI40_0_0AIRGoogleMap.h"
#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>

@interface ABI40_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI40_0_0AIRGoogleMapHeatmapManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0AIRGoogleMapHeatmap *heatmap = [ABI40_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end
