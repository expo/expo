// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <vector>
#import <jsi/jsi.h>

using namespace facebook;

@class SwiftInteropBridge;

namespace expo {

class JSI_EXPORT ExpoModulesHostObject : public jsi::HostObject {
public:
  ExpoModulesHostObject(SwiftInteropBridge *interopBridge);

  virtual ~ExpoModulesHostObject();

  virtual jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name);

  virtual void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value);

  virtual std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt);

private:
  SwiftInteropBridge *swiftInterop;

}; // class ExpoModulesHostObject

} // namespace expo

#endif
