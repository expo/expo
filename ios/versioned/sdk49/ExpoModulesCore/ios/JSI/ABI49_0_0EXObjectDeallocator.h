// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <ABI49_0_0jsi/ABI49_0_0jsi.h>

namespace jsi = ABI49_0_0facebook::jsi;

namespace ABI49_0_0expo {

typedef void (^ObjectDeallocatorBlock)();

class JSI_EXPORT ObjectDeallocator : public jsi::HostObject {
public:
  ObjectDeallocator(const ObjectDeallocatorBlock deallocator) : deallocator(deallocator) {};

  virtual ~ObjectDeallocator() {
    deallocator();
  }

  const ObjectDeallocatorBlock deallocator;

}; // class ObjectDeallocator

} // namespace ABI49_0_0expo

#endif
