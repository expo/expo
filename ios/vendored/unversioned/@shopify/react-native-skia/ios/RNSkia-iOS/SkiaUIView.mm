#import <React/RCTBridge.h>

#import "SkiaUIView.h"

#include <utility>
#include <vector>

#import <RNSkManager.h>

@implementation SkiaUIView {
  std::shared_ptr<RNSkBaseiOSView> _impl;
  RNSkia::RNSkManager *_manager;
  RNSkia::RNSkDrawingMode _drawingMode;
  std::function<std::shared_ptr<RNSkBaseiOSView>(
      std::shared_ptr<RNSkia::RNSkPlatformContext>)>
      _factory;
  bool _debugMode;
  size_t _nativeId;
}

#pragma mark Initialization and destruction

- (instancetype)initWithManager:(RNSkia::RNSkManager *)manager
                        factory:
                            (std::function<std::shared_ptr<RNSkBaseiOSView>(
                                 std::shared_ptr<RNSkia::RNSkPlatformContext>)>)
                                factory {
  self = [super init];
  if (self) {
    _manager = manager;
    _nativeId = 0;
    _debugMode = false;
    _drawingMode = RNSkia::RNSkDrawingMode::Default;
    _factory = factory;

    // Listen to notifications about module invalidation
    [[NSNotificationCenter defaultCenter]
        addObserver:self
           selector:@selector(willInvalidateModules)
               name:RCTBridgeWillInvalidateModulesNotification
             object:nil];
  }
  return self;
}

- (void)willInvalidateModules {
  _impl = nullptr;
  _manager = nullptr;
}

#pragma mark Lifecycle

- (void)willMoveToSuperview:(UIView *)newWindow {
  if (newWindow == NULL) {
    // Remove implementation view when the parent view is not set
    if (_impl != nullptr) {
      [_impl->getLayer() removeFromSuperlayer];

      if (_nativeId != 0 && _manager != nullptr) {
        _manager->setSkiaView(_nativeId, nullptr);
      }

      _impl = nullptr;
    }
  } else {
    // Create implementation view when the parent view is set
    if (_impl == nullptr && _manager != nullptr) {
      _impl = _factory(_manager->getPlatformContext());
      if (_impl == nullptr) {
        throw std::runtime_error(
            "Expected Skia view implementation, got nullptr.");
      }
      [self.layer addSublayer:_impl->getLayer()];
      if (_nativeId != 0) {
        _manager->setSkiaView(_nativeId, _impl->getDrawView());
      }
      _impl->getDrawView()->setDrawingMode(_drawingMode);
      _impl->getDrawView()->setShowDebugOverlays(_debugMode);
    }
  }
}

- (void)dealloc {
  if (_manager != nullptr && _nativeId != 0) {
    _manager->unregisterSkiaView(_nativeId);
  }

  [[NSNotificationCenter defaultCenter]
      removeObserver:self
                name:RCTBridgeWillInvalidateModulesNotification
              object:nil];

  assert(_impl == nullptr);
}

#pragma Render

- (void)drawRect:(CGRect)rect {
  // We override drawRect to ensure we to direct rendering when the
  // underlying OS view needs to render:
  if (_impl != nullptr) {
    _impl->getDrawView()->renderImmediate();
  }
}

#pragma mark Layout

- (void)layoutSubviews {
  [super layoutSubviews];
  if (_impl != nullptr) {
    _impl->setSize(self.bounds.size.width, self.bounds.size.height);
  }
}

#pragma mark Properties

- (void)setDrawingMode:(std::string)mode {
  _drawingMode = mode.compare("continuous") == 0
                     ? RNSkia::RNSkDrawingMode::Continuous
                     : RNSkia::RNSkDrawingMode::Default;

  if (_impl != nullptr) {
    _impl->getDrawView()->setDrawingMode(_drawingMode);
  }
}

- (void)setDebugMode:(bool)debugMode {
  _debugMode = debugMode;
  if (_impl != nullptr) {
    _impl->getDrawView()->setShowDebugOverlays(debugMode);
  }
}

- (void)setNativeId:(size_t)nativeId {
  _nativeId = nativeId;

  if (_impl != nullptr) {
    _manager->registerSkiaView(nativeId, _impl->getDrawView());
  }
}

#pragma mark External API

- (std::shared_ptr<RNSkBaseiOSView>)impl {
  return _impl;
}

#pragma mark Touch handling

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  [self handleTouches:touches withEvent:event];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  [self handleTouches:touches withEvent:event];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  [self handleTouches:touches withEvent:event];
}

- (void)handleTouches:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  if (event.type == UIEventTypeTouches) {
    std::vector<RNSkia::RNSkTouchInfo> nextTouches;
    for (UITouch *touch in touches) {
      auto position = [touch preciseLocationInView:self];
      RNSkia::RNSkTouchInfo nextTouch;
      nextTouch.x = position.x;
      nextTouch.y = position.y;
      nextTouch.force = [touch force];
      nextTouch.id = [touch hash];
      auto phase = [touch phase];
      switch (phase) {
      case UITouchPhaseBegan:
        nextTouch.type = RNSkia::RNSkTouchInfo::TouchType::Start;
        break;
      case UITouchPhaseMoved:
        nextTouch.type = RNSkia::RNSkTouchInfo::TouchType::Active;
        break;
      case UITouchPhaseEnded:
        nextTouch.type = RNSkia::RNSkTouchInfo::TouchType::End;
        break;
      case UITouchPhaseCancelled:
        nextTouch.type = RNSkia::RNSkTouchInfo::TouchType::Cancelled;
        break;
      default:
        nextTouch.type = RNSkia::RNSkTouchInfo::TouchType::Active;
        break;
      }

      nextTouches.push_back(nextTouch);
    }
    if (_impl != nullptr) {
      _impl->getDrawView()->updateTouchState(nextTouches);
    }
  }
}

@end
