import path from 'path';

const fs = jest.requireActual('fs') as typeof import('fs');
const template = path.join(__dirname, '../../../../../../../templates/expo-template-bare-minimum/');

export function readAllFiles(): {
  'ios/HelloWorld/AppDelegate.mm': string;
  'ios/Podfile': string;
  'ios/HelloWorld.xcodeproj/project.pbxproj': string;
  'ios/HelloWorld/Info.plist': string;
  'ios/HelloWorld/Supporting/Expo.plist': string;
  'android/app/src/main/AndroidManifest.xml': string;
  'android/app/src/main/java/com/helloworld/MainActivity.java': string;
  'android/app/src/main/java/com/helloworld/MainApplication.java': string;
  'android/app/build.gradle': string;
  'android/build.gradle': string;
  'android/settings.gradle': string;
} & Record<string, string> {
  const files: Record<string, string | Buffer> = {
    // This file is generated and therefore not available in the template.
    '/android/app/src/main/jni/MainApplicationTurboModuleManagerDelegate.h': `\
      #include <memory>
      #include <string>
    
      #include <ReactCommon/TurboModuleManagerDelegate.h>
      #include <fbjni/fbjni.h>
    
      namespace facebook {
      namespace react {
    
      class MainApplicationTurboModuleManagerDelegate
          : public jni::HybridClass<
                MainApplicationTurboModuleManagerDelegate,
                TurboModuleManagerDelegate> {
       public:
        // Adapt it to the package you used for your Java class.
        static constexpr auto kJavaDescriptor =
            "Lcom/helloworld/newarchitecture/modules/MainApplicationTurboModuleManagerDelegate;";
    
        static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject>);
    
        static void registerNatives();
    
        std::shared_ptr<TurboModule> getTurboModule(
            const std::string name,
            const std::shared_ptr<CallInvoker> jsInvoker) override;
        std::shared_ptr<TurboModule> getTurboModule(
            const std::string name,
            const JavaTurboModule::InitParams &params) override;
    
        /**
         * Test-only method. Allows user to verify whether a TurboModule can be
         * created by instances of this class.
         */
        bool canCreateTurboModule(std::string name);
      };
    
      } // namespace react
      } // namespace facebook
    `,
  };

  function readFile(file: string) {
    const p = path.join(template, file);
    if (fs.statSync(p).isDirectory()) {
      fs.readdirSync(p).forEach((f) => {
        readFile(`${file}/${f}`);
      });
    } else {
      if (file.match(/\.(png)$/)) {
        const contents = fs.readFileSync(p);
        files[file] = contents;
      } else {
        const contents = fs.readFileSync(p, 'utf-8');
        files[file] = contents;
      }
    }
  }

  fs.readdirSync(path.join(template, 'ios')).forEach((file) => {
    readFile(`ios/${file}`);
  });
  fs.readdirSync(path.join(template, 'android')).forEach((file) => {
    readFile(`android/${file}`);
  });

  return files as any;
}

export default readAllFiles();
