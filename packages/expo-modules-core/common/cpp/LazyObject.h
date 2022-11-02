// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

/**
 A function that is responsible for initializing the backed object.
 */
typedef std::function<std::shared_ptr<jsi::Object>(jsi::Runtime &)> LazyObjectInitializer;

/**
 A host object that defers the creating of the raw object until any property is accessed for the first time.
 */
class JSI_EXPORT LazyObject : public jsi::HostObject {
public:
  using Shared = std::shared_ptr<LazyObject>;

  LazyObject(const LazyObjectInitializer initializer);

  virtual ~LazyObject();

  jsi::Value get(jsi::Runtime &, const jsi::PropNameID &name) override;

  void set(jsi::Runtime &, const jsi::PropNameID &name, const jsi::Value &value) override;

  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt) override;

private:
  const LazyObjectInitializer initializer;
  std::shared_ptr<jsi::Object> backedObject;

}; // class LazyObject

} // namespace expo

#endif // __cplusplus
