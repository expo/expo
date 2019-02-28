package host.exp.exponent;

import org.junit.Test;

public class ABIVersionTest {
  @Test
  public void unversionedIsBiggerThanSdk32() {
    assert (ABIVersion.toNumber("UNVERSIONED") > ABIVersion.toNumber("32.0.0"));
  }

  @Test
  public void majorUpdateIsBiggerThanNone() {
    assert (ABIVersion.toNumber("32.0.0") > ABIVersion.toNumber("31.0.0"));
  }

  @Test
  public void minorUpdateIsBiggerThanNone() {
    assert (ABIVersion.toNumber("32.1.0") > ABIVersion.toNumber("32.0.0"));
  }

  @Test
  public void patchUpdateIsBiggerThanNone() {
    assert (ABIVersion.toNumber("32.0.1") > ABIVersion.toNumber("32.0.0"));
  }

  @Test
  public void sameVersionsAreEqual() {
    assert (ABIVersion.toNumber("32.0.0") == ABIVersion.toNumber("32.0.0"));
  }

  @Test
  public void minorUpdateIsBiggerThanPatchUpdate() {
    assert (ABIVersion.toNumber("32.1.0") > ABIVersion.toNumber("32.0.1"));
  }
}
