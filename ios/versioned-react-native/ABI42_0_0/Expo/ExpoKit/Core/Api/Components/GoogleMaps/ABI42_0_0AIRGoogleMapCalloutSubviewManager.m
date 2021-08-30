//
//  ABI42_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS

#import "ABI42_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI42_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI42_0_0React/ABI42_0_0RCTView.h>

@implementation ABI42_0_0AIRGoogleMapCalloutSubviewManager
ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI42_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI42_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI42_0_0RCTBubblingEventBlock)

@end

#endif
