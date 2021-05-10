package expo.modules.notifications.service.delegates

import android.util.Base64
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InvalidClassException
import java.io.ObjectInputStream
import java.io.ObjectOutputStream
import java.io.Serializable

@Throws(IOException::class)
fun Serializable.encodedInBase64(): String =
  ByteArrayOutputStream().use { byteArrayOutputStream ->
    ObjectOutputStream(byteArrayOutputStream).use { objectOutputStream ->
      objectOutputStream.writeObject(this)
      Base64.encodeToString(byteArrayOutputStream.toByteArray(), Base64.NO_WRAP)
    }
  }

@Throws(IOException::class, ClassNotFoundException::class, InvalidClassException::class)
inline fun <reified T> String.asBase64EncodedObject(): T =
  ByteArrayInputStream(
    Base64.decode(this, Base64.NO_WRAP)
  ).use { byteArrayInputStream ->
    ObjectInputStream(byteArrayInputStream).use { ois ->
      val o = ois.readObject()
      if (o is T) {
        return o
      }
      throw InvalidClassException("Expected serialized object to be an instance of ${T::class.java}. Found: $o")
    }
  }
