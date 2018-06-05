package host.exp.exponent;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.junit.MockitoJUnit;
import org.mockito.junit.MockitoRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import static org.junit.Assert.assertTrue;

@RunWith(RobolectricTestRunner.class)
@Config(manifest = Config.NONE)
public class BasicUnitTest {

  @Rule
  public MockitoRule rule = MockitoJUnit.rule();

  @Test
  public void basicTest() {
    assertTrue(1 == 1);
  }
}