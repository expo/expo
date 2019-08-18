import os

ndkPath = '/Users/nikki/Library/Android/sdk/ndk-bundle'
basePath = os.path.dirname(os.path.realpath(__file__))

def FlagsForFile(filename, **kwargs):
  return {
    'flags': [
      '-std=c++14',
      '-DFOLLY_NO_CONFIG=1',
      '-DFOLLY_USE_LIBCPP',
      '-I' + basePath + '/ReactAndroid/src/main/jni/first-party/jni-hack/real',
      '-I' + basePath + '/ReactAndroid/src/main/jni/react/jni',
      '-I' + basePath + '/ReactAndroid/../ReactCommon/cxxreact/..',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/folly',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/jsc',
      '-I' + basePath + '/ReactAndroid/src/main/jni/first-party/fbgloginit',
      '-I' + basePath + '/ReactAndroid/../ReactCommon/privatedata/..',
      '-I' + basePath + '/ReactAndroid/../ReactCommon/jschelpers/..',
      '-I' + basePath + '/ReactAndroid/src/main/jni/first-party/fb/include',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/glog/..',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/glog/glog-0.3.3/src/',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/boost/boost_1_63_0',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/double-conversion',
      '-I' + basePath + '/ReactAndroid/../ReactCommon/yoga',
      '-idirafter' + ndkPath + '/platforms/android-21/arch-x86_64/usr/include',
      '-Doff64_t=off_t',
    ],
  }

