package expo.modules.v2demo

import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Record
import io.github.expo.modules.v2.Module

@Record
data class Point(val x: Int, val y: Int)

@ExpoModule
object ExpoV2Demo : Module() {
  @JS
  fun add(a: Int, b: Int): Int = a + b

  @JS
  fun greet(name: String): String = "hello $name from Expo Modules v2"

  @JS
  fun translate(point: Point, dx: Int, dy: Int): Point = Point(point.x + dx, point.y + dy)
}
