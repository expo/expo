#include "ModuleDefinition.h"

namespace expo {
void ModuleDefinition::Name(std::string name) {
  data_.name_ = std::move(name);
}

ModuleDefinitionData ModuleDefinition::build() {
  return std::move(data_);
}

} // namespace expo
