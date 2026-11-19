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

  @Test
  fun `given a private name, when lengthAfterPrefix, then counts what follows the prefix`() {
    Assert.assertEquals(7, ExtendedPropertyName.lengthAfterPrefix("private:x-owner"))
  }

  @Test
  fun `given a shared name, when lengthAfterPrefix, then counts what follows the prefix`() {
    Assert.assertEquals(7, ExtendedPropertyName.lengthAfterPrefix("shared:x-owner"))
  }

  @Test
  fun `given an unprefixed name, when lengthAfterPrefix, then counts the whole name`() {
    // The two prefixes have different lengths, so a name carrying neither cannot borrow either.
    Assert.assertEquals(7, ExtendedPropertyName.lengthAfterPrefix("x-owner"))
  }
}
