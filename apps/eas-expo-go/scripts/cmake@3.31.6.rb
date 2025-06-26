class CmakeAT3316 < Formula
  desc "Cross-platform make"
  homepage "https://www.cmake.org/"
  url "https://github.com/Kitware/CMake/releases/download/v3.31.6/cmake-3.31.6.tar.gz"
  mirror "http://fresh-center.net/linux/misc/cmake-3.31.6.tar.gz"
  mirror "http://fresh-center.net/linux/misc/legacy/cmake-3.31.6.tar.gz"
  sha256 "653427f0f5014750aafff22727fb2aa60c6c732ca91808cfb78ce22ddd9e55f0"
  license "BSD-3-Clause"
  head "https://gitlab.kitware.com/cmake/cmake.git", branch: "master"

  # The "latest" release on GitHub has been an unstable version before, and
  # there have been delays between the creation of a tag and the corresponding
  # release, so we check the website's downloads page instead.
  livecheck do
    url "https://cmake.org/download/"
    regex(/href=.*?cmake[._-]v?(\d+(?:\.\d+)+)\.t/i)
  end

  uses_from_macos "ncurses"

  on_linux do
    depends_on "openssl@3"
  end

  # Prevent the formula from breaking on version/revision bumps.
  # Check if possible to remove in 3.32.0
  # https://gitlab.kitware.com/cmake/cmake/-/merge_requests/9978
  patch :DATA

  # The completions were removed because of problems with system bash

  # The `with-qt` GUI option was removed due to circular dependencies if
  # CMake is built with Qt support and Qt is built with MySQL support as MySQL uses CMake.
  # For the GUI application please instead use `brew install --cask cmake`.

  def install
    args = %W[
      --prefix=#{prefix}
      --no-system-libs
      --parallel=#{ENV.make_jobs}
      --datadir=/share/cmake
      --docdir=/share/doc/cmake
      --mandir=/share/man
    ]
    if OS.mac?
      args += %w[
        --system-zlib
        --system-bzip2
        --system-curl
      ]
    end

    system "./bootstrap", *args, "--", *std_cmake_args,
                                       "-DCMake_INSTALL_BASH_COMP_DIR=#{bash_completion}",
                                       "-DCMake_INSTALL_EMACS_DIR=#{elisp}",
                                       "-DCMake_BUILD_LTO=ON"
    system "make"
    system "make", "install"
  end

  def caveats
    <<~EOS
      To install the CMake documentation, run:
        brew install cmake-docs
    EOS
  end

  test do
    (testpath/"CMakeLists.txt").write("find_package(Ruby)")
    system bin/"cmake", "."

    # These should be supplied in a separate cmake-docs formula.
    refute_path_exists doc/"html"
    refute_path_exists man
  end
end

__END__
diff --git a/Source/cmSystemTools.cxx b/Source/cmSystemTools.cxx
index 5ad0439c..161257cf 100644
--- a/Source/cmSystemTools.cxx
+++ b/Source/cmSystemTools.cxx
@@ -2551,7 +2551,7 @@ void cmSystemTools::FindCMakeResources(const char* argv0)
     _NSGetExecutablePath(exe_path, &exe_path_size);
   }
   exe_dir =
-    cmSystemTools::GetFilenamePath(cmSystemTools::GetRealPath(exe_path));
+    cmSystemTools::GetFilenamePath(exe_path);
   if (exe_path != exe_path_local) {
     free(exe_path);
   }
@@ -2572,7 +2572,6 @@ void cmSystemTools::FindCMakeResources(const char* argv0)
   std::string exe;
   if (cmSystemTools::FindProgramPath(argv0, exe, errorMsg)) {
     // remove symlinks
-    exe = cmSystemTools::GetRealPath(exe);
     exe_dir = cmSystemTools::GetFilenamePath(exe);
   } else {
     // ???
