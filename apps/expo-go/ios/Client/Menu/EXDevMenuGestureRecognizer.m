// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevMenuGestureRecognizer.h"
#import "EXDevMenuManager.h"

@implementation EXDevMenuGestureRecognizer

- (instancetype)init
{
  if (self = [super initWithTarget:self action:@selector(handleGesture:)]) {
    self.numberOfTouchesRequired = 3;
    self.minimumPressDuration = 0.5;
    self.allowableMovement = 30;
  }
  return self;
}

- (void)handleGesture:(id)sender
{
  if (self.state == UIGestureRecognizerStateBegan) {
    if ([[EXDevMenuManager sharedInstance] toggle]) {
      UIImpactFeedbackGenerator *feedback = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];
      [feedback prepare];
      [feedback impactOccurred];
      feedback = nil;
    }
    [self cancelGesture];
  }
}

- (void)cancelGesture
{
  self.enabled = NO;
  self.enabled = YES;
}

@end
