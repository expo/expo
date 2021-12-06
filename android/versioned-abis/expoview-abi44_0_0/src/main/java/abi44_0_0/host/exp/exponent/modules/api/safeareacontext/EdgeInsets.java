package abi44_0_0.host.exp.exponent.modules.api.safeareacontext;

/* package */ class EdgeInsets {
  float top;
  float right;
  float bottom;
  float left;

  EdgeInsets(float top, float right, float bottom, float left) {
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
  }

  boolean equalsToEdgeInsets(EdgeInsets other) {
    if (this == other) {
      return true;
    }
    return this.top == other.top && this.right == other.right && this.bottom == other.bottom && this.left == other.left;
  }
}