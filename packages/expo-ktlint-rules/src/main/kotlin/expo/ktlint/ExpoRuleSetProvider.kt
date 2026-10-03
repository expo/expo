package expo.ktlint

import com.pinterest.ktlint.cli.ruleset.core.api.RuleSetProviderV3
import com.pinterest.ktlint.rule.engine.core.api.Rule
import com.pinterest.ktlint.rule.engine.core.api.RuleProvider
import com.pinterest.ktlint.rule.engine.core.api.RuleSetId

internal const val EXPO_RULE_SET_ID = "expo"

internal val EXPO_RULE_ABOUT =
  Rule.About(
    maintainer = "Expo",
    repositoryUrl = "https://github.com/expo/expo/tree/main/packages/expo-ktlint-rules",
    issueTrackerUrl = "https://github.com/expo/expo/issues"
  )

class ExpoRuleSetProvider : RuleSetProviderV3(id = RuleSetId(EXPO_RULE_SET_ID)) {
  override fun getRuleProviders(): Set<RuleProvider> =
    setOf(
      RuleProvider { IfBracesRule() }
    )
}
