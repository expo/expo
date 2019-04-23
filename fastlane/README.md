fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

Install _fastlane_ using
```
[sudo] gem install fastlane -NV
```
or alternatively using `brew cask install fastlane`

# Available Actions
## iOS
### ios test
```
fastlane ios test
```

### ios create_simulator_build
```
fastlane ios create_simulator_build
```

### ios create_expo_client_build
```
fastlane ios create_expo_client_build
```

### ios release
```
fastlane ios release
```


----

## Android
### android start
```
fastlane android start
```

### android devicefarm
```
fastlane android devicefarm
```

### android build
```
fastlane android build
```

### android prod_release
```
fastlane android prod_release
```


----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
