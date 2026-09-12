#include "CppModule.h"

namespace expo {

void CppModule::install(jsi::Runtime &rt, jsi::Object &parent) {
  auto def = definition();

  moduleObject_ = std::make_shared<jsi::Object>(rt);

  def.decorate(rt, *moduleObject_);

  parent.setProperty(
    rt,
    def.name().data(),
    *moduleObject_
  );
}

} // namespace expo
