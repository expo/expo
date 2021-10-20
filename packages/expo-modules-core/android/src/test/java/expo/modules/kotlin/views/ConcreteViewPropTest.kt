package expo.modules.kotlin.views

import android.view.View
import com.google.common.truth.Truth
import io.mockk.mockk
import org.junit.Test

class ConcreteViewPropTest {
  @Test
  fun `set should call passed setter`() {
    val mockedView = mockk<View>()
    var providedValue = -1
    var providedView: View? = null

    val prop = ConcreteViewProp<View, Int>("name") { view, value ->
      providedValue = value
      providedView = view
    }

    prop.set(10, mockedView)

    Truth.assertThat(providedValue).isEqualTo(10)
    Truth.assertThat(providedView).isSameInstanceAs(mockedView)
  }
}
