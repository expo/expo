// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <vector>
#import <unordered_map>
#import <ABI48_0_0jsi/ABI48_0_0jsi.h>

namespace jsi = ABI48_0_0facebook::jsi;

@class ABI48_0_0EXAppContext;

namespace ABI48_0_0expo {

using SharedJSIObject = std::shared_ptr<jsi::Object>;
using UniqueJSIObject = std::unique_ptr<jsi::Object>;

class JSI_EXPORT ExpoModulesHostObject : public jsi::HostObject {
public:
  ExpoModulesHostObject(ABI48_0_0EXAppContext *appContext);

  virtual ~ExpoModulesHostObject();

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  ABI48_0_0EXAppContext *appContext;
  std::unordered_map<std::string, UniqueJSIObject> modulesCache;

}; // class ExpoModulesHostObject

} // namespace ABI48_0_0expo

#endif
