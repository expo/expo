# Compiling 'stripeview'

To compile the tipsi-stripe local maven, there are several steps you need to take.

First, make sure that you are in the exponent/android/stripeview folder, and make sure that you have gradle installed (if not, use homebrew via `brew install gradle` to install gradle onto your system.').

Next, make sure to set up the build.gradle correctly. An example is below:

```java

apply plugin: 'maven'

group = 'com.mygroup'
version = '1.0'

uploadArchives {
    repositories {
        mavenDeployer {
            repository(url: "file://[your local maven path here]")
        }
    }
}
```

Finally, run `gradle uploadArchives` in the project folder. This will allow you to import tipsi-stripe via dependencies in the expoview project gradle.'
