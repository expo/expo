/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol SKSonarValueCoder

+ (instancetype)fromSonarValue:(id)sonarValue;

- (NSDictionary<NSString*, id<NSObject>>*)sonarValue;

@end

class SKObject {
 public:
  SKObject(CGRect rect);
  SKObject(CGSize size);
  SKObject(CGPoint point);
  SKObject(UIEdgeInsets insets);
  SKObject(CGAffineTransform transform);
  SKObject(id<SKSonarValueCoder> value);
  SKObject(id value);

  operator id<NSObject>() const noexcept {
    return _actual ?: [NSNull null];
  }

 protected:
  id<NSObject> _actual;
};

class SKMutableObject : public SKObject {
 public:
  SKMutableObject(CGRect rect) : SKObject(rect) {}
  SKMutableObject(CGSize size) : SKObject(size){};
  SKMutableObject(CGPoint point) : SKObject(point){};
  SKMutableObject(UIEdgeInsets insets) : SKObject(insets){};
  SKMutableObject(CGAffineTransform transform) : SKObject(transform){};
  SKMutableObject(id<SKSonarValueCoder> value) : SKObject(value){};
  SKMutableObject(id value) : SKObject(value){};

  operator id<NSObject>() {
    convertToMutable();
    return _actual;
  }

 protected:
  BOOL _convertedToMutable = NO;
  void convertToMutable();
};
