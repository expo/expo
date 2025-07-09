package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyMap
import com.google.common.truth.Truth
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.toAnyType
import io.mockk.mockk
import org.junit.Test
import kotlin.reflect.typeOf

class ConcreteViewPropTest {
  @Test
  fun `set should call passed setter`() {
    val mockedView = mockk<View>()
    var providedValue = -1
    var providedView: View? = null

    val prop = ConcreteViewProp<View, Int>("name", { typeOf<Int>() }.toAnyType<Int>()) { view, value ->
      providedValue = value
      providedView = view
    }

    prop.set(DynamicFromObject(10.0), mockedView)

    Truth.assertThat(providedValue).isEqualTo(10)
    Truth.assertThat(providedView).isSameInstanceAs(mockedView)
  }

  @Test
  fun `should be able to convert records`() {
    class MyRecord : Record {
      @Field
      lateinit var id: String

      @Field
      lateinit var name: String
    }

    val mockedView = mockk<View>()
    var providedValue: MyRecord? = null

    val prop = ConcreteViewProp<View, MyRecord>("name", { typeOf<MyRecord>() }.toAnyType<MyRecord>()) { _, value ->
      providedValue = value
    }

    prop.set(
      DynamicFromObject(
        JavaOnlyMap().apply {
          putString("id", "1234")
          putString("name", "name")
        }
      ),
      mockedView
    )

    Truth.assertThat(providedValue?.id).isEqualTo("1234")
    Truth.assertThat(providedValue?.name).isEqualTo("name")
  }
}
