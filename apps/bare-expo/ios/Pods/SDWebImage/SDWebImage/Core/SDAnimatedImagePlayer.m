/*
* This file is part of the SDWebImage package.
* (c) Olivier Poitrey <rs@dailymotion.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

#import "SDAnimatedImagePlayer.h"
#import "NSImage+Compatibility.h"
#import "SDDisplayLink.h"
#import "SDDeviceHelper.h"
#import "SDInternalMacros.h"

@interface SDAnimatedImagePlayer () {
    SD_LOCK_DECLARE(_lock);
    NSRunLoopMode _runLoopMode;
}

@property (nonatomic, strong, readwrite) UIImage *currentFrame;
@property (nonatomic, assign, readwrite) NSUInteger currentFrameIndex;
@property (nonatomic, assign, readwrite) NSUInteger currentLoopCount;
@property (nonatomic, strong) id<SDAnimatedImageProvider> animatedProvider;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, UIImage *> *frameBuffer;
@property (nonatomic, assign) NSTimeInterval currentTime;
@property (nonatomic, assign) BOOL bufferMiss;
@property (nonatomic, assign) BOOL needsDisplayWhenImageBecomesAvailable;
@property (nonatomic, assign) BOOL shouldReverse;
@property (nonatomic, assign) NSUInteger maxBufferCount;
@property (nonatomic, strong) NSOperationQueue *fetchQueue;
@property (nonatomic, strong) SDDisplayLink *displayLink;

@end

@implementation SDAnimatedImagePlayer

- (instancetype)initWithProvider:(id<SDAnimatedImageProvider>)provider {
    self = [super init];
    if (self) {
        NSUInteger animatedImageFrameCount = provider.animatedImageFrameCount;
        // Check the frame count
        if (animatedImageFrameCount <= 1) {
            return nil;
        }
        self.totalFrameCount = animatedImageFrameCount;
        // Get the current frame and loop count.
        self.totalLoopCount = provider.animatedImageLoopCount;
        self.animatedProvider = provider;
        self.playbackRate = 1.0;
        SD_LOCK_INIT(_lock);
#if SD_UIKIT
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveMemoryWarning:) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
#endif
    }
    return self;
}

+ (instancetype)playerWithProvider:(id<SDAnimatedImageProvider>)provider {
    SDAnimatedImagePlayer *player = [[SDAnimatedImagePlayer alloc] initWithProvider:provider];
    return player;
}

#pragma mark - Life Cycle

- (void)dealloc {
#if SD_UIKIT
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
#endif
}

- (void)didReceiveMemoryWarning:(NSNotification *)notification {
    [_fetchQueue cancelAllOperations];
    [_fetchQueue addOperationWithBlock:^{
        NSNumber *currentFrameIndex = @(self.currentFrameIndex);
        SD_LOCK(self->_lock);
        NSArray *keys = self.frameBuffer.allKeys;
        // only keep the next frame for later rendering
        for (NSNumber * key in keys) {
            if (![key isEqualToNumber:currentFrameIndex]) {
                [self.frameBuffer removeObjectForKey:key];
            }
        }
        SD_UNLOCK(self->_lock);
    }];
}

#pragma mark - Private
- (NSOperationQueue *)fetchQueue {
    if (!_fetchQueue) {
        _fetchQueue = [[NSOperationQueue alloc] init];
        _fetchQueue.maxConcurrentOperationCount = 1;
    }
    return _fetchQueue;
}

- (NSMutableDictionary<NSNumber *,UIImage *> *)frameBuffer {
    if (!_frameBuffer) {
        _frameBuffer = [NSMutableDictionary dictionary];
    }
    return _frameBuffer;
}

- (SDDisplayLink *)displayLink {
    if (!_displayLink) {
        _displayLink = [SDDisplayLink displayLinkWithTarget:self selector:@selector(displayDidRefresh:)];
        [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:self.runLoopMode];
        [_displayLink stop];
    }
    return _displayLink;
}

- (void)setRunLoopMode:(NSRunLoopMode)runLoopMode {
    if ([_runLoopMode isEqual:runLoopMode]) {
        return;
    }
    if (_displayLink) {
        if (_runLoopMode) {
            [_displayLink removeFromRunLoop:[NSRunLoop mainRunLoop] forMode:_runLoopMode];
        }
        if (runLoopMode.length > 0) {
            [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:runLoopMode];
        }
    }
    _runLoopMode = [runLoopMode copy];
}

- (NSRunLoopMode)runLoopMode {
    if (!_runLoopMode) {
        _runLoopMode = [[self class] defaultRunLoopMode];
    }
    return _runLoopMode;
}

#pragma mark - State Control

- (void)setupCurrentFrame {
    if (self.currentFrameIndex != 0) {
        return;
    }
    if (self.playbackMode == SDAnimatedImagePlaybackModeReverse ||
               self.playbackMode == SDAnimatedImagePlaybackModeReversedBounce) {
        self.currentFrameIndex = self.totalFrameCount - 1;
    }
    
    if (!self.currentFrame && [self.animatedProvider isKindOfClass:[UIImage class]]) {
        UIImage *image = (UIImage *)self.animatedProvider;
        // Use the poster image if available
        #if SD_MAC
        UIImage *posterFrame = [[NSImage alloc] initWithCGImage:image.CGImage scale:image.scale orientation:kCGImagePropertyOrientationUp];
        #else
        UIImage *posterFrame = [[UIImage alloc] initWithCGImage:image.CGImage scale:image.scale orientation:image.imageOrientation];
        #endif
        if (posterFrame) {
            self.currentFrame = posterFrame;
            SD_LOCK(self->_lock);
            self.frameBuffer[@(self.currentFrameIndex)] = self.currentFrame;
            SD_UNLOCK(self->_lock);
            [self handleFrameChange];
        }
    }
    
}

- (void)resetCurrentFrameStatus {
    // These should not trigger KVO, user don't need to receive an `index == 0, image == nil` callback.
    _currentFrame = nil;
    _currentFrameIndex = 0;
    _currentLoopCount = 0;
    _currentTime = 0;
    _bufferMiss = NO;
    _needsDisplayWhenImageBecomesAvailable = NO;
}

- (void)clearFrameBuffer {
    SD_LOCK(_lock);
    [_frameBuffer removeAllObjects];
    SD_UNLOCK(_lock);
}

#pragma mark - Animation Control
- (void)startPlaying {
    [self.displayLink start];
    // Setup frame
    [self setupCurrentFrame];
    // Calculate max buffer size
    [self calculateMaxBufferCount];
}

- (void)stopPlaying {
    [_fetchQueue cancelAllOperations];
    // Using `_displayLink` here because when UIImageView dealloc, it may trigger `[self stopAnimating]`, we already release the display link in SDAnimatedImageView's dealloc method.
    [_displayLink stop];
    // We need to reset the frame status, but not trigger any handle. This can ensure next time's playing status correct.
    [self resetCurrentFrameStatus];
}

- (void)pausePlaying {
    [_fetchQueue cancelAllOperations];
    [_displayLink stop];
}

- (BOOL)isPlaying {
    return _displayLink.isRunning;
}

- (void)seekToFrameAtIndex:(NSUInteger)index loopCount:(NSUInteger)loopCount {
    if (index >= self.totalFrameCount) {
        return;
    }
    self.currentFrameIndex = index;
    self.currentLoopCount = loopCount;
    self.currentFrame = [self.animatedProvider animatedImageFrameAtIndex:index];
    [self handleFrameChange];
}

#pragma mark - Core Render
- (void)displayDidRefresh:(SDDisplayLink *)displayLink {
    // If for some reason a wild call makes it through when we shouldn't be animating, bail.
    // Early return!
    if (!self.isPlaying) {
        return;
    }
    
    NSUInteger totalFrameCount = self.totalFrameCount;
    if (totalFrameCount <= 1) {
        // Total frame count less than 1, wrong configuration and stop animating
        [self stopPlaying];
        return;
    }
    
    NSTimeInterval playbackRate = self.playbackRate;
    if (playbackRate <= 0) {
        // Does not support <= 0 play rate
        [self stopPlaying];
        return;
    }
    
    // Calculate refresh duration
    NSTimeInterval duration = self.displayLink.duration;
    
    NSUInteger currentFrameIndex = self.currentFrameIndex;
    NSUInteger nextFrameIndex = (currentFrameIndex + 1) % totalFrameCount;
    
    if (self.playbackMode == SDAnimatedImagePlaybackModeReverse) {
        nextFrameIndex = currentFrameIndex == 0 ? (totalFrameCount - 1) : (currentFrameIndex - 1) % totalFrameCount;
        
    } else if (self.playbackMode == SDAnimatedImagePlaybackModeBounce ||
               self.playbackMode == SDAnimatedImagePlaybackModeReversedBounce) {
        if (currentFrameIndex == 0) {
            self.shouldReverse = false;
        } else if (currentFrameIndex == totalFrameCount - 1) {
            self.shouldReverse = true;
        }
        nextFrameIndex = self.shouldReverse ? (currentFrameIndex - 1) : (currentFrameIndex + 1);
        nextFrameIndex %= totalFrameCount;
    }
    
    
    // Check if we need to display new frame firstly
    BOOL bufferFull = NO;
    if (self.needsDisplayWhenImageBecomesAvailable) {
        UIImage *currentFrame;
        SD_LOCK(_lock);
        currentFrame = self.frameBuffer[@(currentFrameIndex)];
        SD_UNLOCK(_lock);
        
        // Update the current frame
        if (currentFrame) {
            SD_LOCK(_lock);
            // Remove the frame buffer if need
            if (self.frameBuffer.count > self.maxBufferCount) {
                self.frameBuffer[@(currentFrameIndex)] = nil;
            }
            // Check whether we can stop fetch
            if (self.frameBuffer.count == totalFrameCount) {
                bufferFull = YES;
            }
            SD_UNLOCK(_lock);
            
            // Update the current frame immediately
            self.currentFrame = currentFrame;
            [self handleFrameChange];
            
            self.bufferMiss = NO;
            self.needsDisplayWhenImageBecomesAvailable = NO;
        }
        else {
            self.bufferMiss = YES;
        }
    }
    
    // Check if we have the frame buffer
    if (!self.bufferMiss) {
        // Then check if timestamp is reached
        self.currentTime += duration;
        NSTimeInterval currentDuration = [self.animatedProvider animatedImageDurationAtIndex:currentFrameIndex];
        currentDuration = currentDuration / playbackRate;
        if (self.currentTime < currentDuration) {
            // Current frame timestamp not reached, return
            return;
        }
        
        // Otherwise, we should be ready to display next frame
        self.needsDisplayWhenImageBecomesAvailable = YES;
        self.currentFrameIndex = nextFrameIndex;
        self.currentTime -= currentDuration;
        NSTimeInterval nextDuration = [self.animatedProvider animatedImageDurationAtIndex:nextFrameIndex];
        nextDuration = nextDuration / playbackRate;
        if (self.currentTime > nextDuration) {
            // Do not skip frame
            self.currentTime = nextDuration;
        }
        
        // Update the loop count when last frame rendered
        if (nextFrameIndex == 0) {
            // Update the loop count
            self.currentLoopCount++;
            [self handleLoopChange];
            
            // if reached the max loop count, stop animating, 0 means loop indefinitely
            NSUInteger maxLoopCount = self.totalLoopCount;
            if (maxLoopCount != 0 && (self.currentLoopCount >= maxLoopCount)) {
                [self stopPlaying];
                return;
            }
        }
    }
    
    // Since we support handler, check animating state again
    if (!self.isPlaying) {
        return;
    }
    
    // Check if we should prefetch next frame or current frame
    // When buffer miss, means the decode speed is slower than render speed, we fetch current miss frame
    // Or, most cases, the decode speed is faster than render speed, we fetch next frame
    NSUInteger fetchFrameIndex = self.bufferMiss? currentFrameIndex : nextFrameIndex;
    UIImage *fetchFrame;
    SD_LOCK(_lock);
    fetchFrame = self.bufferMiss? nil : self.frameBuffer[@(nextFrameIndex)];
    SD_UNLOCK(_lock);
    
    if (!fetchFrame && !bufferFull && self.fetchQueue.operationCount == 0) {
        // Prefetch next frame in background queue
        id<SDAnimatedImageProvider> animatedProvider = self.animatedProvider;
        @weakify(self);
        NSOperation *operation = [NSBlockOperation blockOperationWithBlock:^{
            @strongify(self);
            if (!self) {
                return;
            }
            UIImage *frame = [animatedProvider animatedImageFrameAtIndex:fetchFrameIndex];

            BOOL isAnimating = self.displayLink.isRunning;
            if (isAnimating) {
                SD_LOCK(self->_lock);
                self.frameBuffer[@(fetchFrameIndex)] = frame;
                SD_UNLOCK(self->_lock);
            }
        }];
        [self.fetchQueue addOperation:operation];
    }
}

- (void)handleFrameChange {
    if (self.animationFrameHandler) {
        self.animationFrameHandler(self.currentFrameIndex, self.currentFrame);
    }
}

- (void)handleLoopChange {
    if (self.animationLoopHandler) {
        self.animationLoopHandler(self.currentLoopCount);
    }
}

#pragma mark - Util
- (void)calculateMaxBufferCount {
    NSUInteger bytes = CGImageGetBytesPerRow(self.currentFrame.CGImage) * CGImageGetHeight(self.currentFrame.CGImage);
    if (bytes == 0) bytes = 1024;
    
    NSUInteger max = 0;
    if (self.maxBufferSize > 0) {
        max = self.maxBufferSize;
    } else {
        // Calculate based on current memory, these factors are by experience
        NSUInteger total = [SDDeviceHelper totalMemory];
        NSUInteger free = [SDDeviceHelper freeMemory];
        max = MIN(total * 0.2, free * 0.6);
    }
    
    NSUInteger maxBufferCount = (double)max / (double)bytes;
    if (!maxBufferCount) {
        // At least 1 frame
        maxBufferCount = 1;
    }
    
    self.maxBufferCount = maxBufferCount;
}

+ (NSString *)defaultRunLoopMode {
    // Key off `activeProcessorCount` (as opposed to `processorCount`) since the system could shut down cores in certain situations.
    return [NSProcessInfo processInfo].activeProcessorCount > 1 ? NSRunLoopCommonModes : NSDefaultRunLoopMode;
}

@end
