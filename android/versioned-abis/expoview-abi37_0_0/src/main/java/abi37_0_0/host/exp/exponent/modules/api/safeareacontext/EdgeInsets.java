package abi37_0_0.host.exp.exponent.modules.api.safeareacontext;

/* package */ class EdgeInsets {
  public float top;
  public float right;
  public float bottom;
  public float left;

  public EdgeInsets(float top, float right, float bottom, float left) {
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
  }

  public boolean equalsToEdgeInsets(EdgeInsets other) {
    if (this == other) {
      return true;
    }
    return this.top == other.top && this.right == other.right && this.bottom == other.bottom && this.left == other.left;
  }
}
