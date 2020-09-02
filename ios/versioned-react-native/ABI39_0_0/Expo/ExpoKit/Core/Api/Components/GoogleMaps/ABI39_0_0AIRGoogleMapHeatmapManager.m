//
//  ABI39_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI39_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI39_0_0AIRGoogleMapHeatmap.h"
#import "ABI39_0_0AIRGoogleMap.h"
#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>

@interface ABI39_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI39_0_0AIRGoogleMapHeatmapManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRGoogleMapHeatmap *heatmap = [ABI39_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end
