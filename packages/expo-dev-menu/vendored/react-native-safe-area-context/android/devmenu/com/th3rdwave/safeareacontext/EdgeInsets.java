package devmenu.com.th3rdwave.safeareacontext;

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