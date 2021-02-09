Nanopb - Protocol Buffers for Embedded Systems
==============================================

[![Build Status](https://travis-ci.org/nanopb/nanopb.svg?branch=master)](https://travis-ci.org/nanopb/nanopb)

Nanopb is a small code-size Protocol Buffers implementation in ansi C. It is
especially suitable for use in microcontrollers, but fits any memory
restricted system.

* **Homepage:** https://jpa.kapsi.fi/nanopb/
* **Documentation:** https://jpa.kapsi.fi/nanopb/docs/
* **Downloads:** https://jpa.kapsi.fi/nanopb/download/
* **Forum:** https://groups.google.com/forum/#!forum/nanopb



Using the nanopb library
------------------------
To use the nanopb library, you need to do two things:

1. Compile your .proto files for nanopb, using protoc.
2. Include pb_encode.c, pb_decode.c and pb_common.c in your project.

The easiest way to get started is to study the project in "examples/simple".
It contains a Makefile, which should work directly under most Linux systems.
However, for any other kind of build system, see the manual steps in
README.txt in that folder.



Using the Protocol Buffers compiler (protoc)
--------------------------------------------
The nanopb generator is implemented as a plugin for the Google's own protoc
compiler. This has the advantage that there is no need to reimplement the
basic parsing of .proto files. However, it does mean that you need the
Google's protobuf library in order to run the generator.

If you have downloaded a binary package for nanopb (either Windows, Linux or
Mac OS X version), the 'protoc' binary is included in the 'generator-bin'
folder. In this case, you are ready to go. Simply run this command:

    generator-bin/protoc --nanopb_out=. myprotocol.proto

However, if you are using a git checkout or a plain source distribution, you
need to provide your own version of protoc and the Google's protobuf library.
On Linux, the necessary packages are protobuf-compiler and python-protobuf.
On Windows, you can either build Google's protobuf library from source or use
one of the binary distributions of it. In either case, if you use a separate
protoc, you need to manually give the path to nanopb generator:

    protoc --plugin=protoc-gen-nanopb=nanopb/generator/protoc-gen-nanopb ...



Running the tests
-----------------
If you want to perform further development of the nanopb core, or to verify
its functionality using your compiler and platform, you'll want to run the
test suite. The build rules for the test suite are implemented using Scons,
so you need to have that installed. To run the tests:

    cd tests
    scons

This will show the progress of various test cases. If the output does not
end in an error, the test cases were successful.

Note: Mac OS X by default aliases 'clang' as 'gcc', while not actually
supporting the same command line options as gcc does. To run tests on
Mac OS X, use: "scons CC=clang CXX=clang". Same way can be used to run
tests with different compilers on any platform.
