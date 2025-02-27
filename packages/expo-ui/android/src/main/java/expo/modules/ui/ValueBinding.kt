package expo.modules.ui

import androidx.lifecycle.MutableLiveData
import expo.modules.kotlin.sharedobjects.SharedObject


class ValueBinding<T>: SharedObject {
  var value: MutableLiveData<T>

  constructor(value: T) {
    this.value = MutableLiveData<T>(value)
  }
}