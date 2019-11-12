package expo.modules.ota

import io.mockk.MockKAnnotations
import io.mockk.impl.annotations.MockK
import junit.framework.TestCase
import org.junit.Test

class ExpoOTAPersistenceTestCase: TestCase() {

    @MockK
    lateinit var storage: KeyValueStorage

    override fun setUp() = MockKAnnotations.init(this)

    @Test
    fun testTests() {
        assert(true)
//        verify { storage.readString("") }
//        confirmVerified(storage)
    }

    @Test
    fun testSecond() {
        assert(true)
    }

}