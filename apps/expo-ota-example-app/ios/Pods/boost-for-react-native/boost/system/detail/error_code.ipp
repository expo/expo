//  error_code support implementation file  ----------------------------------//

//  Copyright Beman Dawes 2002, 2006
//  Copyright (c) Microsoft Corporation 2014
//  Distributed under the Boost Software License, Version 1.0. (See accompanying
//  file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See library home page at http://www.boost.org/libs/system

//----------------------------------------------------------------------------//

#include <boost/config/warning_disable.hpp>

#include <boost/system/config.hpp>
#include <boost/system/error_code.hpp>
#include <boost/cerrno.hpp>
#include <vector>
#include <cstdlib>
#include <cassert>

#include <cstring> // for strerror/strerror_r

# if defined( BOOST_WINDOWS_API )
#   include <windows.h>
#   if !BOOST_PLAT_WINDOWS_RUNTIME
#     include <boost/system/detail/local_free_on_destruction.hpp>
#   endif
#   ifndef ERROR_INCORRECT_SIZE
#     define ERROR_INCORRECT_SIZE ERROR_BAD_ARGUMENTS
#   endif
# endif

//----------------------------------------------------------------------------//
namespace boost
{
    namespace system
    {

namespace
{

  //  standard error categories  ---------------------------------------------//

  class generic_error_category : public error_category
  {
  public:
    generic_error_category(){}
    const char *   name() const BOOST_SYSTEM_NOEXCEPT;
    std::string    message( int ev ) const;
  };

  class system_error_category : public error_category
  {
  public:
    system_error_category(){}
    const char *        name() const BOOST_SYSTEM_NOEXCEPT;
    std::string         message( int ev ) const;
    error_condition     default_error_condition( int ev ) const BOOST_SYSTEM_NOEXCEPT;
  };

  //  generic_error_category implementation  ---------------------------------//

  const char * generic_error_category::name() const BOOST_SYSTEM_NOEXCEPT
  {
    return "generic";
  }

  std::string generic_error_category::message( int ev ) const
  {
    using namespace boost::system::errc;
#if defined(__PGI)
      using boost::system::errc::invalid_argument;
#endif

    static std::string unknown_err( "Unknown error" );
  // strerror_r is preferred because it is always thread safe,
  // however, we fallback to strerror in certain cases because:
  //   -- Windows doesn't provide strerror_r.
  //   -- HP and Sun do provide strerror_r on newer systems, but there is
  //      no way to tell if is available at runtime and in any case their
  //      versions of strerror are thread safe anyhow.
  //   -- Linux only sometimes provides strerror_r.
  //   -- Tru64 provides strerror_r only when compiled -pthread.
  //   -- VMS doesn't provide strerror_r, but on this platform, strerror is
  //      thread safe.
  # if defined(BOOST_WINDOWS_API) || defined(__hpux) || defined(__sun)\
     || (defined(__linux) && (!defined(__USE_XOPEN2K) || defined(BOOST_SYSTEM_USE_STRERROR)))\
     || (defined(__osf__) && !defined(_REENTRANT))\
     || (defined(__INTEGRITY))\
     || (defined(__vms))\
     || (defined(__QNXNTO__))
      const char * c_str = std::strerror( ev );
      return  c_str
        ? std::string( c_str )
        : unknown_err;
  # else  // use strerror_r
      char buf[64];
      char * bp = buf;
      std::size_t sz = sizeof(buf);
  #  if defined(__CYGWIN__) || defined(__USE_GNU)
      // Oddball version of strerror_r
      const char * c_str = strerror_r( ev, bp, sz );
      return  c_str
        ? std::string( c_str )
        : unknown_err;
  #  else
      // POSIX version of strerror_r
      int result;
      for (;;)
      {
        // strerror_r returns 0 on success, otherwise ERANGE if buffer too small,
        // invalid_argument if ev not a valid error number
  #  if defined (__sgi)
        const char * c_str = strerror( ev );
        result = 0;
      return  c_str
        ? std::string( c_str )
        : unknown_err;
  #  else
        result = strerror_r( ev, bp, sz );
  #  endif
        if (result == 0 )
          break;
        else
        {
  #  if defined(__linux)
          // Linux strerror_r returns -1 on error, with error number in errno
          result = errno;
  #  endif
          if ( result !=  ERANGE ) break;
          if ( sz > sizeof(buf) ) std::free( bp );
          sz *= 2;
          if ( (bp = static_cast<char*>(std::malloc( sz ))) == 0 )
            return std::string( "ENOMEM" );
        }
      }
      std::string msg;
#   ifndef BOOST_NO_EXCEPTIONS
      try
#   endif
      {
        msg = ( ( result == invalid_argument ) ? "Unknown error" : bp );
      }

#   ifndef BOOST_NO_EXCEPTIONS
      // See ticket #2098
      catch(...)
      {
        // just eat the exception
      }
#   endif

      if ( sz > sizeof(buf) ) std::free( bp );
      sz = 0;
      return msg;
  #  endif   // else POSIX version of strerror_r
  # endif  // else use strerror_r
  }
  //  system_error_category implementation  --------------------------------//

  const char * system_error_category::name() const BOOST_SYSTEM_NOEXCEPT
  {
    return "system";
  }

  error_condition system_error_category::default_error_condition( int ev ) const BOOST_SYSTEM_NOEXCEPT
  {
    using namespace boost::system::errc;
#if defined(__PGI)
      using boost::system::errc::invalid_argument;
#endif

# if defined(BOOST_WINDOWS_API)
#   if defined(WINAPI_FAMILY) && ((WINAPI_FAMILY & WINAPI_PARTITION_APP) != 0)
    // When using the Windows Runtime, most system errors are reported as HRESULTs.
    // We want to map the common Win32 errors to their equivalent error condition,
    // whether or not they are reported via an HRESULT.
    if ( ev < 0 ) // Check for failed HRESULTs only.
      if ( HRESULT_FACILITY( ev ) == FACILITY_WIN32 )
        ev = HRESULT_CODE( ev );
#   endif
# endif

    switch ( ev )
    {
    case 0: return make_error_condition( success );
# if defined(BOOST_POSIX_API)
    // POSIX-like O/S -> posix_errno decode table  ---------------------------//
    case E2BIG: return make_error_condition( argument_list_too_long );
    case EACCES: return make_error_condition( permission_denied );
    case EADDRINUSE: return make_error_condition( address_in_use );
    case EADDRNOTAVAIL: return make_error_condition( address_not_available );
    case EAFNOSUPPORT: return make_error_condition( address_family_not_supported );
    case EAGAIN: return make_error_condition( resource_unavailable_try_again );
#   if EALREADY != EBUSY  //  EALREADY and EBUSY are the same on QNX Neutrino
    case EALREADY: return make_error_condition( connection_already_in_progress );
#   endif
    case EBADF: return make_error_condition( bad_file_descriptor );
    case EBADMSG: return make_error_condition( bad_message );
    case EBUSY: return make_error_condition( device_or_resource_busy );
    case ECANCELED: return make_error_condition( operation_canceled );
    case ECHILD: return make_error_condition( no_child_process );
    case ECONNABORTED: return make_error_condition( connection_aborted );
    case ECONNREFUSED: return make_error_condition( connection_refused );
    case ECONNRESET: return make_error_condition( connection_reset );
    case EDEADLK: return make_error_condition( resource_deadlock_would_occur );
    case EDESTADDRREQ: return make_error_condition( destination_address_required );
    case EDOM: return make_error_condition( argument_out_of_domain );
    case EEXIST: return make_error_condition( file_exists );
    case EFAULT: return make_error_condition( bad_address );
    case EFBIG: return make_error_condition( file_too_large );
    case EHOSTUNREACH: return make_error_condition( host_unreachable );
    case EIDRM: return make_error_condition( identifier_removed );
    case EILSEQ: return make_error_condition( illegal_byte_sequence );
    case EINPROGRESS: return make_error_condition( operation_in_progress );
    case EINTR: return make_error_condition( interrupted );
    case EINVAL: return make_error_condition( invalid_argument );
    case EIO: return make_error_condition( io_error );
    case EISCONN: return make_error_condition( already_connected );
    case EISDIR: return make_error_condition( is_a_directory );
    case ELOOP: return make_error_condition( too_many_symbolic_link_levels );
    case EMFILE: return make_error_condition( too_many_files_open );
    case EMLINK: return make_error_condition( too_many_links );
    case EMSGSIZE: return make_error_condition( message_size );
    case ENAMETOOLONG: return make_error_condition( filename_too_long );
    case ENETDOWN: return make_error_condition( network_down );
    case ENETRESET: return make_error_condition( network_reset );
    case ENETUNREACH: return make_error_condition( network_unreachable );
    case ENFILE: return make_error_condition( too_many_files_open_in_system );
    case ENOBUFS: return make_error_condition( no_buffer_space );
    case ENODATA: return make_error_condition( no_message_available );
    case ENODEV: return make_error_condition( no_such_device );
    case ENOENT: return make_error_condition( no_such_file_or_directory );
    case ENOEXEC: return make_error_condition( executable_format_error );
    case ENOLCK: return make_error_condition( no_lock_available );
    case ENOLINK: return make_error_condition( no_link );
    case ENOMEM: return make_error_condition( not_enough_memory );
    case ENOMSG: return make_error_condition( no_message );
    case ENOPROTOOPT: return make_error_condition( no_protocol_option );
    case ENOSPC: return make_error_condition( no_space_on_device );
    case ENOSR: return make_error_condition( no_stream_resources );
    case ENOSTR: return make_error_condition( not_a_stream );
    case ENOSYS: return make_error_condition( function_not_supported );
    case ENOTCONN: return make_error_condition( not_connected );
    case ENOTDIR: return make_error_condition( not_a_directory );
  # if ENOTEMPTY != EEXIST // AIX treats ENOTEMPTY and EEXIST as the same value
    case ENOTEMPTY: return make_error_condition( directory_not_empty );
  # endif // ENOTEMPTY != EEXIST
  # if ENOTRECOVERABLE != ECONNRESET // the same on some Broadcom chips
    case ENOTRECOVERABLE: return make_error_condition( state_not_recoverable );
  # endif // ENOTRECOVERABLE != ECONNRESET
    case ENOTSOCK: return make_error_condition( not_a_socket );
    case ENOTSUP: return make_error_condition( not_supported );
    case ENOTTY: return make_error_condition( inappropriate_io_control_operation );
    case ENXIO: return make_error_condition( no_such_device_or_address );
  # if EOPNOTSUPP != ENOTSUP
    case EOPNOTSUPP: return make_error_condition( operation_not_supported );
  # endif // EOPNOTSUPP != ENOTSUP
    case EOVERFLOW: return make_error_condition( value_too_large );
  # if EOWNERDEAD != ECONNABORTED // the same on some Broadcom chips
    case EOWNERDEAD: return make_error_condition( owner_dead );
  # endif // EOWNERDEAD != ECONNABORTED
    case EPERM: return make_error_condition( operation_not_permitted );
    case EPIPE: return make_error_condition( broken_pipe );
    case EPROTO: return make_error_condition( protocol_error );
    case EPROTONOSUPPORT: return make_error_condition( protocol_not_supported );
    case EPROTOTYPE: return make_error_condition( wrong_protocol_type );
    case ERANGE: return make_error_condition( result_out_of_range );
    case EROFS: return make_error_condition( read_only_file_system );
    case ESPIPE: return make_error_condition( invalid_seek );
    case ESRCH: return make_error_condition( no_such_process );
    case ETIME: return make_error_condition( stream_timeout );
    case ETIMEDOUT: return make_error_condition( timed_out );
    case ETXTBSY: return make_error_condition( text_file_busy );
  # if EAGAIN != EWOULDBLOCK
    case EWOULDBLOCK: return make_error_condition( operation_would_block );
  # endif // EAGAIN != EWOULDBLOCK
    case EXDEV: return make_error_condition( cross_device_link );
  #else
    // Windows system -> posix_errno decode table  ---------------------------//
    // see WinError.h comments for descriptions of errors
    case ERROR_ACCESS_DENIED: return make_error_condition( permission_denied );
    case ERROR_ALREADY_EXISTS: return make_error_condition( file_exists );
    case ERROR_BAD_UNIT: return make_error_condition( no_such_device );
    case ERROR_BUFFER_OVERFLOW: return make_error_condition( filename_too_long );
    case ERROR_BUSY: return make_error_condition( device_or_resource_busy );
    case ERROR_BUSY_DRIVE: return make_error_condition( device_or_resource_busy );
    case ERROR_CANNOT_MAKE: return make_error_condition( permission_denied );
    case ERROR_CANTOPEN: return make_error_condition( io_error );
    case ERROR_CANTREAD: return make_error_condition( io_error );
    case ERROR_CANTWRITE: return make_error_condition( io_error );
    case ERROR_CURRENT_DIRECTORY: return make_error_condition( permission_denied );
    case ERROR_DEV_NOT_EXIST: return make_error_condition( no_such_device );
    case ERROR_DEVICE_IN_USE: return make_error_condition( device_or_resource_busy );
    case ERROR_DIR_NOT_EMPTY: return make_error_condition( directory_not_empty );
    case ERROR_DIRECTORY: return make_error_condition( invalid_argument ); // WinError.h: "The directory name is invalid"
    case ERROR_DISK_FULL: return make_error_condition( no_space_on_device );
    case ERROR_FILE_EXISTS: return make_error_condition( file_exists );
    case ERROR_FILE_NOT_FOUND: return make_error_condition( no_such_file_or_directory );
    case ERROR_HANDLE_DISK_FULL: return make_error_condition( no_space_on_device );
    case ERROR_INVALID_ACCESS: return make_error_condition( permission_denied );
    case ERROR_INVALID_DRIVE: return make_error_condition( no_such_device );
    case ERROR_INVALID_FUNCTION: return make_error_condition( function_not_supported );
    case ERROR_INVALID_HANDLE: return make_error_condition( invalid_argument );
    case ERROR_INVALID_NAME: return make_error_condition( invalid_argument );
    case ERROR_LOCK_VIOLATION: return make_error_condition( no_lock_available );
    case ERROR_LOCKED: return make_error_condition( no_lock_available );
    case ERROR_NEGATIVE_SEEK: return make_error_condition( invalid_argument );
    case ERROR_NOACCESS: return make_error_condition( permission_denied );
    case ERROR_NOT_ENOUGH_MEMORY: return make_error_condition( not_enough_memory );
    case ERROR_NOT_READY: return make_error_condition( resource_unavailable_try_again );
    case ERROR_NOT_SAME_DEVICE: return make_error_condition( cross_device_link );
    case ERROR_OPEN_FAILED: return make_error_condition( io_error );
    case ERROR_OPEN_FILES: return make_error_condition( device_or_resource_busy );
    case ERROR_OPERATION_ABORTED: return make_error_condition( operation_canceled );
    case ERROR_OUTOFMEMORY: return make_error_condition( not_enough_memory );
    case ERROR_PATH_NOT_FOUND: return make_error_condition( no_such_file_or_directory );
    case ERROR_READ_FAULT: return make_error_condition( io_error );
    case ERROR_RETRY: return make_error_condition( resource_unavailable_try_again );
    case ERROR_SEEK: return make_error_condition( io_error );
    case ERROR_SHARING_VIOLATION: return make_error_condition( permission_denied );
    case ERROR_TOO_MANY_OPEN_FILES: return make_error_condition( too_many_files_open );
    case ERROR_WRITE_FAULT: return make_error_condition( io_error );
    case ERROR_WRITE_PROTECT: return make_error_condition( permission_denied );
    case WSAEACCES: return make_error_condition( permission_denied );
    case WSAEADDRINUSE: return make_error_condition( address_in_use );
    case WSAEADDRNOTAVAIL: return make_error_condition( address_not_available );
    case WSAEAFNOSUPPORT: return make_error_condition( address_family_not_supported );
    case WSAEALREADY: return make_error_condition( connection_already_in_progress );
    case WSAEBADF: return make_error_condition( bad_file_descriptor );
    case WSAECONNABORTED: return make_error_condition( connection_aborted );
    case WSAECONNREFUSED: return make_error_condition( connection_refused );
    case WSAECONNRESET: return make_error_condition( connection_reset );
    case WSAEDESTADDRREQ: return make_error_condition( destination_address_required );
    case WSAEFAULT: return make_error_condition( bad_address );
    case WSAEHOSTUNREACH: return make_error_condition( host_unreachable );
    case WSAEINPROGRESS: return make_error_condition( operation_in_progress );
    case WSAEINTR: return make_error_condition( interrupted );
    case WSAEINVAL: return make_error_condition( invalid_argument );
    case WSAEISCONN: return make_error_condition( already_connected );
    case WSAEMFILE: return make_error_condition( too_many_files_open );
    case WSAEMSGSIZE: return make_error_condition( message_size );
    case WSAENAMETOOLONG: return make_error_condition( filename_too_long );
    case WSAENETDOWN: return make_error_condition( network_down );
    case WSAENETRESET: return make_error_condition( network_reset );
    case WSAENETUNREACH: return make_error_condition( network_unreachable );
    case WSAENOBUFS: return make_error_condition( no_buffer_space );
    case WSAENOPROTOOPT: return make_error_condition( no_protocol_option );
    case WSAENOTCONN: return make_error_condition( not_connected );
    case WSAENOTSOCK: return make_error_condition( not_a_socket );
    case WSAEOPNOTSUPP: return make_error_condition( operation_not_supported );
    case WSAEPROTONOSUPPORT: return make_error_condition( protocol_not_supported );
    case WSAEPROTOTYPE: return make_error_condition( wrong_protocol_type );
    case WSAETIMEDOUT: return make_error_condition( timed_out );
    case WSAEWOULDBLOCK: return make_error_condition( operation_would_block );
  #endif
    default: return error_condition( ev, system_category() );
    }
  }

# if !defined( BOOST_WINDOWS_API )

  std::string system_error_category::message( int ev ) const
  {
    return generic_category().message( ev );
  }
# else

  std::string system_error_category::message( int ev ) const
  {
#if defined(UNDER_CE) || BOOST_PLAT_WINDOWS_RUNTIME || defined(BOOST_NO_ANSI_APIS)
    std::wstring buf(128, wchar_t());
    for (;;)
    {
        DWORD retval = ::FormatMessageW(
            FORMAT_MESSAGE_FROM_SYSTEM |
            FORMAT_MESSAGE_IGNORE_INSERTS,
            NULL,
            ev,
            MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), // Default language
            &buf[0],
            buf.size(),
            NULL
        );
        
        if (retval > 0)
        {
            buf.resize(retval);
            break;
        }
        else if ( ::GetLastError() != ERROR_INSUFFICIENT_BUFFER )
        {
            return std::string("Unknown error");
        }
        else
        {
            buf.resize(buf.size() + buf.size() / 2);
        }
    }
    
    int num_chars = (buf.size() + 1) * 2;
    LPSTR narrow_buffer = (LPSTR)_alloca( num_chars );
    if (::WideCharToMultiByte(CP_ACP, 0, buf.c_str(), -1, narrow_buffer, num_chars, NULL, NULL) == 0)
    {
        return std::string("Unknown error");
    }

    std::string str( narrow_buffer );
#else
    LPVOID lpMsgBuf = 0;
    DWORD retval = ::FormatMessageA(
        FORMAT_MESSAGE_ALLOCATE_BUFFER |
        FORMAT_MESSAGE_FROM_SYSTEM |
        FORMAT_MESSAGE_IGNORE_INSERTS,
        NULL,
        ev,
        MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), // Default language
        (LPSTR) &lpMsgBuf,
        0,
        NULL
    );
    detail::local_free_on_destruction lfod(lpMsgBuf);
    if (retval == 0)
        return std::string("Unknown error");

    std::string str( static_cast<LPCSTR>(lpMsgBuf) );
# endif
    while ( str.size()
      && (str[str.size()-1] == '\n' || str[str.size()-1] == '\r') )
        str.erase( str.size()-1 );
    if ( str.size() && str[str.size()-1] == '.' )
      { str.erase( str.size()-1 ); }
    return str;
  }
# endif

} // unnamed namespace


# ifndef BOOST_SYSTEM_NO_DEPRECATED
    BOOST_SYSTEM_DECL error_code throws; // "throw on error" special error_code;
                                         //  note that it doesn't matter if this
                                         //  isn't initialized before use since
                                         //  the only use is to take its
                                         //  address for comparison purposes
# endif

# ifdef BOOST_ERROR_CODE_HEADER_ONLY
#   define BOOST_SYSTEM_LINKAGE inline
# else
#   define BOOST_SYSTEM_LINKAGE BOOST_SYSTEM_DECL
# endif

    BOOST_SYSTEM_LINKAGE const error_category & system_category() BOOST_SYSTEM_NOEXCEPT
    {
      static const system_error_category  system_category_const;
      return system_category_const;
    }

    BOOST_SYSTEM_LINKAGE const error_category & generic_category() BOOST_SYSTEM_NOEXCEPT
    {
      static const generic_error_category generic_category_const;
      return generic_category_const;
    }

  } // namespace system
} // namespace boost
