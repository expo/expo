//  boost/system/windows_error.hpp  ------------------------------------------//

//  Copyright Beman Dawes 2007

//  Distributed under the Boost Software License, Version 1.0. (See accompanying
//  file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See library home page at http://www.boost.org/libs/system

#ifndef BOOST_WINDOWS_ERROR_HPP
#define BOOST_WINDOWS_ERROR_HPP

//  This header is effectively empty for compiles on operating systems where
//  it is not applicable.

#include <boost/system/config.hpp>

#ifdef BOOST_WINDOWS_API

#include <boost/system/error_code.hpp>

// Neither MinGW or Cygwin versions of winerror.h work if used alone, so on
// either of those platforms include the full windows.h

#if defined(__MINGW32__) || defined(__CYGWIN__)
#include <windows.h>
#else
#include <winerror.h>
#endif

namespace boost
{
  namespace system
  {

    //  Microsoft Windows  ---------------------------------------------------//

    //  To construct an error_code after a API error:
    //
    //      error_code( ::GetLastError(), system_category() )

    namespace windows_error
    {
      enum windows_error_code
      {
        success = 0,
        // These names and values are based on Windows winerror.h
        invalid_function = ERROR_INVALID_FUNCTION,
        file_not_found = ERROR_FILE_NOT_FOUND,
        path_not_found = ERROR_PATH_NOT_FOUND,
        too_many_open_files = ERROR_TOO_MANY_OPEN_FILES,
        access_denied = ERROR_ACCESS_DENIED,
        invalid_handle = ERROR_INVALID_HANDLE,
        arena_trashed = ERROR_ARENA_TRASHED,
        not_enough_memory = ERROR_NOT_ENOUGH_MEMORY,
        invalid_block = ERROR_INVALID_BLOCK,
        bad_environment = ERROR_BAD_ENVIRONMENT,
        bad_format = ERROR_BAD_FORMAT,
        invalid_access = ERROR_INVALID_ACCESS,
        outofmemory = ERROR_OUTOFMEMORY,
        invalid_drive = ERROR_INVALID_DRIVE,
        current_directory = ERROR_CURRENT_DIRECTORY,
        not_same_device = ERROR_NOT_SAME_DEVICE,
        no_more_files = ERROR_NO_MORE_FILES,
        write_protect = ERROR_WRITE_PROTECT,
        bad_unit = ERROR_BAD_UNIT,
        not_ready = ERROR_NOT_READY,
        bad_command = ERROR_BAD_COMMAND,
        crc = ERROR_CRC,
        bad_length = ERROR_BAD_LENGTH,
        seek = ERROR_SEEK,
        not_dos_disk = ERROR_NOT_DOS_DISK,
        sector_not_found = ERROR_SECTOR_NOT_FOUND,
        out_of_paper = ERROR_OUT_OF_PAPER,
        write_fault = ERROR_WRITE_FAULT,
        read_fault = ERROR_READ_FAULT,
        gen_failure = ERROR_GEN_FAILURE,
        sharing_violation = ERROR_SHARING_VIOLATION,
        lock_violation = ERROR_LOCK_VIOLATION,
        wrong_disk = ERROR_WRONG_DISK,
        sharing_buffer_exceeded = ERROR_SHARING_BUFFER_EXCEEDED,
        handle_eof = ERROR_HANDLE_EOF,
        handle_disk_full= ERROR_HANDLE_DISK_FULL,
        rem_not_list = ERROR_REM_NOT_LIST,
        dup_name = ERROR_DUP_NAME,
        bad_net_path = ERROR_BAD_NETPATH,
        network_busy = ERROR_NETWORK_BUSY,
        // ...
        file_exists = ERROR_FILE_EXISTS,
        cannot_make = ERROR_CANNOT_MAKE,
        // ...
        broken_pipe = ERROR_BROKEN_PIPE,
        open_failed = ERROR_OPEN_FAILED,
        buffer_overflow = ERROR_BUFFER_OVERFLOW,
        disk_full= ERROR_DISK_FULL,
        // ...
        lock_failed = ERROR_LOCK_FAILED,
        busy = ERROR_BUSY,
        cancel_violation = ERROR_CANCEL_VIOLATION,
        already_exists = ERROR_ALREADY_EXISTS
        // ...

        // TODO: add more Windows errors
      };

    }  // namespace windows

# ifndef BOOST_SYSTEM_NO_DEPRECATED
    namespace windows = windows_error;
# endif

    template<> struct is_error_code_enum<windows_error::windows_error_code>
      { static const bool value = true; };

    namespace windows_error
    {
      inline error_code make_error_code( windows_error_code e )
        { return error_code( e, system_category() ); }
    }

  }  // namespace system
}  // namespace boost

#endif  // BOOST_WINDOWS_API

#endif  // BOOST_WINDOWS_ERROR_HPP
