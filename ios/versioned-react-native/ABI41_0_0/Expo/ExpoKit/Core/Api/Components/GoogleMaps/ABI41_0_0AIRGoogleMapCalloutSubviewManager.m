//
//  ABI41_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import "ABI41_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI41_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI41_0_0React/ABI41_0_0RCTView.h>

@implementation ABI41_0_0AIRGoogleMapCalloutSubviewManager
ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI41_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI41_0_0RCTBubblingEventBlock)

@end

#endif
