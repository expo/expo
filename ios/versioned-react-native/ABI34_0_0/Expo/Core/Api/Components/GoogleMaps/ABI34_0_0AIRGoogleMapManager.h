//
//  ABI34_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI34_0_0HAVE_GOOGLE_MAPS

#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>
#import "ABI34_0_0AIRGoogleMap.h"

@interface ABI34_0_0AIRGoogleMapManager : ABI34_0_0RCTViewManager
@property (nonatomic, assign) ABI34_0_0AIRGoogleMap *map;

@end

#endif
