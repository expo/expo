#include "ModuleDefinitionData.h"

namespace expo {

std::string_view ModuleDefinitionData::name() const {
  return name_;
}

void ModuleDefinitionData::decorate(jsi::Runtime &rt, jsi::Object &obj) const {
  for (auto &entry: functions_) {
    auto fn = jsi::Function::createFromHostFunction(
      rt,
      jsi::PropNameID::forAscii(rt, entry.name),
      entry.paramCount,
      entry.hostFn
    );

    obj.setProperty(rt, entry.name.c_str(), std::move(fn));
  }

  for (auto &prop: properties_) {
    jsi::Object descriptor(rt);

    if (prop.getter) {
      descriptor.setProperty(
        rt,
        "get",
        jsi::Function::createFromHostFunction(
          rt,
          jsi::PropNameID::forAscii(rt, prop.name),
          0,
          prop.getter
        )
      );
    }
    if (prop.setter) {
      descriptor.setProperty(
        rt,
        "set",
        jsi::Function::createFromHostFunction(
          rt,
          jsi::PropNameID::forAscii(rt, prop.name),
          1,
          prop.setter
        )
      );
    }
    descriptor.setProperty(rt, "enumerable", true);
    descriptor.setProperty(rt, "configurable", true);

    auto defineProperty = rt.global()
      .getPropertyAsObject(rt, "Object")
      .getPropertyAsFunction(rt, "defineProperty");

    defineProperty.call(
      rt,
      obj,
      jsi::String::createFromAscii(rt, prop.name),
      std::move(descriptor)
    );
  }
}

} // namespace expo
