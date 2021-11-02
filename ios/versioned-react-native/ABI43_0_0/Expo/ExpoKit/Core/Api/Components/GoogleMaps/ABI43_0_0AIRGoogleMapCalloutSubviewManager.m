//
//  ABI43_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI43_0_0HAVE_GOOGLE_MAPS

#import "ABI43_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI43_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI43_0_0React/ABI43_0_0RCTView.h>

@implementation ABI43_0_0AIRGoogleMapCalloutSubviewManager
ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI43_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI43_0_0RCTBubblingEventBlock)

@end

#endif
