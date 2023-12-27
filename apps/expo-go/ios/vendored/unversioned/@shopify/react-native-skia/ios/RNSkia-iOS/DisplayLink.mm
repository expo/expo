#import "DisplayLink.h"

@implementation DisplayLink

- (void)start:(block_t)block {
  self.updateBlock = block;
  // check whether the loop is already running
  if (_displayLink == nil) {
    // specify update method
    _displayLink = [CADisplayLink displayLinkWithTarget:self
                                               selector:@selector(update:)];

    // add the display link to the main run loop
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop]
                       forMode:NSRunLoopCommonModes];
  }
}

- (void)stop {
  // check whether the loop is already stopped
  if (_displayLink != nil) {
    // if the display link is present, it gets invalidated (loop stops)

    [_displayLink invalidate];
    _displayLink = nil;
  }
}

- (void)update:(CADisplayLink *)sender {
  double time = [sender timestamp];
  _updateBlock(time);
}

@end
