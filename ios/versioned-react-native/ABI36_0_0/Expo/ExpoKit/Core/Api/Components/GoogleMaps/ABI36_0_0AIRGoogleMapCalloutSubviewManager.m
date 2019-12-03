//
//  ABI36_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import "ABI36_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI36_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI36_0_0React/ABI36_0_0RCTView.h>

@implementation ABI36_0_0AIRGoogleMapCalloutSubviewManager
ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI36_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)

@end

#endif
