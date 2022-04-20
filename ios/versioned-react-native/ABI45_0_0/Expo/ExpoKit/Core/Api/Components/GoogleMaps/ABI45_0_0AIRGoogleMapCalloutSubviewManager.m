//
//  ABI45_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS

#import "ABI45_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI45_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI45_0_0React/ABI45_0_0RCTView.h>

@implementation ABI45_0_0AIRGoogleMapCalloutSubviewManager
ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI45_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI45_0_0RCTBubblingEventBlock)

@end

#endif
