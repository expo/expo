//  process.hpp  --------------------------------------------------------------//

//  Copyright 2016 Klemens D. Morgenstern
//  Copyright 2016 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

#ifndef BOOST_DETAIL_WINAPI_PROCESS_HPP_
#define BOOST_DETAIL_WINAPI_PROCESS_HPP_

#include <boost/detail/winapi/config.hpp>
#include <boost/detail/winapi/basic_types.hpp>
#include <boost/detail/winapi/access_rights.hpp>
#include <boost/detail/winapi/get_current_process.hpp>
#include <boost/detail/winapi/get_current_process_id.hpp>
#include <boost/predef/platform.h>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if BOOST_PLAT_WINDOWS_DESKTOP

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {

struct _PROCESS_INFORMATION;
#if !defined( BOOST_NO_ANSI_APIS )
struct _STARTUPINFOA;
#endif
struct _STARTUPINFOW;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
struct _PROC_THREAD_ATTRIBUTE_LIST;
#if !defined( BOOST_NO_ANSI_APIS )
struct _STARTUPINFOEXA;
#endif
struct _STARTUPINFOEXW;
#endif

BOOST_SYMBOL_IMPORT BOOST_NORETURN boost::detail::winapi::VOID_ WINAPI
ExitProcess(boost::detail::winapi::UINT_ uExitCode);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI TerminateProcess(
    boost::detail::winapi::HANDLE_ hProcess,
    boost::detail::winapi::UINT_ uExitCode);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI GetExitCodeProcess(
    boost::detail::winapi::HANDLE_ hProcess,
    boost::detail::winapi::LPDWORD_ lpExitCode);

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI CreateProcessA(
    boost::detail::winapi::LPCSTR_ lpApplicationName,
    boost::detail::winapi::LPSTR_ lpCommandLine,
    ::_SECURITY_ATTRIBUTES* lpProcessAttributes,
    ::_SECURITY_ATTRIBUTES* lpThreadAttributes,
    boost::detail::winapi::INT_ bInheritHandles,
    boost::detail::winapi::DWORD_ dwCreationFlags,
    boost::detail::winapi::LPVOID_ lpEnvironment,
    boost::detail::winapi::LPCSTR_ lpCurrentDirectory,
    ::_STARTUPINFOA* lpStartupInfo,
    ::_PROCESS_INFORMATION* lpProcessInformation);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI CreateProcessW(
    boost::detail::winapi::LPCWSTR_ lpApplicationName,
    boost::detail::winapi::LPWSTR_ lpCommandLine,
    ::_SECURITY_ATTRIBUTES* lpProcessAttributes,
    ::_SECURITY_ATTRIBUTES* lpThreadAttributes,
    boost::detail::winapi::INT_ bInheritHandles,
    boost::detail::winapi::DWORD_ dwCreationFlags,
    boost::detail::winapi::LPVOID_ lpEnvironment,
    boost::detail::winapi::LPCWSTR_ lpCurrentDirectory,
    ::_STARTUPINFOW* lpStartupInfo,
    ::_PROCESS_INFORMATION* lpProcessInformation);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI OpenProcess(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandle,
    boost::detail::winapi::DWORD_ dwProcessId);

} // extern "C"
#endif //defined BOOST_WINDOWS_H

namespace boost {
namespace detail {
namespace winapi {

#if defined( BOOST_USE_WINDOWS_H )

const DWORD_ DEBUG_PROCESS_                    = DEBUG_PROCESS;
const DWORD_ DEBUG_ONLY_THIS_PROCESS_          = DEBUG_ONLY_THIS_PROCESS;
const DWORD_ CREATE_SUSPENDED_                 = CREATE_SUSPENDED;
const DWORD_ DETACHED_PROCESS_                 = DETACHED_PROCESS;
const DWORD_ CREATE_NEW_CONSOLE_               = CREATE_NEW_CONSOLE;
const DWORD_ CREATE_NEW_PROCESS_GROUP_         = CREATE_NEW_PROCESS_GROUP;
const DWORD_ CREATE_UNICODE_ENVIRONMENT_       = CREATE_UNICODE_ENVIRONMENT;
const DWORD_ CREATE_SEPARATE_WOW_VDM_          = CREATE_SEPARATE_WOW_VDM;
const DWORD_ CREATE_SHARED_WOW_VDM_            = CREATE_SHARED_WOW_VDM;
const DWORD_ CREATE_FORCEDOS_                  = CREATE_FORCEDOS;
const DWORD_ CREATE_BREAKAWAY_FROM_JOB_        = CREATE_BREAKAWAY_FROM_JOB;
const DWORD_ CREATE_DEFAULT_ERROR_MODE_        = CREATE_DEFAULT_ERROR_MODE;
const DWORD_ CREATE_NO_WINDOW_                 = CREATE_NO_WINDOW;

// Undocumented
const DWORD_ PROFILE_USER_                     = PROFILE_USER;
const DWORD_ PROFILE_KERNEL_                   = PROFILE_KERNEL;
const DWORD_ PROFILE_SERVER_                   = PROFILE_SERVER;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
const DWORD_ CREATE_PROTECTED_PROCESS_         = CREATE_PROTECTED_PROCESS;
const DWORD_ EXTENDED_STARTUPINFO_PRESENT_     = EXTENDED_STARTUPINFO_PRESENT;
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN7
const DWORD_ INHERIT_PARENT_AFFINITY_          = INHERIT_PARENT_AFFINITY;
#endif

// Only documented for Windows CE
#if defined(UNDER_CE)
const DWORD_ INHERIT_CALLER_PRIORITY_          = INHERIT_CALLER_PRIORITY;
#endif

const DWORD_ STARTF_USESHOWWINDOW_    = STARTF_USESHOWWINDOW;
const DWORD_ STARTF_USESIZE_          = STARTF_USESIZE;
const DWORD_ STARTF_USEPOSITION_      = STARTF_USEPOSITION;
const DWORD_ STARTF_USECOUNTCHARS_    = STARTF_USECOUNTCHARS;
const DWORD_ STARTF_USEFILLATTRIBUTE_ = STARTF_USEFILLATTRIBUTE;
const DWORD_ STARTF_RUNFULLSCREEN_    = STARTF_RUNFULLSCREEN;
const DWORD_ STARTF_FORCEONFEEDBACK_  = STARTF_FORCEONFEEDBACK;
const DWORD_ STARTF_FORCEOFFFEEDBACK_ = STARTF_FORCEOFFFEEDBACK;
const DWORD_ STARTF_USESTDHANDLES_    = STARTF_USESTDHANDLES;
const DWORD_ STARTF_USEHOTKEY_        = STARTF_USEHOTKEY;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN7
const DWORD_ STARTF_TITLEISLINKNAME_  = STARTF_TITLEISLINKNAME;
const DWORD_ STARTF_TITLEISAPPID_     = STARTF_TITLEISAPPID;
const DWORD_ STARTF_PREVENTPINNING_   = STARTF_PREVENTPINNING;
#endif

const DWORD_ PROCESS_TERMINATE_ = PROCESS_TERMINATE;
const DWORD_ PROCESS_CREATE_THREAD_ = PROCESS_CREATE_THREAD;
const DWORD_ PROCESS_SET_SESSIONID_ = PROCESS_SET_SESSIONID;
const DWORD_ PROCESS_VM_OPERATION_ = PROCESS_VM_OPERATION;
const DWORD_ PROCESS_VM_READ_ = PROCESS_VM_READ;
const DWORD_ PROCESS_VM_WRITE_ = PROCESS_VM_WRITE;
const DWORD_ PROCESS_DUP_HANDLE_ = PROCESS_DUP_HANDLE;
const DWORD_ PROCESS_CREATE_PROCESS_ = PROCESS_CREATE_PROCESS;
const DWORD_ PROCESS_SET_QUOTA_ = PROCESS_SET_QUOTA;
const DWORD_ PROCESS_SET_INFORMATION_ = PROCESS_SET_INFORMATION;
const DWORD_ PROCESS_QUERY_INFORMATION_ = PROCESS_QUERY_INFORMATION;
const DWORD_ PROCESS_SUSPEND_RESUME_ = PROCESS_SUSPEND_RESUME;
const DWORD_ PROCESS_ALL_ACCESS_ = PROCESS_ALL_ACCESS;

#else // defined( BOOST_USE_WINDOWS_H )

const DWORD_ DEBUG_PROCESS_                    = 0x1;
const DWORD_ DEBUG_ONLY_THIS_PROCESS_          = 0x2;
const DWORD_ CREATE_SUSPENDED_                 = 0x4;
const DWORD_ DETACHED_PROCESS_                 = 0x8;
const DWORD_ CREATE_NEW_CONSOLE_               = 0x10;
const DWORD_ CREATE_NEW_PROCESS_GROUP_         = 0x200;
const DWORD_ CREATE_UNICODE_ENVIRONMENT_       = 0x400;
const DWORD_ CREATE_SEPARATE_WOW_VDM_          = 0x800;
const DWORD_ CREATE_SHARED_WOW_VDM_            = 0x1000;
const DWORD_ CREATE_FORCEDOS_                  = 0x2000;
const DWORD_ CREATE_BREAKAWAY_FROM_JOB_        = 0x1000000;
const DWORD_ CREATE_DEFAULT_ERROR_MODE_        = 0x4000000;
const DWORD_ CREATE_NO_WINDOW_                 = 0x8000000;

// Undocumented
const DWORD_ PROFILE_USER_                     = 0x10000000;
const DWORD_ PROFILE_KERNEL_                   = 0x20000000;
const DWORD_ PROFILE_SERVER_                   = 0x40000000;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
const DWORD_ CREATE_PROTECTED_PROCESS_         = 0x40000;
const DWORD_ EXTENDED_STARTUPINFO_PRESENT_     = 0x80000;
#endif

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN7
const DWORD_ INHERIT_PARENT_AFFINITY_          = 0x10000;
#endif

// Only documented for Windows CE
#if defined(UNDER_CE)
const DWORD_ INHERIT_CALLER_PRIORITY_          = 0x20000;
#endif

const DWORD_ STARTF_USESHOWWINDOW_    = 0x00000001;
const DWORD_ STARTF_USESIZE_          = 0x00000002;
const DWORD_ STARTF_USEPOSITION_      = 0x00000004;
const DWORD_ STARTF_USECOUNTCHARS_    = 0x00000008;
const DWORD_ STARTF_USEFILLATTRIBUTE_ = 0x00000010;
const DWORD_ STARTF_RUNFULLSCREEN_    = 0x00000020;
const DWORD_ STARTF_FORCEONFEEDBACK_  = 0x00000040;
const DWORD_ STARTF_FORCEOFFFEEDBACK_ = 0x00000080;
const DWORD_ STARTF_USESTDHANDLES_    = 0x00000100;
const DWORD_ STARTF_USEHOTKEY_        = 0x00000200;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN7
const DWORD_ STARTF_TITLEISLINKNAME_  = 0x00000800;
const DWORD_ STARTF_TITLEISAPPID_     = 0x00001000;
const DWORD_ STARTF_PREVENTPINNING_   = 0x00002000;
#endif

const DWORD_ PROCESS_TERMINATE_ = 0x0001;
const DWORD_ PROCESS_CREATE_THREAD_ = 0x0002;
const DWORD_ PROCESS_SET_SESSIONID_ = 0x0004;
const DWORD_ PROCESS_VM_OPERATION_ = 0x0008;
const DWORD_ PROCESS_VM_READ_ = 0x0010;
const DWORD_ PROCESS_VM_WRITE_ = 0x0020;
const DWORD_ PROCESS_DUP_HANDLE_ = 0x0040;
const DWORD_ PROCESS_CREATE_PROCESS_ = 0x0080;
const DWORD_ PROCESS_SET_QUOTA_ = 0x0100;
const DWORD_ PROCESS_SET_INFORMATION_ = 0x0200;
const DWORD_ PROCESS_QUERY_INFORMATION_ = 0x0400;
const DWORD_ PROCESS_SUSPEND_RESUME_ = 0x0800;
const DWORD_ PROCESS_ALL_ACCESS_ = (STANDARD_RIGHTS_REQUIRED_ | SYNCHRONIZE_ | 0xFFF);

#endif // defined( BOOST_USE_WINDOWS_H )

#if defined( BOOST_USE_WINDOWS_H ) && !defined( BOOST_WINAPI_IS_MINGW )

const DWORD_ CREATE_PRESERVE_CODE_AUTHZ_LEVEL_ = CREATE_PRESERVE_CODE_AUTHZ_LEVEL;

// Undocumented
const DWORD_ CREATE_IGNORE_SYSTEM_DEFAULT_     = CREATE_IGNORE_SYSTEM_DEFAULT;

#else // defined( BOOST_USE_WINDOWS_H ) && !defined( BOOST_WINAPI_IS_MINGW )

const DWORD_ CREATE_PRESERVE_CODE_AUTHZ_LEVEL_ = 0x2000000;

// Undocumented
const DWORD_ CREATE_IGNORE_SYSTEM_DEFAULT_     = 0x80000000;

#endif // defined( BOOST_USE_WINDOWS_H ) && !defined( BOOST_WINAPI_IS_MINGW )

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _PROCESS_INFORMATION {
    HANDLE_ hProcess;
    HANDLE_ hThread;
    DWORD_ dwProcessId;
    DWORD_ dwThreadId;
} PROCESS_INFORMATION_, *PPROCESS_INFORMATION_, *LPPROCESS_INFORMATION_;

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _STARTUPINFOA {
    DWORD_ cb;
    LPSTR_ lpReserved;
    LPSTR_ lpDesktop;
    LPSTR_ lpTitle;
    DWORD_ dwX;
    DWORD_ dwY;
    DWORD_ dwXSize;
    DWORD_ dwYSize;
    DWORD_ dwXCountChars;
    DWORD_ dwYCountChars;
    DWORD_ dwFillAttribute;
    DWORD_ dwFlags;
    WORD_ wShowWindow;
    WORD_ cbReserved2;
    LPBYTE_ lpReserved2;
    HANDLE_ hStdInput;
    HANDLE_ hStdOutput;
    HANDLE_ hStdError;
} STARTUPINFOA_, *LPSTARTUPINFOA_;

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _STARTUPINFOW {
    DWORD_ cb;
    LPWSTR_ lpReserved;
    LPWSTR_ lpDesktop;
    LPWSTR_ lpTitle;
    DWORD_ dwX;
    DWORD_ dwY;
    DWORD_ dwXSize;
    DWORD_ dwYSize;
    DWORD_ dwXCountChars;
    DWORD_ dwYCountChars;
    DWORD_ dwFillAttribute;
    DWORD_ dwFlags;
    WORD_ wShowWindow;
    WORD_ cbReserved2;
    LPBYTE_ lpReserved2;
    HANDLE_ hStdInput;
    HANDLE_ hStdOutput;
    HANDLE_ hStdError;
} STARTUPINFOW_, *LPSTARTUPINFOW_;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

typedef struct _PROC_THREAD_ATTRIBUTE_LIST PROC_THREAD_ATTRIBUTE_LIST_, *PPROC_THREAD_ATTRIBUTE_LIST_;

#if !defined(BOOST_NO_ANSI_APIS)
typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _STARTUPINFOEXA {
    STARTUPINFOA_ StartupInfo;
    PPROC_THREAD_ATTRIBUTE_LIST_ lpAttributeList;
} STARTUPINFOEXA_, *LPSTARTUPINFOEXA_;
#endif //BOOST_NO_ANSI_APIS

typedef struct BOOST_DETAIL_WINAPI_MAY_ALIAS _STARTUPINFOEXW {
    STARTUPINFOW_ StartupInfo;
    PPROC_THREAD_ATTRIBUTE_LIST_ lpAttributeList;
} STARTUPINFOEXW_, *LPSTARTUPINFOEXW_;

#endif // BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

using ::GetExitCodeProcess;
using ::ExitProcess;
using ::TerminateProcess;
using ::OpenProcess;

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE BOOL_ CreateProcessA(
    LPCSTR_ lpApplicationName,
    LPSTR_ lpCommandLine,
    LPSECURITY_ATTRIBUTES_ lpProcessAttributes,
    LPSECURITY_ATTRIBUTES_ lpThreadAttributes,
    INT_ bInheritHandles,
    DWORD_ dwCreationFlags,
    LPVOID_ lpEnvironment,
    LPCSTR_ lpCurrentDirectory,
    LPSTARTUPINFOA_ lpStartupInfo,
    LPPROCESS_INFORMATION_ lpProcessInformation)
{
    return ::CreateProcessA(
        lpApplicationName,
        lpCommandLine,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpProcessAttributes),
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpThreadAttributes),
        bInheritHandles,
        dwCreationFlags,
        lpEnvironment,
        lpCurrentDirectory,
        reinterpret_cast< ::_STARTUPINFOA* >(lpStartupInfo),
        reinterpret_cast< ::_PROCESS_INFORMATION* >(lpProcessInformation));
}

BOOST_FORCEINLINE BOOL_ create_process(
    LPCSTR_ lpApplicationName,
    LPSTR_ lpCommandLine,
    LPSECURITY_ATTRIBUTES_ lpProcessAttributes,
    LPSECURITY_ATTRIBUTES_ lpThreadAttributes,
    INT_ bInheritHandles,
    DWORD_ dwCreationFlags,
    LPVOID_ lpEnvironment,
    LPCSTR_ lpCurrentDirectory,
    LPSTARTUPINFOA_ lpStartupInfo,
    LPPROCESS_INFORMATION_ lpProcessInformation)
{
    return ::CreateProcessA(
        lpApplicationName,
        lpCommandLine,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpProcessAttributes),
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpThreadAttributes),
        bInheritHandles,
        dwCreationFlags,
        lpEnvironment,
        lpCurrentDirectory,
        reinterpret_cast< ::_STARTUPINFOA* >(lpStartupInfo),
        reinterpret_cast< ::_PROCESS_INFORMATION* >(lpProcessInformation));
}
#endif

BOOST_FORCEINLINE BOOL_ CreateProcessW(
    LPCWSTR_ lpApplicationName,
    LPWSTR_ lpCommandLine,
    LPSECURITY_ATTRIBUTES_ lpProcessAttributes,
    LPSECURITY_ATTRIBUTES_ lpThreadAttributes,
    INT_ bInheritHandles,
    DWORD_ dwCreationFlags,
    LPVOID_ lpEnvironment,
    LPCWSTR_ lpCurrentDirectory,
    LPSTARTUPINFOW_ lpStartupInfo,
    LPPROCESS_INFORMATION_ lpProcessInformation)
{
    return ::CreateProcessW(
        lpApplicationName,
        lpCommandLine,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpProcessAttributes),
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpThreadAttributes),
        bInheritHandles,
        dwCreationFlags,
        lpEnvironment,
        lpCurrentDirectory,
        reinterpret_cast< ::_STARTUPINFOW* >(lpStartupInfo),
        reinterpret_cast< ::_PROCESS_INFORMATION* >(lpProcessInformation));
}

BOOST_FORCEINLINE BOOL_ create_process(
    LPCWSTR_ lpApplicationName,
    LPWSTR_ lpCommandLine,
    LPSECURITY_ATTRIBUTES_ lpProcessAttributes,
    LPSECURITY_ATTRIBUTES_ lpThreadAttributes,
    INT_ bInheritHandles,
    DWORD_ dwCreationFlags,
    LPVOID_ lpEnvironment,
    LPCWSTR_ lpCurrentDirectory,
    LPSTARTUPINFOW_ lpStartupInfo,
    LPPROCESS_INFORMATION_ lpProcessInformation)
{
    return ::CreateProcessW(
        lpApplicationName,
        lpCommandLine,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpProcessAttributes),
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpThreadAttributes),
        bInheritHandles,
        dwCreationFlags,
        lpEnvironment,
        lpCurrentDirectory,
        reinterpret_cast< ::_STARTUPINFOW* >(lpStartupInfo),
        reinterpret_cast< ::_PROCESS_INFORMATION* >(lpProcessInformation));
}

}
}
}

#endif // BOOST_PLAT_WINDOWS_DESKTOP

#endif // BOOST_DETAIL_WINAPI_PROCESS_HPP_
