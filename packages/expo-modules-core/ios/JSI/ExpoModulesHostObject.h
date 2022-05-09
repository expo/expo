// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <vector>
#import <jsi/jsi.h>

namespace jsi = facebook::jsi;

@class EXAppContext;

namespace expo {

class JSI_EXPORT ExpoModulesHostObject : public jsi::HostObject {
public:
  ExpoModulesHostObject(EXAppContext *appContext);

  virtual ~ExpoModulesHostObject();

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  EXAppContext *appContext;

}; // class ExpoModulesHostObject

} // namespace expo

#endif
