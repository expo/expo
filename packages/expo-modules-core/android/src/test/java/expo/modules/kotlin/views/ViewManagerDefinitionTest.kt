package expo.modules.kotlin.views

import android.widget.ListView
import android.widget.TextView
import com.google.common.truth.Truth
import io.mockk.mockk
import org.junit.Test

class ViewManagerDefinitionTest {

  @Test
  fun `definition should deduce type of view manager`() {
    val simpleViewManagerDefinition = ViewManagerDefinition(
      null,
      { _, _ -> mockk<TextView>() },
      TextView::class.java,
      emptyMap()
    )

    val groupViewManagerDefinition = ViewManagerDefinition(
      null,
      { _, _ -> mockk<ListView>() },
      ListView::class.java,
      emptyMap()
    )

    Truth.assertThat(simpleViewManagerDefinition.getViewManagerType()).isEqualTo(ViewManagerType.SIMPLE)
    Truth.assertThat(groupViewManagerDefinition.getViewManagerType()).isEqualTo(ViewManagerType.GROUP)
  }
}
