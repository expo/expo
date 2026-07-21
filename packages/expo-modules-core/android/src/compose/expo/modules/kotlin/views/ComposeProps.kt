package expo.modules.kotlin.views

import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.recycle
import expo.modules.kotlin.types.ConverterContext

/**
 * A marker interface for props classes that are used to pass data to Compose views.
 * Needed for the R8 to not remove needed  signatures that are used to receive prop types.
 */
interface ComposeProps

inline fun <reified Props : ComposeProps> createComposeProps(
  propsMap: ReadableMap?,
  converterContext: ConverterContext
): Props {
  val propsParsingStrategy = toPropsParsingStrategy<Props>()
  var propsInstance = propsParsingStrategy.createNewInstance()

  if (propsMap == null) {
    return propsInstance
  }

  val props = propsParsingStrategy.props()
  val iterator = propsMap.keySetIterator()

  while (iterator.hasNextKey()) {
    val name = iterator.nextKey()
    val prop = props[name] ?: continue

    propsMap.getDynamic(name).recycle {
      propsInstance = (
        prop.copyPropsWithNewValue(
          prop = this,
          currentProps = propsInstance,
          converterContext = converterContext
        ) ?: propsInstance
        ) as Props
    }
  }

  return propsInstance
}
