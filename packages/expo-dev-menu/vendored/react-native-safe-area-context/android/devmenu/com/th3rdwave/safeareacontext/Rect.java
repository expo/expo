package devmenu.com.th3rdwave.safeareacontext;

/* package */ class Rect {
  float x;
  float y;
  float width;
  float height;

  Rect(float x, float y, float width, float height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  boolean equalsToRect(Rect other) {
    if (this == other) {
      return true;
    }
    return this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height;
  }
}