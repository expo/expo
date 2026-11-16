package expo.ktlint

import com.pinterest.ktlint.rule.engine.core.api.ElementType.IMPORT_DIRECTIVE
import com.pinterest.ktlint.rule.engine.core.api.Rule
import com.pinterest.ktlint.rule.engine.core.api.RuleId
import org.jetbrains.kotlin.com.intellij.lang.ASTNode
import org.jetbrains.kotlin.psi.KtFile
import org.jetbrains.kotlin.psi.KtImportDirective

private const val SHARED_PACKAGE = "expo.modules.observe.shared"

private val FORBIDDEN_PACKAGES =
  listOf(
    "expo.modules.kotlin",
    "expo.modules.core",
    "expo.modules.interfaces",
    "expo.modules.updatesinterface",
    "expo.modules.easclient",
    "com.facebook.react"
  )

// The shared and glue code of expo-observe are in one Gradle project, so only this rule keeps
// the shared code free of Expo modules and React Native. It sees imports, not fully qualified names.
class ObserveSharedImportsRule :
  Rule(
    ruleId = RuleId("$EXPO_RULE_SET_ID:observe-shared-imports"),
    about = EXPO_RULE_ABOUT
  ) {
  override fun beforeVisitChildNodes(
    node: ASTNode,
    autoCorrect: Boolean,
    emit: (offset: Int, errorMessage: String, canBeAutoCorrected: Boolean) -> Unit
  ) {
    if (node.elementType != IMPORT_DIRECTIVE) {
      return
    }
    val filePackage = (node.psi.containingFile as? KtFile)?.packageFqName?.asString() ?: return
    if (!filePackage.isInPackage(SHARED_PACKAGE)) {
      return
    }
    val imported = (node.psi as? KtImportDirective)?.importPath?.pathStr ?: return
    if (FORBIDDEN_PACKAGES.any { imported.isInPackage(it) }) {
      emit(
        node.startOffset,
        "`$imported` is not allowed in `$SHARED_PACKAGE`. Shared code must not depend on Expo modules or React Native. " +
          "Move the code that needs it to the glue package `expo.modules.observe`.",
        false
      )
    }
  }

  private fun String.isInPackage(packageName: String): Boolean =
    this == packageName || startsWith("$packageName.")
}
