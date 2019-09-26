//  jobs.hpp  --------------------------------------------------------------//

//  Copyright 2016 Klemens D. Morgenstern

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

#ifndef BOOST_DETAIL_WINAPI_JOBS_HPP_
#define BOOST_DETAIL_WINAPI_JOBS_HPP_

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/detail/winapi/access_rights.hpp>

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {
#if !defined( BOOST_NO_ANSI_APIS )
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI CreateJobObjectA(
    ::_SECURITY_ATTRIBUTES* lpJobAttributes,
    boost::detail::winapi::LPCSTR_ lpName);
#endif

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI CreateJobObjectW(
    ::_SECURITY_ATTRIBUTES* lpJobAttributes,
    boost::detail::winapi::LPCWSTR_ lpName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI AssignProcessToJobObject(
    boost::detail::winapi::HANDLE_ hJob,
    boost::detail::winapi::HANDLE_ hProcess);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI IsProcessInJob(
    boost::detail::winapi::HANDLE_ ProcessHandle,
    boost::detail::winapi::HANDLE_ JobHandle,
    boost::detail::winapi::PBOOL_ Result);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI TerminateJobObject(
    boost::detail::winapi::HANDLE_ hJob,
    boost::detail::winapi::UINT_ uExitCode);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI OpenJobObjectA(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandles,
    boost::detail::winapi::LPCSTR_ lpName);

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI OpenJobObjectW(
    boost::detail::winapi::DWORD_ dwDesiredAccess,
    boost::detail::winapi::BOOL_ bInheritHandles,
    boost::detail::winapi::LPCWSTR_ lpName);
} // extern "C"
#endif // !defined( BOOST_USE_WINDOWS_H )

namespace boost { namespace detail { namespace winapi {

#if defined( BOOST_USE_WINDOWS_H )
const DWORD_ JOB_OBJECT_ASSIGN_PROCESS_ = JOB_OBJECT_ASSIGN_PROCESS;
const DWORD_ JOB_OBJECT_SET_ATTRIBUTES_ = JOB_OBJECT_SET_ATTRIBUTES;
const DWORD_ JOB_OBJECT_QUERY_ = JOB_OBJECT_QUERY;
const DWORD_ JOB_OBJECT_TERMINATE_ = JOB_OBJECT_TERMINATE;
const DWORD_ JOB_OBJECT_SET_SECURITY_ATTRIBUTES_ = JOB_OBJECT_SET_SECURITY_ATTRIBUTES;
const DWORD_ JOB_OBJECT_ALL_ACCESS_ = JOB_OBJECT_ALL_ACCESS;
#else
const DWORD_ JOB_OBJECT_ASSIGN_PROCESS_ = 0x0001;
const DWORD_ JOB_OBJECT_SET_ATTRIBUTES_ = 0x0002;
const DWORD_ JOB_OBJECT_QUERY_ = 0x0004;
const DWORD_ JOB_OBJECT_TERMINATE_ = 0x0008;
const DWORD_ JOB_OBJECT_SET_SECURITY_ATTRIBUTES_ = 0x0010;
const DWORD_ JOB_OBJECT_ALL_ACCESS_ = (STANDARD_RIGHTS_REQUIRED_ | SYNCHRONIZE_ | 0x1F);
#endif

#if !defined( BOOST_NO_ANSI_APIS )
using ::OpenJobObjectA;
#endif

using ::OpenJobObjectW;

using ::AssignProcessToJobObject;
using ::IsProcessInJob;
using ::TerminateJobObject;

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HANDLE_ CreateJobObjectA(LPSECURITY_ATTRIBUTES_ lpJobAttributes, LPCSTR_ lpName)
{
    return ::CreateJobObjectA(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpJobAttributes), lpName);
}

BOOST_FORCEINLINE HANDLE_ create_job_object(LPSECURITY_ATTRIBUTES_ lpJobAttributes, LPCSTR_ lpName)
{
    return ::CreateJobObjectA(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpJobAttributes), lpName);
}

BOOST_FORCEINLINE HANDLE_ open_job_object(DWORD_ dwDesiredAccess, BOOL_ bInheritHandles, LPCSTR_ lpName)
{
    return ::OpenJobObjectA(dwDesiredAccess, bInheritHandles, lpName);
}
#endif // !defined( BOOST_NO_ANSI_APIS )

BOOST_FORCEINLINE HANDLE_ CreateJobObjectW(LPSECURITY_ATTRIBUTES_ lpJobAttributes, LPCWSTR_ lpName)
{
    return ::CreateJobObjectW(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpJobAttributes), lpName);
}

BOOST_FORCEINLINE HANDLE_ create_job_object(LPSECURITY_ATTRIBUTES_ lpJobAttributes, LPCWSTR_ lpName)
{
    return ::CreateJobObjectW(reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpJobAttributes), lpName);
}

BOOST_FORCEINLINE HANDLE_ open_job_object(DWORD_ dwDesiredAccess, BOOL_ bInheritHandles, LPCWSTR_ lpName)
{
    return OpenJobObjectW(dwDesiredAccess, bInheritHandles, lpName);
}

} // namespace winapi
} // namespace detail
} // namespace boost

#endif // BOOST_DETAIL_WINAPI_JOBS_HPP_
