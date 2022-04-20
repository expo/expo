// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <vector>
#import <ABI45_0_0jsi/ABI45_0_0jsi.h>

namespace jsi = ABI45_0_0facebook::jsi;

@class SwiftInteropBridge;

namespace ABI45_0_0expo {

class JSI_EXPORT ExpoModulesHostObject : public jsi::HostObject {
public:
  ExpoModulesHostObject(SwiftInteropBridge *interopBridge);

  virtual ~ExpoModulesHostObject();

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  SwiftInteropBridge *swiftInterop;

}; // class ExpoModulesHostObject

} // namespace ABI45_0_0expo

#endif
