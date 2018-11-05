//
//  DummyView.m
//  AirMapsExplorer
//
//  Created by Gil Birman on 10/4/16.
//

#import <Foundation/Foundation.h>
#import "ABI30_0_0AIRDummyView.h"

@implementation ABI30_0_0AIRDummyView
- (instancetype)initWithView:(UIView*)view
{
  if ((self = [super init])) {
    self.view = view;
  }
  return self;
}
@end
