// Copyright 2014 Renato Tegon Forti, Antony Polukhin.
// Copyright 2015-2016 Antony Polukhin.
//
// Distributed under the Boost Software License, Version 1.0.
// (See accompanying file LICENSE_1_0.txt
// or copy at http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_DLL_SHARED_LIBRARY_IMPL_HPP
#define BOOST_DLL_SHARED_LIBRARY_IMPL_HPP

#include <boost/config.hpp>
#include <boost/dll/shared_library_load_mode.hpp>
#include <boost/dll/detail/posix/path_from_handle.hpp>
#include <boost/dll/detail/posix/program_location_impl.hpp>

#include <boost/move/utility.hpp>
#include <boost/swap.hpp>
#include <boost/filesystem/path.hpp>
#include <boost/filesystem/operations.hpp>
#include <boost/predef/os.h>

#include <dlfcn.h>
#include <cstring> // strncmp
#if !BOOST_OS_MACOS && !BOOST_OS_IOS && !BOOST_OS_QNX
#   include <link.h>
#elif BOOST_OS_QNX
// QNX's copy of <elf.h> and <link.h> reside in sys folder
#   include <sys/link.h>
#endif

#ifdef BOOST_HAS_PRAGMA_ONCE
# pragma once
#endif

namespace boost { namespace dll { namespace detail {

class shared_library_impl {

    BOOST_MOVABLE_BUT_NOT_COPYABLE(shared_library_impl)

public:
    typedef void* native_handle_t;

    shared_library_impl() BOOST_NOEXCEPT
        : handle_(NULL)
    {}

    ~shared_library_impl() BOOST_NOEXCEPT {
        unload();
    }
    
    shared_library_impl(BOOST_RV_REF(shared_library_impl) sl) BOOST_NOEXCEPT
        : handle_(sl.handle_)
    {
        sl.handle_ = NULL;
    }

    shared_library_impl & operator=(BOOST_RV_REF(shared_library_impl) sl) BOOST_NOEXCEPT {
        swap(sl);
        return *this;
    }

    void load(boost::filesystem::path sl, load_mode::type mode, boost::system::error_code &ec) {
        typedef int native_mode_t;
        unload();

        // Do not allow opening NULL paths. User must use program_location() instead
        if (sl.empty()) {
            boost::dll::detail::reset_dlerror();
            ec = boost::system::error_code(
                boost::system::errc::bad_file_descriptor,
                boost::system::generic_category()
            );

            return;
        }

        // Fixing modes
        if (!(mode & load_mode::rtld_now)) {
            mode |= load_mode::rtld_lazy;
        }

        if (!(mode & load_mode::rtld_global)) {
            mode |= load_mode::rtld_local;
        }

#if BOOST_OS_LINUX || BOOST_OS_ANDROID
        if (!sl.has_parent_path() && !(mode & load_mode::search_system_folders)) {
            sl = "." / sl;
        }
#else
        if (!sl.is_absolute() && !(mode & load_mode::search_system_folders)) {
            boost::system::error_code current_path_ec;
            boost::filesystem::path prog_loc = boost::filesystem::current_path(current_path_ec);
            if (!current_path_ec) {
                prog_loc /= sl;
                sl.swap(prog_loc);
            }
        }
#endif

        mode &= ~load_mode::search_system_folders;

        // Trying to open with appended decorations
        if (!!(mode & load_mode::append_decorations)) {
            mode &= ~load_mode::append_decorations;

            boost::filesystem::path actual_path = (
                std::strncmp(sl.filename().string().c_str(), "lib", 3)
                ? (sl.has_parent_path() ? sl.parent_path() / L"lib" : L"lib").native() + sl.filename().native()
                : sl
            );
            actual_path += suffix();

            handle_ = dlopen(actual_path.c_str(), static_cast<native_mode_t>(mode));
            if (handle_) {
                boost::dll::detail::reset_dlerror();
                return;
            }
        }

        // Opening by exactly specified path
        handle_ = dlopen(sl.c_str(), static_cast<native_mode_t>(mode));
        if (handle_) {
            boost::dll::detail::reset_dlerror();
            return;
        }

        ec = boost::system::error_code(
            boost::system::errc::bad_file_descriptor,
            boost::system::generic_category()
        );

        // Maybe user wanted to load the executable itself? Checking...
        // We assume that usually user wants to load a dynamic library not the executable itself, that's why
        // we try this only after traditional load fails.
        boost::system::error_code prog_loc_err;
        boost::filesystem::path loc = boost::dll::detail::program_location_impl(prog_loc_err);
        if (!prog_loc_err && boost::filesystem::equivalent(sl, loc, prog_loc_err) && !prog_loc_err) {
            // As is known the function dlopen() loads the dynamic library file 
            // named by the null-terminated string filename and returns an opaque 
            // "handle" for the dynamic library. If filename is NULL, then the 
            // returned handle is for the main program.
            ec.clear();
            boost::dll::detail::reset_dlerror();
            handle_ = dlopen(NULL, static_cast<native_mode_t>(mode));
            if (!handle_) {
                ec = boost::system::error_code(
                    boost::system::errc::bad_file_descriptor,
                    boost::system::generic_category()
                );
            }
        }
    }

    bool is_loaded() const BOOST_NOEXCEPT {
        return (handle_ != 0);
    }

    void unload() BOOST_NOEXCEPT {
        if (!is_loaded()) {
            return;
        }

        dlclose(handle_);
        handle_ = 0;
    }

    void swap(shared_library_impl& rhs) BOOST_NOEXCEPT {
        boost::swap(handle_, rhs.handle_);
    }

    boost::filesystem::path full_module_path(boost::system::error_code &ec) const {
        return boost::dll::detail::path_from_handle(handle_, ec);
    }

    static boost::filesystem::path suffix() {
        // https://sourceforge.net/p/predef/wiki/OperatingSystems/
#if BOOST_OS_MACOS || BOOST_OS_IOS
        return ".dylib";
#else
        return ".so";
#endif
    }

    void* symbol_addr(const char* sb, boost::system::error_code &ec) const BOOST_NOEXCEPT {
        // dlsym - obtain the address of a symbol from a dlopen object
        void* const symbol = dlsym(handle_, sb);
        if (symbol == NULL) {
            ec = boost::system::error_code(
                boost::system::errc::invalid_seek,
                boost::system::generic_category()
            );
        }

        // If handle does not refer to a valid object opened by dlopen(),
        // or if the named symbol cannot be found within any of the objects
        // associated with handle, dlsym() shall return NULL.
        // More detailed diagnostic information shall be available through dlerror().

        return symbol;
    }

    native_handle_t native() const BOOST_NOEXCEPT {
        return handle_;
    }

private:
    native_handle_t         handle_;
};

}}} // boost::dll::detail

#endif // BOOST_DLL_SHARED_LIBRARY_IMPL_HPP

