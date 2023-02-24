//
//  ABI47_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS

#import "ABI47_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI47_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI47_0_0React/ABI47_0_0RCTView.h>

@implementation ABI47_0_0AIRGoogleMapCalloutSubviewManager
ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI47_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI47_0_0RCTBubblingEventBlock)

@end

#endif
