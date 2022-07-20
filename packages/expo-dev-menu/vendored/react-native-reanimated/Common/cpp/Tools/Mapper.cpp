#include "DevMenuMapper.h"
#include "DevMenuMutableValue.h"
#include "DevMenuSharedParent.h"

namespace devmenureanimated {

Mapper::Mapper(
    NativeReanimatedModule *module,
    unsigned long id,
    std::shared_ptr<jsi::Function> mapper,
    std::vector<std::shared_ptr<MutableValue>> inputs,
    std::vector<std::shared_ptr<MutableValue>> outputs)
    : id(id), module(module), mapper(mapper), inputs(inputs), outputs(outputs) {
  auto markDirty = [this, module]() {
    this->dirty = true;
    module->maybeRequestRender();
  };
  for (auto input : inputs) {
    input->addListener(id, markDirty);
  }
}

void Mapper::execute(jsi::Runtime &rt) {
  dirty = false;
  if (optimalizationLvl == 0) {
    mapper->callWithThis(rt, *mapper); // call styleUpdater
  } else {
    jsi::Object newStyle = userUpdater->call(rt).asObject(rt);
    auto jsViewDescriptorArray = viewDescriptors->getValue(rt)
                                     .getObject(rt)
                                     .getProperty(rt, "value")
                                     .asObject(rt)
                                     .getArray(rt);
    for (int i = 0; i < jsViewDescriptorArray.length(rt); ++i) {
      auto jsViewDescriptor =
          jsViewDescriptorArray.getValueAtIndex(rt, i).getObject(rt);
      (*updateProps)(
          rt,
          static_cast<int>(jsViewDescriptor.getProperty(rt, "tag").asNumber()),
          jsViewDescriptor.getProperty(rt, "name"),
          newStyle);
    }
  }
}

void Mapper::enableFastMode(
    const int optimalizationLvl,
    const std::shared_ptr<ShareableValue> &updater,
    const std::shared_ptr<ShareableValue> &jsViewDescriptors) {
  if (optimalizationLvl == 0) {
    return;
  }
  viewDescriptors = jsViewDescriptors;
  this->optimalizationLvl = optimalizationLvl;
  updateProps = &module->updaterFunction;
  jsi::Runtime *rt = module->runtime.get();
  userUpdater = std::make_shared<jsi::Function>(
      updater->getValue(*rt).asObject(*rt).asFunction(*rt));
}

Mapper::~Mapper() {
  for (auto input : inputs) {
    input->removeListener(id);
  }
}

} // namespace devmenureanimated
