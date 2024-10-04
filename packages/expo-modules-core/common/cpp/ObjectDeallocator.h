// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo::common {

class JSI_EXPORT ObjectDeallocator : public jsi::NativeState {
public:
  typedef std::function<void()> Block;

  ObjectDeallocator(const Block deallocator) : deallocator(deallocator) {};

  virtual ~ObjectDeallocator() {
    deallocator();
  }

  const Block deallocator;

}; // class ObjectDeallocator

/**
 Sets the deallocator block on a given object, which is called when the object is being deallocated.
 */
void setDeallocator(
  jsi::Runtime &runtime,
  const std::shared_ptr<jsi::Object> &jsThis,
  ObjectDeallocator::Block deallocatorBlock
);

} // namespace expo::common

#endif
