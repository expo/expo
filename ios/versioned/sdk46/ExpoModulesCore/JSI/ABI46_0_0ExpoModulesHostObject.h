// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <vector>
#import <ABI46_0_0jsi/ABI46_0_0jsi.h>

namespace jsi = ABI46_0_0facebook::jsi;

@class ABI46_0_0EXAppContext;

namespace ABI46_0_0expo {

class JSI_EXPORT ExpoModulesHostObject : public jsi::HostObject {
public:
  ExpoModulesHostObject(ABI46_0_0EXAppContext *appContext);

  virtual ~ExpoModulesHostObject();

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  ABI46_0_0EXAppContext *appContext;

}; // class ExpoModulesHostObject

} // namespace ABI46_0_0expo

#endif
