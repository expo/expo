#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>

#import <ABI46_0_0SkiaDrawView.h>

#include <utility>
#include <vector>

#import <ABI46_0_0RNSkDrawViewImpl.h>
#import <ABI46_0_0RNSkManager.h>

@implementation ABI46_0_0SkiaDrawView {
  std::shared_ptr<ABI46_0_0RNSkDrawViewImpl> _impl;
  ABI46_0_0RNSkia::ABI46_0_0RNSkManager* _manager;
  ABI46_0_0RNSkia::ABI46_0_0RNSkDrawingMode _drawingMode;
  bool _debugMode;
  size_t _nativeId;
}

#pragma mark Initialization and destruction

- (instancetype) initWithManager: (ABI46_0_0RNSkia::ABI46_0_0RNSkManager*)manager;
{
  self = [super init];
  if (self) {
    _manager = manager;
    _nativeId = 0;
    _debugMode = false;
    _drawingMode = ABI46_0_0RNSkia::ABI46_0_0RNSkDrawingMode::Default;
    
    // Listen to notifications about module invalidation
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(willInvalidateModules)
                                                 name:ABI46_0_0RCTBridgeWillInvalidateModulesNotification
                                               object:nil];
  }
  return self;
}

- (void) willInvalidateModules {
  _impl = nullptr;
  _manager = nullptr;
}

#pragma mark Lifecycle

- (void) willMoveToSuperview:(UIView *)newWindow {
  if (newWindow == NULL) {
    // Remove implementation view when the parent view is not set
    if(_impl != nullptr) {
      [_impl->getLayer() removeFromSuperlayer];
      
      if(_nativeId != 0 && _manager != nullptr) {
        _manager->setSkiaDrawView(_nativeId, nullptr);
      }
      
      _impl = nullptr;
    }
  } else {
    // Create implementation view when the parent view is set
    if(_impl == nullptr && _manager != nullptr) {
      _impl = std::make_shared<ABI46_0_0RNSkDrawViewImpl>(_manager->getPlatformContext());
      [self.layer addSublayer: _impl->getLayer()];
      if(_nativeId != 0) {
        _manager->setSkiaDrawView(_nativeId, _impl);
      }
      _impl->setDrawingMode(_drawingMode);
      _impl->setShowDebugOverlays(_debugMode);
    }
  }
}

- (void) dealloc {
  if(_manager != nullptr && _nativeId != 0) {
    _manager->unregisterSkiaDrawView(_nativeId);
  }
}

#pragma mark Layout

- (void) layoutSubviews {
  [super layoutSubviews];
  if(_impl != nullptr) {
    _impl->setSize(self.bounds.size.width, self.bounds.size.height);
  }
}

#pragma mark Properties

-(void) setDrawingMode:(std::string) mode {
  _drawingMode = mode.compare("continuous") == 0 ? ABI46_0_0RNSkia::ABI46_0_0RNSkDrawingMode::Continuous : ABI46_0_0RNSkia::ABI46_0_0RNSkDrawingMode::Default;
  
  if(_impl != nullptr) {
    _impl->setDrawingMode(_drawingMode);
  }
}

-(void) setDebugMode:(bool) debugMode {
  _debugMode = debugMode;
  if(_impl != nullptr) {
    _impl->setShowDebugOverlays(debugMode);
  }
}

- (void) setNativeId:(size_t) nativeId {
  _nativeId = nativeId;
  
  if(_impl != nullptr) {
    _manager->registerSkiaDrawView(nativeId, _impl);
  }
}

#pragma mark External API

- (std::shared_ptr<ABI46_0_0RNSkDrawViewImpl>) impl {
  return _impl;
}

#pragma mark Touch handling

- (void) touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  [self handleTouches:touches withEvent:event];
}

-(void) touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  [self handleTouches:touches withEvent:event];
}

-(void) touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  [self handleTouches:touches withEvent:event];
}

- (void) handleTouches:(NSSet<UITouch*>*) touches withEvent:(UIEvent*) event {
  if (event.type == UIEventTypeTouches) {
    std::vector<ABI46_0_0RNSkia::ABI46_0_0RNSkTouchPoint> nextTouches;
    for (UITouch *touch in touches) {
      auto position = [touch preciseLocationInView:self];
      ABI46_0_0RNSkia::ABI46_0_0RNSkTouchPoint nextTouch;
      nextTouch.x = position.x;
      nextTouch.y = position.y;
      nextTouch.force = [touch force];    
      nextTouch.id = [touch hash];
      auto phase = [touch phase];
      switch(phase) {
        case UITouchPhaseBegan:
          nextTouch.type = ABI46_0_0RNSkia::ABI46_0_0RNSkTouchType::Start;
          break;
        case UITouchPhaseMoved:
          nextTouch.type = ABI46_0_0RNSkia::ABI46_0_0RNSkTouchType::Active;
          break;
        case UITouchPhaseEnded:
          nextTouch.type = ABI46_0_0RNSkia::ABI46_0_0RNSkTouchType::End;
          break;
        case UITouchPhaseCancelled:
          nextTouch.type = ABI46_0_0RNSkia::ABI46_0_0RNSkTouchType::Cancelled;
          break;
        default:
          nextTouch.type = ABI46_0_0RNSkia::ABI46_0_0RNSkTouchType::Active;
          break;
      }
      
      nextTouches.push_back(nextTouch);
    }
    if(_impl != nullptr) {
      _impl->updateTouchState(std::move(nextTouches));
    }
  }
}

@end
