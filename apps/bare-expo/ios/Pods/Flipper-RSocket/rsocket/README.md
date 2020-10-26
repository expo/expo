# rsocket-cpp

C++ implementation of [RSocket](https://rsocket.io)

<a href='https://travis-ci.org/rsocket/rsocket-cpp/builds'><img src='https://travis-ci.org/rsocket/rsocket-cpp.svg?branch=master'></a>
[![Coverage Status](https://coveralls.io/repos/github/rsocket/rsocket-cpp/badge.svg?branch=master)](https://coveralls.io/github/rsocket/rsocket-cpp?branch=master)

# Dependencies

Install `folly`:

```
brew install folly
```

# Building and running tests

After installing dependencies as above, you can build and run tests with:

```
# inside root ./rsocket-cpp
mkdir -p build
cd build
cmake -DCMAKE_BUILD_TYPE=DEBUG ../
make -j
./tests
```
