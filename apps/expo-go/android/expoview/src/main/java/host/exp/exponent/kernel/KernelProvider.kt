// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

object KernelProvider {
  private var factory: KernelFactory = object : KernelFactory {
    override fun create(): KernelInterface {
      return ExpoViewKernel.instance
    }
  }

  @JvmStatic fun setFactory(factory: KernelFactory) {
    this.factory = factory
  }

  @JvmStatic val instance: KernelInterface by lazy {
    factory.create()
  }

  interface KernelFactory {
    fun create(): KernelInterface
  }
}
