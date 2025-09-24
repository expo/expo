package localModulesExamples

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

public class SimpleModule : Module() {
    override fun definition() = ModuleDefinition {
        Constant("test") { ->
            "Kotlin constant 1 new localModulesProvider"
        }
    }
}
