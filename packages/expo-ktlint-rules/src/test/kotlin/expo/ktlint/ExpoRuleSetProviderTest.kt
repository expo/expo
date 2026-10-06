package expo.ktlint

import com.pinterest.ktlint.cli.ruleset.core.api.RuleSetProviderV3
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.util.ServiceLoader

class ExpoRuleSetProviderTest {
  @Test
  fun `is discoverable the same way Spotless loads rule sets`() {
    val provider = ServiceLoader.load(RuleSetProviderV3::class.java).single { it.id.value == "expo" }

    val ruleIds = provider.getRuleProviders().map { it.createNewRuleInstance().ruleId.value }

    assertEquals(listOf("expo:if-braces"), ruleIds)
  }
}
