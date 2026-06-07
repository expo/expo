package expo.modules.kotlin.views

import android.widget.ListView
import android.widget.TextView
import com.google.common.truth.Truth
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test

class ViewManagerDefinitionTest {

  @Test
  fun `definition should deduce type of view manager`() {
    val simpleViewManagerDefinition = ViewManagerDefinition(
      viewFactory = { _, _ -> mockk<TextView>() },
      viewType = TextView::class.java,
      props = emptyMap()
    )

    val groupViewManagerDefinition = ViewManagerDefinition(
      viewFactory = { _, _ -> mockk<ListView>() },
      viewType = ListView::class.java,
      props = emptyMap()
    )

    Truth.assertThat(simpleViewManagerDefinition.getViewManagerType()).isEqualTo(ViewManagerType.SIMPLE)
    Truth.assertThat(groupViewManagerDefinition.getViewManagerType()).isEqualTo(ViewManagerType.GROUP)
  }

  @Test
  fun `createView stores the view definition onto the ExpoView`() {
    val createdView = mockk<ExpoView>(relaxed = true)
    val definition = ViewManagerDefinition(
      viewFactory = { _, _ -> createdView },
      viewType = ExpoView::class.java,
      props = emptyMap()
    )
    val delegate = ViewManagerWrapperDelegate(mockk(relaxed = true), definition)

    delegate.createView(mockk())

    verify { createdView.viewDefinition = definition }
  }
}
