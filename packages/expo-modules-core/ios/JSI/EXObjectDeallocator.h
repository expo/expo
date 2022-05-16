// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

typedef void (^ObjectDeallocatorBlock)();

class JSI_EXPORT ObjectDeallocator : public jsi::HostObject {
public:
  ObjectDeallocator(const ObjectDeallocatorBlock deallocator) : deallocator(deallocator) {};

  virtual ~ObjectDeallocator() {
    deallocator();
  }

  const ObjectDeallocatorBlock deallocator;

}; // class ObjectDeallocator

} // namespace expo

#endif
