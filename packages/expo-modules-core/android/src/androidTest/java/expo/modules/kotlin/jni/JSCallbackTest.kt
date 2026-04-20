package expo.modules.kotlin.jni

import com.google.common.truth.Truth
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import org.junit.Test

class JSCallbackTest {

  class UserRecord : Record {
    @Field
    var name: String = ""

    @Field
    var age: Int = 0
  }

  enum class Status(val value: String) : Enumerable {
    ACTIVE("active"),
    INACTIVE("inactive")
  }

  @Test
  fun callback_should_be_accepted_as_sync_function_arg() = withSingleModule({
    Function("callWithInt") { callback: JSCallback ->
      callback(42)
    }
  }) {
    call("callWithInt", "(value) => { globalThis.__testValue = value }")
    val value = jsiInterop.evaluateScript("globalThis.__testValue")
    Truth.assertThat(value.getInt()).isEqualTo(42)
  }

  @Test
  fun callback_with_string_argument() = withSingleModule({
    Function("callWithString") { callback: JSCallback ->
      callback("hello from native")
    }
  }) {
    call("callWithString", "(value) => { globalThis.__testStr = value }")
    val value = jsiInterop.evaluateScript("globalThis.__testStr")
    Truth.assertThat(value.getString()).isEqualTo("hello from native")
  }

  @Test
  fun callback_with_double_argument() = withSingleModule({
    Function("callWithDouble") { callback: JSCallback ->
      callback(3.14)
    }
  }) {
    call("callWithDouble", "(value) => { globalThis.__testDbl = value }")
    val value = jsiInterop.evaluateScript("globalThis.__testDbl")
    Truth.assertThat(value.getDouble()).isEqualTo(3.14)
  }

  @Test
  fun callback_with_boolean_argument() = withSingleModule({
    Function("callWithBool") { callback: JSCallback ->
      callback(true)
    }
  }) {
    call("callWithBool", "(value) => { globalThis.__testBool = value }")
    val value = jsiInterop.evaluateScript("globalThis.__testBool")
    Truth.assertThat(value.getBool()).isTrue()
  }

  @Test
  fun callback_with_map_argument() = withSingleModule({
    Function("callWithMap") { callback: JSCallback ->
      callback(mapOf("name" to "expo", "version" to 56))
    }
  }) {
    call("callWithMap", "(value) => { globalThis.__testMap = value }")
    val nameValue = jsiInterop.evaluateScript("globalThis.__testMap.name")
    val versionValue = jsiInterop.evaluateScript("globalThis.__testMap.version")
    Truth.assertThat(nameValue.getString()).isEqualTo("expo")
    Truth.assertThat(versionValue.getInt()).isEqualTo(56)
  }

  @Test
  fun callback_with_no_arguments() = withSingleModule({
    Function("callNoArgs") { callback: JSCallback ->
      callback()
    }
  }) {
    call("callNoArgs", "() => { globalThis.__testNoArgs = true }")
    val value = jsiInterop.evaluateScript("globalThis.__testNoArgs")
    Truth.assertThat(value.getBool()).isTrue()
  }

  @Test
  fun callback_can_be_called_multiple_times() = withSingleModule({
    Function("callMultiple") { callback: JSCallback ->
      callback(1)
      callback(2)
      callback(3)
    }
  }) {
    call(
      "callMultiple",
      """(value) => {
      if (!globalThis.__testMulti) globalThis.__testMulti = [];
      globalThis.__testMulti.push(value);
    }"""
    )
    val length = jsiInterop.evaluateScript("globalThis.__testMulti.length")
    Truth.assertThat(length.getInt()).isEqualTo(3)

    val first = jsiInterop.evaluateScript("globalThis.__testMulti[0]")
    val second = jsiInterop.evaluateScript("globalThis.__testMulti[1]")
    val third = jsiInterop.evaluateScript("globalThis.__testMulti[2]")
    Truth.assertThat(first.getInt()).isEqualTo(1)
    Truth.assertThat(second.getInt()).isEqualTo(2)
    Truth.assertThat(third.getInt()).isEqualTo(3)
  }

  @Test
  fun callback_in_async_function() = withSingleModule({
    AsyncFunction("asyncWithCallback") { callback: JSCallback ->
      callback("async result")
    }
  }) {
    callAsync("asyncWithCallback", "(value) => { globalThis.__testAsync = value }")
    val value = jsiInterop.evaluateScript("globalThis.__testAsync")
    Truth.assertThat(value.getString()).isEqualTo("async result")
  }

  @Test
  fun callback_alongside_other_args() = withSingleModule({
    Function("withArgs") { prefix: String, callback: JSCallback ->
      callback("$prefix world")
    }
  }) {
    call("withArgs", "'hello', (value) => { globalThis.__testArgs = value }")
    val value = jsiInterop.evaluateScript("globalThis.__testArgs")
    Truth.assertThat(value.getString()).isEqualTo("hello world")
  }

  @Test
  fun callback_with_record() = withSingleModule({
    Function("callWithRecord") { callback: JSCallback ->
      val user = UserRecord().apply {
        name = "John"
        age = 30
      }
      callback(user)
    }
  }) {
    call("callWithRecord", "(value) => { globalThis.__testRecord = value }")
    val name = jsiInterop.evaluateScript("globalThis.__testRecord.name")
    val age = jsiInterop.evaluateScript("globalThis.__testRecord.age")
    Truth.assertThat(name.getString()).isEqualTo("John")
    Truth.assertThat(age.getInt()).isEqualTo(30)
  }

  @Test
  fun callback_with_enum() = withSingleModule({
    Function("callWithEnum") { callback: JSCallback ->
      callback(Status.ACTIVE)
    }
  }) {
    call("callWithEnum", "(value) => { globalThis.__testEnum = value }")
    val value = jsiInterop.evaluateScript("globalThis.__testEnum")
    Truth.assertThat(value.getString()).isEqualTo("active")
  }

  @Test
  fun callback_with_array_of_records() = withSingleModule({
    Function("callWithRecords") { callback: JSCallback ->
      val users = listOf(
        UserRecord().apply {
          name = "Alice"
          age = 25
        },
        UserRecord().apply {
          name = "Bob"
          age = 35
        }
      )
      callback(users)
    }
  }) {
    call("callWithRecords", "(value) => { globalThis.__testRecords = value }")
    val length = jsiInterop.evaluateScript("globalThis.__testRecords.length")
    Truth.assertThat(length.getInt()).isEqualTo(2)

    val firstName = jsiInterop.evaluateScript("globalThis.__testRecords[0].name")
    val secondName = jsiInterop.evaluateScript("globalThis.__testRecords[1].name")
    Truth.assertThat(firstName.getString()).isEqualTo("Alice")
    Truth.assertThat(secondName.getString()).isEqualTo("Bob")
  }
}
