package expo.modules.plugin

import javax.inject.Inject
import org.gradle.api.Named
import org.gradle.api.NamedDomainObjectContainer
import org.gradle.api.model.ObjectFactory
import org.gradle.api.provider.Property

abstract class PublicationConfig @Inject constructor(name: String, objects: ObjectFactory) : Named {
  private val _name: String = name

  override fun getName(): String = _name

  abstract val type: Property<String>
  abstract val url: Property<String>
  abstract val username: Property<String>
  abstract val password: Property<String>
  abstract val allowInsecure: Property<Boolean>

  init {
    url.convention("")
    username.convention("")
    password.convention("")
    allowInsecure.convention(false)
  }
}

abstract class ExpoPublishExtension @Inject constructor(objects: ObjectFactory) {
  abstract var libraryName: Property<String>
  abstract var publications: NamedDomainObjectContainer<PublicationConfig>

  init {
    libraryName = objects.property(String::class.java)
    libraryName.convention("")
    publications =
        objects.domainObjectContainer(PublicationConfig::class.java) { name ->
          objects.newInstance(PublicationConfig::class.java, name, objects)
        }
  }
}
