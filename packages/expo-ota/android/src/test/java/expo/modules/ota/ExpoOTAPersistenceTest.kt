package expo.modules.ota

import io.mockk.MockKAnnotations
import io.mockk.confirmVerified
import io.mockk.impl.annotations.MockK
import io.mockk.verify

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class ExpoOTAPersistenceTest {

    @MockK
    lateinit var storage: KeyValueStorage

    @BeforeEach
    fun setUp() = MockKAnnotations.init(this)

    @Test
    fun testTests() {
        assert(true)
        verify { storage.readString("") }
        confirmVerified(storage)
    }

    @Test
    fun secondTests() {
        assert(false)
    }

}