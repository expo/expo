//  pipes.hpp  --------------------------------------------------------------//

//  Copyright 2016 Klemens D. Morgenstern
//  Copyright 2016 Andrey Semashev

//  Distributed under the Boost Software License, Version 1.0.
//  See http://www.boost.org/LICENSE_1_0.txt

#ifndef BOOST_DETAIL_WINAPI_PIPES_HPP_
#define BOOST_DETAIL_WINAPI_PIPES_HPP_

#include <boost/detail/winapi/basic_types.hpp>
#include <boost/detail/winapi/config.hpp>
#include <boost/detail/winapi/overlapped.hpp>
#include <boost/predef/platform.h>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#if BOOST_PLAT_WINDOWS_DESKTOP

#if !defined( BOOST_USE_WINDOWS_H )
extern "C" {

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI ImpersonateNamedPipeClient(
    boost::detail::winapi::HANDLE_ hNamedPipe);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI CreatePipe(
    boost::detail::winapi::PHANDLE_ hReadPipe,
    boost::detail::winapi::PHANDLE_ hWritePipe,
    _SECURITY_ATTRIBUTES* lpPipeAttributes,
    boost::detail::winapi::DWORD_ nSize);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI ConnectNamedPipe(
    boost::detail::winapi::HANDLE_ hNamedPipe,
    _OVERLAPPED* lpOverlapped);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI DisconnectNamedPipe(
    boost::detail::winapi::HANDLE_ hNamedPipe);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI SetNamedPipeHandleState(
    boost::detail::winapi::HANDLE_ hNamedPipe,
    boost::detail::winapi::LPDWORD_ lpMode,
    boost::detail::winapi::LPDWORD_ lpMaxCollectionCount,
    boost::detail::winapi::LPDWORD_ lpCollectDataTimeout);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI PeekNamedPipe(
    boost::detail::winapi::HANDLE_ hNamedPipe,
    boost::detail::winapi::LPVOID_ lpBuffer,
    boost::detail::winapi::DWORD_ nBufferSize,
    boost::detail::winapi::LPDWORD_ lpBytesRead,
    boost::detail::winapi::LPDWORD_ lpTotalBytesAvail,
    boost::detail::winapi::LPDWORD_ lpBytesLeftThisMessage);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI TransactNamedPipe(
    boost::detail::winapi::HANDLE_ hNamedPipe,
    boost::detail::winapi::LPVOID_ lpInBuffer,
    boost::detail::winapi::DWORD_ nInBufferSize,
    boost::detail::winapi::LPVOID_ lpOutBuffer,
    boost::detail::winapi::DWORD_ nOutBufferSize,
    boost::detail::winapi::LPDWORD_ lpBytesRead,
    _OVERLAPPED* lpOverlapped);

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI CreateNamedPipeA(
    boost::detail::winapi::LPCSTR_ lpName,
    boost::detail::winapi::DWORD_ dwOpenMode,
    boost::detail::winapi::DWORD_ dwPipeMode,
    boost::detail::winapi::DWORD_ nMaxInstances,
    boost::detail::winapi::DWORD_ nOutBufferSize,
    boost::detail::winapi::DWORD_ nInBufferSize,
    boost::detail::winapi::DWORD_ nDefaultTimeOut,
    _SECURITY_ATTRIBUTES *lpSecurityAttributes);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI WaitNamedPipeA(
    boost::detail::winapi::LPCSTR_ lpNamedPipeName,
    boost::detail::winapi::DWORD_ nTimeOut);
#endif // !defined( BOOST_NO_ANSI_APIS )

BOOST_SYMBOL_IMPORT boost::detail::winapi::HANDLE_ WINAPI CreateNamedPipeW(
    boost::detail::winapi::LPCWSTR_ lpName,
    boost::detail::winapi::DWORD_ dwOpenMode,
    boost::detail::winapi::DWORD_ dwPipeMode,
    boost::detail::winapi::DWORD_ nMaxInstances,
    boost::detail::winapi::DWORD_ nOutBufferSize,
    boost::detail::winapi::DWORD_ nInBufferSize,
    boost::detail::winapi::DWORD_ nDefaultTimeOut,
    _SECURITY_ATTRIBUTES* lpSecurityAttributes);

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI WaitNamedPipeW(
    boost::detail::winapi::LPCWSTR_ lpNamedPipeName,
    boost::detail::winapi::DWORD_ nTimeOut);

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
#if !defined( BOOST_NO_ANSI_APIS )
BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI GetNamedPipeClientComputerNameA(
    boost::detail::winapi::HANDLE_ Pipe,
    boost::detail::winapi::LPSTR_ ClientComputerName,
    boost::detail::winapi::ULONG_ ClientComputerNameLength);
#endif // !defined( BOOST_NO_ANSI_APIS )

BOOST_SYMBOL_IMPORT boost::detail::winapi::BOOL_ WINAPI GetNamedPipeClientComputerNameW(
    boost::detail::winapi::HANDLE_ Pipe,
    boost::detail::winapi::LPWSTR_ ClientComputerName,
    boost::detail::winapi::ULONG_ ClientComputerNameLength);
#endif

} // extern "C"
#endif // !defined( BOOST_USE_WINDOWS_H )

namespace boost {
namespace detail {
namespace winapi {

#if defined( BOOST_USE_WINDOWS_H )

const DWORD_ PIPE_ACCESS_DUPLEX_ = PIPE_ACCESS_DUPLEX;
const DWORD_ PIPE_ACCESS_INBOUND_ = PIPE_ACCESS_INBOUND;
const DWORD_ PIPE_ACCESS_OUTBOUND_ = PIPE_ACCESS_OUTBOUND;

const DWORD_ PIPE_TYPE_BYTE_ = PIPE_TYPE_BYTE;
const DWORD_ PIPE_TYPE_MESSAGE_ = PIPE_TYPE_MESSAGE;

const DWORD_ PIPE_READMODE_BYTE_ = PIPE_READMODE_BYTE;
const DWORD_ PIPE_READMODE_MESSAGE_ = PIPE_READMODE_MESSAGE;

const DWORD_ PIPE_WAIT_ = PIPE_WAIT;
const DWORD_ PIPE_NOWAIT_ = PIPE_NOWAIT;

const DWORD_ PIPE_UNLIMITED_INSTANCES_ = PIPE_UNLIMITED_INSTANCES;

const DWORD_ NMPWAIT_USE_DEFAULT_WAIT_ = NMPWAIT_USE_DEFAULT_WAIT;
const DWORD_ NMPWAIT_NOWAIT_ = NMPWAIT_NOWAIT;
const DWORD_ NMPWAIT_WAIT_FOREVER_ = NMPWAIT_WAIT_FOREVER;

#else // defined( BOOST_USE_WINDOWS_H )

const DWORD_ PIPE_ACCESS_DUPLEX_ = 0x00000003;
const DWORD_ PIPE_ACCESS_INBOUND_ = 0x00000001;
const DWORD_ PIPE_ACCESS_OUTBOUND_ = 0x00000002;

const DWORD_ PIPE_TYPE_BYTE_ = 0x00000000;
const DWORD_ PIPE_TYPE_MESSAGE_ = 0x00000004;

const DWORD_ PIPE_READMODE_BYTE_ = 0x00000000;
const DWORD_ PIPE_READMODE_MESSAGE_ = 0x00000002;

const DWORD_ PIPE_WAIT_ = 0x00000000;
const DWORD_ PIPE_NOWAIT_ = 0x00000001;

const DWORD_ PIPE_UNLIMITED_INSTANCES_ = 255u;

const DWORD_ NMPWAIT_USE_DEFAULT_WAIT_ = 0x00000000;
const DWORD_ NMPWAIT_NOWAIT_ = 0x00000001;
const DWORD_ NMPWAIT_WAIT_FOREVER_ = 0xFFFFFFFF;

#endif // defined( BOOST_USE_WINDOWS_H )

// These constants are not defined in Windows SDK prior to 7.0A
const DWORD_ PIPE_ACCEPT_REMOTE_CLIENTS_ = 0x00000000;
const DWORD_ PIPE_REJECT_REMOTE_CLIENTS_ = 0x00000008;

using ::ImpersonateNamedPipeClient;
using ::DisconnectNamedPipe;
using ::SetNamedPipeHandleState;
using ::PeekNamedPipe;

#if !defined( BOOST_NO_ANSI_APIS )
using ::WaitNamedPipeA;
#endif
using ::WaitNamedPipeW;

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6
#if !defined( BOOST_NO_ANSI_APIS )
using ::GetNamedPipeClientComputerNameA;
#endif // !defined( BOOST_NO_ANSI_APIS )
using ::GetNamedPipeClientComputerNameW;
#endif // BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

BOOST_FORCEINLINE BOOL_ CreatePipe(PHANDLE_ hReadPipe, PHANDLE_ hWritePipe, LPSECURITY_ATTRIBUTES_ lpPipeAttributes, DWORD_ nSize)
{
    return ::CreatePipe(hReadPipe, hWritePipe, reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpPipeAttributes), nSize);
}

BOOST_FORCEINLINE BOOL_ ConnectNamedPipe(HANDLE_ hNamedPipe, LPOVERLAPPED_ lpOverlapped)
{
    return ::ConnectNamedPipe(hNamedPipe, reinterpret_cast< ::_OVERLAPPED* >(lpOverlapped));
}

BOOST_FORCEINLINE BOOL_ TransactNamedPipe(HANDLE_ hNamedPipe, LPVOID_ lpInBuffer, DWORD_ nInBufferSize, LPVOID_ lpOutBuffer, DWORD_ nOutBufferSize, LPDWORD_ lpBytesRead, LPOVERLAPPED_ lpOverlapped)
{
    return ::TransactNamedPipe(hNamedPipe, lpInBuffer, nInBufferSize, lpOutBuffer, nOutBufferSize, lpBytesRead, reinterpret_cast< ::_OVERLAPPED* >(lpOverlapped));
}


#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE HANDLE_ CreateNamedPipeA(
    LPCSTR_ lpName,
    DWORD_ dwOpenMode,
    DWORD_ dwPipeMode,
    DWORD_ nMaxInstances,
    DWORD_ nOutBufferSize,
    DWORD_ nInBufferSize,
    DWORD_ nDefaultTimeOut,
    LPSECURITY_ATTRIBUTES_ lpSecurityAttributes)
{
    return ::CreateNamedPipeA(
        lpName,
        dwOpenMode,
        dwPipeMode,
        nMaxInstances,
        nOutBufferSize,
        nInBufferSize,
        nDefaultTimeOut,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSecurityAttributes));
}

BOOST_FORCEINLINE HANDLE_ create_named_pipe(
    LPCSTR_ lpName,
    DWORD_ dwOpenMode,
    DWORD_ dwPipeMode,
    DWORD_ nMaxInstances,
    DWORD_ nOutBufferSize,
    DWORD_ nInBufferSize,
    DWORD_ nDefaultTimeOut,
    LPSECURITY_ATTRIBUTES_ lpSecurityAttributes)
{
    return ::CreateNamedPipeA(
        lpName,
        dwOpenMode,
        dwPipeMode,
        nMaxInstances,
        nOutBufferSize,
        nInBufferSize,
        nDefaultTimeOut,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSecurityAttributes));
}
#endif // !defined( BOOST_NO_ANSI_APIS )

BOOST_FORCEINLINE HANDLE_ CreateNamedPipeW(
    LPCWSTR_ lpName,
    DWORD_ dwOpenMode,
    DWORD_ dwPipeMode,
    DWORD_ nMaxInstances,
    DWORD_ nOutBufferSize,
    DWORD_ nInBufferSize,
    DWORD_ nDefaultTimeOut,
    LPSECURITY_ATTRIBUTES_ lpSecurityAttributes)
{
    return ::CreateNamedPipeW(
        lpName,
        dwOpenMode,
        dwPipeMode,
        nMaxInstances,
        nOutBufferSize,
        nInBufferSize,
        nDefaultTimeOut,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSecurityAttributes));
}

BOOST_FORCEINLINE HANDLE_ create_named_pipe(
    LPCWSTR_ lpName,
    DWORD_ dwOpenMode,
    DWORD_ dwPipeMode,
    DWORD_ nMaxInstances,
    DWORD_ nOutBufferSize,
    DWORD_ nInBufferSize,
    DWORD_ nDefaultTimeOut,
    LPSECURITY_ATTRIBUTES_ lpSecurityAttributes)
{
    return ::CreateNamedPipeW(
        lpName,
        dwOpenMode,
        dwPipeMode,
        nMaxInstances,
        nOutBufferSize,
        nInBufferSize,
        nDefaultTimeOut,
        reinterpret_cast< ::_SECURITY_ATTRIBUTES* >(lpSecurityAttributes));
}

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE BOOL_ wait_named_pipe(LPCSTR_ lpNamedPipeName, DWORD_ nTimeOut)
{
    return ::WaitNamedPipeA(lpNamedPipeName, nTimeOut);
}
#endif //BOOST_NO_ANSI_APIS

BOOST_FORCEINLINE BOOL_ wait_named_pipe(LPCWSTR_ lpNamedPipeName, DWORD_ nTimeOut)
{
    return ::WaitNamedPipeW(lpNamedPipeName, nTimeOut);
}

#if BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

#if !defined( BOOST_NO_ANSI_APIS )
BOOST_FORCEINLINE BOOL_ get_named_pipe_client_computer_name(HANDLE_ Pipe, LPSTR_ ClientComputerName, ULONG_ ClientComputerNameLength)
{
    return ::GetNamedPipeClientComputerNameA(Pipe, ClientComputerName, ClientComputerNameLength);
}
#endif // !defined( BOOST_NO_ANSI_APIS )

BOOST_FORCEINLINE BOOL_ get_named_pipe_client_computer_name(HANDLE_ Pipe, LPWSTR_ ClientComputerName, ULONG_ ClientComputerNameLength)
{
    return ::GetNamedPipeClientComputerNameW(Pipe, ClientComputerName, ClientComputerNameLength);
}

#endif // BOOST_USE_WINAPI_VERSION >= BOOST_WINAPI_VERSION_WIN6

}
}
}

#endif // BOOST_PLAT_WINDOWS_DESKTOP

#endif // BOOST_DETAIL_WINAPI_PIPES_HPP_
