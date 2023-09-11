//
//  ABI48_0_0AIRDummyView.m
//  AirMapsExplorer
//
//  Created by Gil Birman on 10/4/16.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import <Foundation/Foundation.h>
#import "ABI48_0_0AIRDummyView.h"

@implementation ABI48_0_0AIRDummyView
- (instancetype)initWithView:(UIView*)view
{
  if ((self = [super init])) {
    self.view = view;
  }
  return self;
}
@end

#endif
