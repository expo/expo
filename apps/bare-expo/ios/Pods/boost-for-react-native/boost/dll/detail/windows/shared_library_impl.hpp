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
#include <boost/dll/detail/aggressive_ptr_cast.hpp>
#include <boost/dll/detail/system_error.hpp>
#include <boost/dll/detail/windows/path_from_handle.hpp>

#include <boost/move/utility.hpp>
#include <boost/swap.hpp>
#include <boost/filesystem/path.hpp>
#include <boost/filesystem/operations.hpp>

#include <boost/detail/winapi/dll.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
# pragma once
#endif

namespace boost { namespace dll { namespace detail {

class shared_library_impl {
    BOOST_MOVABLE_BUT_NOT_COPYABLE(shared_library_impl)

public:
    typedef boost::detail::winapi::HMODULE_ native_handle_t;

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
        typedef boost::detail::winapi::DWORD_ native_mode_t;
        unload();

        if (!sl.is_absolute() && !(mode & load_mode::search_system_folders)) {

            boost::system::error_code current_path_ec;
            boost::filesystem::path prog_loc = boost::filesystem::current_path(current_path_ec);
            if (!current_path_ec) {
                prog_loc /= sl;
                sl.swap(prog_loc);
            }
        }
        mode &= ~load_mode::search_system_folders;

        // Trying to open with appended decorations
        if (!!(mode & load_mode::append_decorations)) {
            mode &= ~load_mode::append_decorations;

            handle_ = boost::detail::winapi::LoadLibraryExW((sl.native() + L".dll").c_str(), 0, static_cast<native_mode_t>(mode));
            if (!handle_) {
                // MinGW loves 'lib' prefix and puts it even on Windows platform
                const boost::filesystem::path load_path = (sl.has_parent_path() ? sl.parent_path() / L"lib" : L"lib").native() + sl.filename().native() + L".dll";
                handle_ = boost::detail::winapi::LoadLibraryExW(
                    load_path.c_str(),
                    0,
                    static_cast<native_mode_t>(mode)
                );
            }

            if (handle_) {
                return;
            }
        }

        // From MSDN: If the string specifies a module name without a path and the
        // file name extension is omitted, the function appends the default library
        // extension .dll to the module name.
        //
        // From experiments: Default library extension appended to the module name even if
        // we have some path. So we do not check for path, only for extension. We can not be sure that
        // such behavior remain across all platforms, so we add L"." by hand.
        if (sl.has_extension()) {
            handle_ = boost::detail::winapi::LoadLibraryExW(sl.c_str(), 0, static_cast<native_mode_t>(mode));
        } else {
            handle_ = boost::detail::winapi::LoadLibraryExW((sl.native() + L".").c_str(), 0, static_cast<native_mode_t>(mode));
        }

        // LoadLibraryExW method is capable of self loading from program_location() path. No special actions
        // must be taken to allow self loading.

        if (!handle_) {
            ec = boost::dll::detail::last_error_code();
        }
    }

    bool is_loaded() const BOOST_NOEXCEPT {
        return (handle_ != 0);
    }

    void unload() BOOST_NOEXCEPT {
        if (handle_) {
            boost::detail::winapi::FreeLibrary(handle_);
            handle_ = 0;
        }
    }

    void swap(shared_library_impl& rhs) BOOST_NOEXCEPT {
        boost::swap(handle_, rhs.handle_);
    }

    boost::filesystem::path full_module_path(boost::system::error_code &ec) const {
        return boost::dll::detail::path_from_handle(handle_, ec);
    }

    static boost::filesystem::path suffix() {
        return L".dll";
    }

    void* symbol_addr(const char* sb, boost::system::error_code &ec) const BOOST_NOEXCEPT {
        if (is_resource()) {
            // `GetProcAddress` could not be called for libraries loaded with
            // `LOAD_LIBRARY_AS_DATAFILE`, `LOAD_LIBRARY_AS_DATAFILE_EXCLUSIVE`
            // or `LOAD_LIBRARY_AS_IMAGE_RESOURCE`.
            ec = boost::system::error_code(
                boost::system::errc::operation_not_supported,
                boost::system::generic_category()
            );

            return NULL;
        }

        // Judging by the documentation of GetProcAddress
        // there is no version for UNICODE on desktop/server Windows, because
        // names of functions are stored in narrow characters.
        void* const symbol = boost::dll::detail::aggressive_ptr_cast<void*>(
            boost::detail::winapi::get_proc_address(handle_, sb)
        );
        if (symbol == NULL) {
            ec = boost::dll::detail::last_error_code();
        }

        return symbol;
    }

    native_handle_t native() const BOOST_NOEXCEPT {
        return handle_;
    }

private:
    bool is_resource() const BOOST_NOEXCEPT {
        return false; /*!!(
            reinterpret_cast<boost::detail::winapi::ULONG_PTR_>(handle_) & static_cast<boost::detail::winapi::ULONG_PTR_>(3)
        );*/
    }

    native_handle_t handle_;
};

}}} // boost::dll::detail

#endif // BOOST_DLL_SHARED_LIBRARY_IMPL_HPP

