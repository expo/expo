@file:Suppress("DEPRECATION")

package expo.modules.plugin

import groovy.util.Node
import groovy.util.NodeList
import groovy.util.XmlParser
import kotlin.test.Test
import kotlin.test.assertEquals

class ExtensionsTest {
  @Test
  fun setVersionReplacesExistingVersionNode() {
    val dependency =
      XmlParser()
        .parseText(
          """
          <dependency>
            <groupId>com.facebook.react</groupId>
            <artifactId>react-android</artifactId>
            <version>+</version>
            <scope>runtime</scope>
          </dependency>
          """.trimIndent()
        )

    dependency.setVersion("0.83.6")

    val versions = dependency.versionNodes()
    assertEquals(1, versions.size)
    assertEquals("0.83.6", (versions.first() as Node).text())
  }

  @Test
  fun setVersionAppendsMissingVersionNode() {
    val dependency =
      XmlParser()
        .parseText(
          """
          <dependency>
            <groupId>com.facebook.hermes</groupId>
            <artifactId>hermes-android</artifactId>
            <scope>runtime</scope>
          </dependency>
          """.trimIndent()
        )

    dependency.setVersion("0.13.0")

    val versions = dependency.versionNodes()
    assertEquals(1, versions.size)
    assertEquals("0.13.0", (versions.first() as Node).text())
  }

  private fun Node.versionNodes(): NodeList = get("version") as NodeList
}
