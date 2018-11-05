// Copyright 2014 Renato Tegon Forti, Antony Polukhin.
// Copyright 2015 Antony Polukhin.
//
// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt
// or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_DLL_DETAIL_POSIX_PROGRAM_LOCATION_IMPL_HPP
#define BOOST_DLL_DETAIL_POSIX_PROGRAM_LOCATION_IMPL_HPP

#include <boost/config.hpp>
#include <boost/dll/detail/system_error.hpp>
#include <boost/filesystem/path.hpp>
#include <boost/predef/os.h>

#ifdef BOOST_HAS_PRAGMA_ONCE
# pragma once
#endif

#if BOOST_OS_MACOS || BOOST_OS_IOS

#include <mach-o/dyld.h>

namespace boost { namespace dll { namespace detail {
    inline boost::filesystem::path program_location_impl(boost::system::error_code &ec) {
        ec.clear();

        char path[1024];
        uint32_t size = sizeof(path);
        if (_NSGetExecutablePath(path, &size) == 0)
            return boost::filesystem::path(path);
        
        char *p = new char[size];
        if (_NSGetExecutablePath(p, &size) != 0) {
            ec = boost::system::error_code(
                boost::system::errc::bad_file_descriptor,
                boost::system::generic_category()
            );
        }

        boost::filesystem::path ret(p);
        delete[] p;
        return ret;
    }
}}} // namespace boost::dll::detail

#elif BOOST_OS_SOLARIS

#include <stdlib.h>
namespace boost { namespace dll { namespace detail {
    inline boost::filesystem::path program_location_impl(boost::system::error_code& ec) {
        ec.clear();

        return boost::filesystem::path(getexecname());
    }
}}} // namespace boost::dll::detail

#elif BOOST_OS_BSD_FREE

#include <sys/types.h>
#include <sys/sysctl.h>
#include <stdlib.h>

namespace boost { namespace dll { namespace detail {
    inline boost::filesystem::path program_location_impl(boost::system::error_code& ec) {
        ec.clear();

        int mib[4];
        mib[0] = CTL_KERN;
        mib[1] = KERN_PROC;
        mib[2] = KERN_PROC_PATHNAME;
        mib[3] = -1;
        char buf[10240];
        size_t cb = sizeof(buf);
        sysctl(mib, 4, buf, &cb, NULL, 0);

        return boost::filesystem::path(buf);
    }
}}} // namespace boost::dll::detail



#elif BOOST_OS_BSD_NET

#include <boost/filesystem/operations.hpp>
namespace boost { namespace dll { namespace detail {
    inline boost::filesystem::path program_location_impl(boost::system::error_code &ec) {
        return boost::filesystem::read_symlink("/proc/curproc/exe", ec);
    }
}}} // namespace boost::dll::detail

#elif BOOST_OS_BSD_DRAGONFLY

#include <boost/filesystem/operations.hpp>
namespace boost { namespace dll { namespace detail {
    inline boost::filesystem::path program_location_impl(boost::system::error_code &ec) {
        return boost::filesystem::read_symlink("/proc/curproc/file", ec);
    }
}}} // namespace boost::dll::detail

#elif BOOST_OS_QNX

#include <fstream>
#include <string> // for std::getline
namespace boost { namespace dll { namespace detail {
    inline boost::filesystem::path program_location_impl(boost::system::error_code &ec) {
        ec.clear();

        std::string s;
        std::ifstream ifs("/proc/self/exefile");
        std::getline(ifs, s);

        if (ifs.fail() || s.empty()) {
            ec = boost::system::error_code(
                boost::system::errc::bad_file_descriptor,
                boost::system::generic_category()
            );
        }

        return boost::filesystem::path(s);
    }
}}} // namespace boost::dll::detail

#else  // BOOST_OS_LINUX || BOOST_OS_UNIX || BOOST_OS_HPUX || BOOST_OS_ANDROID

#include <boost/filesystem/operations.hpp>
namespace boost { namespace dll { namespace detail {
    inline boost::filesystem::path program_location_impl(boost::system::error_code &ec) {
        // We can not use
        // boost::dll::detail::path_from_handle(dlopen(NULL, RTLD_LAZY | RTLD_LOCAL), ignore);
        // because such code returns empty path.

        return boost::filesystem::read_symlink("/proc/self/exe", ec);   // Linux specific
    }
}}} // namespace boost::dll::detail

#endif

#endif // BOOST_DLL_DETAIL_POSIX_PROGRAM_LOCATION_IMPL_HPP

