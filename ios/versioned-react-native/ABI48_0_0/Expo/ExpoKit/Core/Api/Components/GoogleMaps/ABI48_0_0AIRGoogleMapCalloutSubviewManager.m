//
//  ABI48_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import "ABI48_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI48_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI48_0_0React/ABI48_0_0RCTView.h>

@implementation ABI48_0_0AIRGoogleMapCalloutSubviewManager
ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI48_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI48_0_0RCTBubblingEventBlock)

@end

#endif
