package expo.modules.calendar.next.domain.model.extendedproperty

import org.junit.Assert
import org.junit.Test

class ExtendedPropertyNameTest {
  @Test
  fun `given a private name, when isSyncSafe, then returns true`() {
    Assert.assertTrue(ExtendedPropertyName.isSyncSafe("private:x-owner"))
  }

  @Test
  fun `given a shared name, when isSyncSafe, then returns true`() {
    Assert.assertTrue(ExtendedPropertyName.isSyncSafe("shared:x-owner"))
  }

  @Test
  fun `given an unprefixed name, when isSyncSafe, then returns false`() {
    // A name a sync adapter drops on the next sync, without reporting an error.
    Assert.assertFalse(ExtendedPropertyName.isSyncSafe("x-owner"))
  }

  @Test
  fun `given a name with an unrelated prefix, when isSyncSafe, then returns false`() {
    Assert.assertFalse(ExtendedPropertyName.isSyncSafe("public:x-owner"))
  }

  @Test
  fun `given a name where the prefix is not at the start, when isSyncSafe, then returns false`() {
    Assert.assertFalse(ExtendedPropertyName.isSyncSafe("x-private:owner"))
  }
}
