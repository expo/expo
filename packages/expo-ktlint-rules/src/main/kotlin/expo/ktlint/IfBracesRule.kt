package expo.ktlint

import com.pinterest.ktlint.rule.engine.core.api.ElementType.BINARY_EXPRESSION
import com.pinterest.ktlint.rule.engine.core.api.ElementType.BLOCK
import com.pinterest.ktlint.rule.engine.core.api.ElementType.DOT_QUALIFIED_EXPRESSION
import com.pinterest.ktlint.rule.engine.core.api.ElementType.ELSE
import com.pinterest.ktlint.rule.engine.core.api.ElementType.ELSE_KEYWORD
import com.pinterest.ktlint.rule.engine.core.api.ElementType.IF
import com.pinterest.ktlint.rule.engine.core.api.ElementType.LBRACE
import com.pinterest.ktlint.rule.engine.core.api.ElementType.LONG_STRING_TEMPLATE_ENTRY
import com.pinterest.ktlint.rule.engine.core.api.ElementType.RBRACE
import com.pinterest.ktlint.rule.engine.core.api.ElementType.RPAR
import com.pinterest.ktlint.rule.engine.core.api.ElementType.THEN
import com.pinterest.ktlint.rule.engine.core.api.IndentConfig
import com.pinterest.ktlint.rule.engine.core.api.Rule
import com.pinterest.ktlint.rule.engine.core.api.RuleId
import com.pinterest.ktlint.rule.engine.core.api.editorconfig.EditorConfig
import com.pinterest.ktlint.rule.engine.core.api.editorconfig.INDENT_SIZE_PROPERTY
import com.pinterest.ktlint.rule.engine.core.api.editorconfig.INDENT_STYLE_PROPERTY
import com.pinterest.ktlint.rule.engine.core.api.indent
import com.pinterest.ktlint.rule.engine.core.api.isPartOfComment
import com.pinterest.ktlint.rule.engine.core.api.isWhiteSpace
import com.pinterest.ktlint.rule.engine.core.api.isWhiteSpaceWithoutNewline
import com.pinterest.ktlint.rule.engine.core.api.nextSibling
import com.pinterest.ktlint.rule.engine.core.api.parent
import com.pinterest.ktlint.rule.engine.core.api.upsertWhitespaceBeforeMe
import org.jetbrains.kotlin.com.intellij.lang.ASTNode
import org.jetbrains.kotlin.com.intellij.psi.impl.source.tree.LeafPsiElement
import org.jetbrains.kotlin.com.intellij.psi.impl.source.tree.PsiWhiteSpaceImpl
import org.jetbrains.kotlin.psi.KtBlockExpression
import org.jetbrains.kotlin.psi.psiUtil.leaves

class IfBracesRule :
  Rule(
    ruleId = RuleId("$EXPO_RULE_SET_ID:if-braces"),
    about = EXPO_RULE_ABOUT,
    usesEditorConfigProperties = setOf(INDENT_SIZE_PROPERTY, INDENT_STYLE_PROPERTY)
  ) {
  private var indentConfig = IndentConfig.DEFAULT_INDENT_CONFIG

  override fun beforeFirstNode(editorConfig: EditorConfig) {
    indentConfig =
      IndentConfig(
        indentStyle = editorConfig[INDENT_STYLE_PROPERTY],
        tabWidth = editorConfig[INDENT_SIZE_PROPERTY]
      )
  }

  override fun beforeVisitChildNodes(
    node: ASTNode,
    autoCorrect: Boolean,
    emit: (offset: Int, errorMessage: String, canBeAutoCorrected: Boolean) -> Unit
  ) {
    if (node.elementType != THEN && node.elementType != ELSE) {
      return
    }

    val branch = node.firstChildNode 
      ?: return

    if (branch.elementType == BLOCK) {
      return
    }

    if (node.elementType == ELSE && branch.isElseIf()) {
      return
    }
  
    if (node.parent(LONG_STRING_TEMPLATE_ENTRY) != null) {
      return
    }

    val branchName = if (node.elementType == THEN) "if" else "else"
    emit(branch.startOffset, "Missing { ... } around the $branchName branch", true)
    if (autoCorrect) {
      wrapInBlock(node)
    }
  }

  private fun ASTNode.isElseIf(): Boolean =
    elementType == IF || (elementType in setOf(BINARY_EXPRESSION, DOT_QUALIFIED_EXPRESSION) && firstChildNode?.elementType == IF)

  private fun wrapInBlock(node: ASTNode) {
    val prevLeaves =
      node
        .leaves(forward = false)
        .takeWhile { it.elementType !in listOf(RPAR, ELSE_KEYWORD) }
        .toList()
        .reversed()
    val nextLeaves =
      node
        .leaves(forward = true)
        .takeWhile { it.isWhiteSpaceWithoutNewline() || it.isPartOfComment() }
        .toList()
        .dropLastWhile { it.isWhiteSpaceWithoutNewline() }

    prevLeaves
      .firstOrNull()
      .takeIf { it.isWhiteSpace() }
      ?.let { (it as LeafPsiElement).rawReplaceWithText(" ") }
    KtBlockExpression(null).apply {
      val previousChild = node.firstChildNode
      node.replaceChild(node.firstChildNode, this)
      addChild(LeafPsiElement(LBRACE, "{"))
      addChild(PsiWhiteSpaceImpl(indentConfig.childIndentOf(node)))
      prevLeaves
        .dropWhile { it.isWhiteSpace() }
        .forEach(::addChild)
      addChild(previousChild)
      nextLeaves.forEach(::addChild)
      addChild(PsiWhiteSpaceImpl(node.indent()))
      addChild(LeafPsiElement(RBRACE, "}"))
    }

    if (node.elementType == THEN) {
      node
        .nextSibling { !it.isPartOfComment() }
        ?.upsertWhitespaceBeforeMe(" ")
    }
  }
}
