package expo.modules.barcodescanner.utils

inline fun MutableList<Int>.mapX(block: (it: Int) -> Int) {
  for (it in 0 until this.size step 2) {
    this[it] = block(it)
  }
}

inline fun MutableList<Int>.mapY(block: (it: Int) -> Int) {
  for (it in 1 until this.size step 2) {
    this[it] = block(it)
  }
}
