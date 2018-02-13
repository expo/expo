import os

basePath = os.path.dirname(os.path.realpath(__file__))

def FlagsForFile(filename, **kwargs):
  return {
    'flags': [
      '-std=c++11',
      '-DFOLLY_NO_CONFIG=1',
      '-DFOLLY_USE_LIBCPP',
      '-I' + basePath + '/ReactAndroid/../ReactCommon/cxxreact/..',
      '-I' + basePath + '/ReactAndroid/../ReactCommon/jschelpers/..',
      '-I' + basePath + '/ReactAndroid/src/main/jni/first-party/fb/include',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/folly',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/jsc',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/glog/..',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/glog/glog-0.3.3/src/',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/boost/boost_1_63_0',
      '-I' + basePath + '/ReactAndroid/build/third-party-ndk/double-conversion',
      '-I' + basePath + '/ReactAndroid/../ReactCommon/cxxreact',
    ],
  }

