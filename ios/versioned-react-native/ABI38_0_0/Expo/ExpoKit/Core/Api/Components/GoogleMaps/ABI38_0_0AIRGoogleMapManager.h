//
//  ABI38_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI38_0_0HAVE_GOOGLE_MAPS

#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import "ABI38_0_0AIRGoogleMap.h"

@interface ABI38_0_0AIRGoogleMapManager : ABI38_0_0RCTViewManager
@property (nonatomic, assign) ABI38_0_0AIRGoogleMap *map;

@end

#endif
