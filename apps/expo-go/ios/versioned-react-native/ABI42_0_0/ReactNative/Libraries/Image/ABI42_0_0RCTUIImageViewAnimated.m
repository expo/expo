/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTUIImageViewAnimated.h>
#import <ABI42_0_0React/ABI42_0_0RCTDisplayWeakRefreshable.h>

#import <mach/mach.h>
#import <objc/runtime.h>

static NSUInteger ABI42_0_0RCTDeviceTotalMemory() {
  return (NSUInteger)[[NSProcessInfo processInfo] physicalMemory];
}

static NSUInteger ABI42_0_0RCTDeviceFreeMemory() {
  mach_port_t host_port = mach_host_self();
  mach_msg_type_number_t host_size = sizeof(vm_statistics_data_t) / sizeof(integer_t);
  vm_size_t page_size;
  vm_statistics_data_t vm_stat;
  kern_return_t kern;

  kern = host_page_size(host_port, &page_size);
  if (kern != KERN_SUCCESS) return 0;
  kern = host_statistics(host_port, HOST_VM_INFO, (host_info_t)&vm_stat, &host_size);
  if (kern != KERN_SUCCESS) return 0;
  return (vm_stat.free_count - vm_stat.speculative_count) * page_size;
}

@interface ABI42_0_0RCTUIImageViewAnimated () <CALayerDelegate, ABI42_0_0RCTDisplayRefreshable>

@property (nonatomic, assign) NSUInteger maxBufferSize;
@property (nonatomic, strong, readwrite) UIImage *currentFrame;
@property (nonatomic, assign, readwrite) NSUInteger currentFrameIndex;
@property (nonatomic, assign, readwrite) NSUInteger currentLoopCount;
@property (nonatomic, assign) NSUInteger totalFrameCount;
@property (nonatomic, assign) NSUInteger totalLoopCount;
@property (nonatomic, strong) UIImage<ABI42_0_0RCTAnimatedImage> *animatedImage;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, UIImage *> *frameBuffer;
@property (nonatomic, assign) NSTimeInterval currentTime;
@property (nonatomic, assign) BOOL bufferMiss;
@property (nonatomic, assign) NSUInteger maxBufferCount;
@property (nonatomic, strong) NSOperationQueue *fetchQueue;
@property (nonatomic, strong) dispatch_semaphore_t lock;
@property (nonatomic, assign) CGFloat animatedImageScale;
@property (nonatomic, strong) CADisplayLink *displayLink;

@end

@implementation ABI42_0_0RCTUIImageViewAnimated

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.lock = dispatch_semaphore_create(1);
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveMemoryWarning:) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];

  }
  return self;
}

- (void)resetAnimatedImage
{
  self.animatedImage = nil;
  self.totalFrameCount = 0;
  self.totalLoopCount = 0;
  self.currentFrame = nil;
  self.currentFrameIndex = 0;
  self.currentLoopCount = 0;
  self.currentTime = 0;
  self.bufferMiss = NO;
  self.maxBufferCount = 0;
  self.animatedImageScale = 1;
  [_fetchQueue cancelAllOperations];
  _fetchQueue = nil;
  dispatch_semaphore_wait(self.lock, DISPATCH_TIME_FOREVER);
  [_frameBuffer removeAllObjects];
  _frameBuffer = nil;
  dispatch_semaphore_signal(self.lock);
}

- (void)setImage:(UIImage *)image
{
  if (self.image == image) {
    return;
  }

  [self stop];
  [self resetAnimatedImage];

  if ([image respondsToSelector:@selector(animatedImageFrameAtIndex:)]) {
    NSUInteger animatedImageFrameCount = ((UIImage<ABI42_0_0RCTAnimatedImage> *)image).animatedImageFrameCount;

    // In case frame count is 0, there is no reason to continue.
    if (animatedImageFrameCount == 0) {
      return;
    }

    self.animatedImage = (UIImage<ABI42_0_0RCTAnimatedImage> *)image;
    self.totalFrameCount = animatedImageFrameCount;

    // Get the current frame and loop count.
    self.totalLoopCount = self.animatedImage.animatedImageLoopCount;

    self.animatedImageScale = image.scale;

    self.currentFrame = image;

    dispatch_semaphore_wait(self.lock, DISPATCH_TIME_FOREVER);
    self.frameBuffer[@(self.currentFrameIndex)] = self.currentFrame;
    dispatch_semaphore_signal(self.lock);

    // Calculate max buffer size
    [self calculateMaxBufferCount];

    if ([self paused]) {
      [self start];
    }

    [self.layer setNeedsDisplay];
  } else {
    super.image = image;
  }
}

#pragma mark - Private

- (NSOperationQueue *)fetchQueue
{
  if (!_fetchQueue) {
    _fetchQueue = [[NSOperationQueue alloc] init];
    _fetchQueue.maxConcurrentOperationCount = 1;
  }
  return _fetchQueue;
}

- (NSMutableDictionary<NSNumber *,UIImage *> *)frameBuffer
{
  if (!_frameBuffer) {
    _frameBuffer = [NSMutableDictionary dictionary];
  }
  return _frameBuffer;
}

- (CADisplayLink *)displayLink
{
  // We only need a displayLink in the case of animated images, so short-circuit this code and don't create one for most of the use cases.
  // Since this class is used for all ABI42_0_0RCTImageView's, this is especially important.
  if (!_animatedImage) {
    return nil;
  }

  if (!_displayLink) {
    _displayLink = [ABI42_0_0RCTDisplayWeakRefreshable displayLinkWithWeakRefreshable:self];
    NSString *runLoopMode = [NSProcessInfo processInfo].activeProcessorCount > 1 ? NSRunLoopCommonModes : NSDefaultRunLoopMode;
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:runLoopMode];
  }
  return _displayLink;
}

#pragma mark - Animation

- (void)start
{
  self.displayLink.paused = NO;
}

- (void)stop
{
  self.displayLink.paused = YES;
}

- (BOOL)paused
{
  return self.displayLink.isPaused;
}

- (void)displayDidRefresh:(CADisplayLink *)displayLink
{
#if TARGET_OS_UIKITFORMAC
  // TODO: `displayLink.frameInterval` is not available on UIKitForMac
  NSTimeInterval duration = displayLink.duration;
#else
  NSTimeInterval duration = displayLink.duration * displayLink.frameInterval;
#endif
  NSUInteger totalFrameCount = self.totalFrameCount;
  NSUInteger currentFrameIndex = self.currentFrameIndex;
  NSUInteger nextFrameIndex = (currentFrameIndex + 1) % totalFrameCount;

  // Check if we have the frame buffer firstly to improve performance
  if (!self.bufferMiss) {
    // Then check if timestamp is reached
    self.currentTime += duration;
    NSTimeInterval currentDuration = [self.animatedImage animatedImageDurationAtIndex:currentFrameIndex];
    if (self.currentTime < currentDuration) {
      // Current frame timestamp not reached, return
      return;
    }
    self.currentTime -= currentDuration;
    NSTimeInterval nextDuration = [self.animatedImage animatedImageDurationAtIndex:nextFrameIndex];
    if (self.currentTime > nextDuration) {
      // Do not skip frame
      self.currentTime = nextDuration;
    }
  }

  // Update the current frame
  UIImage *currentFrame;
  UIImage *fetchFrame;
  dispatch_semaphore_wait(self.lock, DISPATCH_TIME_FOREVER);
  currentFrame = self.frameBuffer[@(currentFrameIndex)];
  fetchFrame = currentFrame ? self.frameBuffer[@(nextFrameIndex)] : nil;
  dispatch_semaphore_signal(self.lock);
  BOOL bufferFull = NO;
  if (currentFrame) {
    dispatch_semaphore_wait(self.lock, DISPATCH_TIME_FOREVER);
    // Remove the frame buffer if need
    if (self.frameBuffer.count > self.maxBufferCount) {
      self.frameBuffer[@(currentFrameIndex)] = nil;
    }
    // Check whether we can stop fetch
    if (self.frameBuffer.count == totalFrameCount) {
      bufferFull = YES;
    }
    dispatch_semaphore_signal(self.lock);
    self.currentFrame = currentFrame;
    self.currentFrameIndex = nextFrameIndex;
    self.bufferMiss = NO;
    [self.layer setNeedsDisplay];
  } else {
    self.bufferMiss = YES;
  }

  // Update the loop count when last frame rendered
  if (nextFrameIndex == 0 && !self.bufferMiss) {
    // Update the loop count
    self.currentLoopCount++;
    // if reached the max loop count, stop animating, 0 means loop indefinitely
    NSUInteger maxLoopCount = self.totalLoopCount;
    if (maxLoopCount != 0 && (self.currentLoopCount >= maxLoopCount)) {
      [self stop];
      return;
    }
  }

  // Check if we should prefetch next frame or current frame
  NSUInteger fetchFrameIndex;
  if (self.bufferMiss) {
    // When buffer miss, means the decode speed is slower than render speed, we fetch current miss frame
    fetchFrameIndex = currentFrameIndex;
  } else {
    // Or, most cases, the decode speed is faster than render speed, we fetch next frame
    fetchFrameIndex = nextFrameIndex;
  }

  if (!fetchFrame && !bufferFull && self.fetchQueue.operationCount == 0) {
    // Prefetch next frame in background queue
    UIImage<ABI42_0_0RCTAnimatedImage> *animatedImage = self.animatedImage;
    NSOperation *operation = [NSBlockOperation blockOperationWithBlock:^{
      UIImage *frame = [animatedImage animatedImageFrameAtIndex:fetchFrameIndex];
      dispatch_semaphore_wait(self.lock, DISPATCH_TIME_FOREVER);
      self.frameBuffer[@(fetchFrameIndex)] = frame;
      dispatch_semaphore_signal(self.lock);
    }];
    [self.fetchQueue addOperation:operation];
  }
}

#pragma mark - CALayerDelegate

- (void)displayLayer:(CALayer *)layer
{
  if (_currentFrame) {
    layer.contentsScale = self.animatedImageScale;
    layer.contents = (__bridge id)_currentFrame.CGImage;
  } else {
    [super displayLayer:layer];
  }
}

#pragma mark - Util

- (void)calculateMaxBufferCount
{
  NSUInteger bytes = CGImageGetBytesPerRow(self.currentFrame.CGImage) * CGImageGetHeight(self.currentFrame.CGImage);
  if (bytes == 0) bytes = 1024;

  NSUInteger max = 0;
  if (self.maxBufferSize > 0) {
    max = self.maxBufferSize;
  } else {
    // Calculate based on current memory, these factors are by experience
    NSUInteger total = ABI42_0_0RCTDeviceTotalMemory();
    NSUInteger free = ABI42_0_0RCTDeviceFreeMemory();
    max = MIN(total * 0.2, free * 0.6);
  }

  NSUInteger maxBufferCount = (double)max / (double)bytes;
  if (!maxBufferCount) {
    // At least 1 frame
    maxBufferCount = 1;
  }

  self.maxBufferCount = maxBufferCount;
}

#pragma mark - Lifecycle

- (void)dealloc
{
  // Removes the display link from all run loop modes.
  [_displayLink invalidate];
  _displayLink = nil;
}

- (void)didReceiveMemoryWarning:(NSNotification *)notification
{
  [_fetchQueue cancelAllOperations];
  [_fetchQueue addOperationWithBlock:^{
    NSNumber *currentFrameIndex = @(self.currentFrameIndex);
    dispatch_semaphore_wait(self.lock, DISPATCH_TIME_FOREVER);
    NSArray *keys = self.frameBuffer.allKeys;
    // only keep the next frame for later rendering
    for (NSNumber * key in keys) {
      if (![key isEqualToNumber:currentFrameIndex]) {
        [self.frameBuffer removeObjectForKey:key];
      }
    }
    dispatch_semaphore_signal(self.lock);
  }];
}

@end
