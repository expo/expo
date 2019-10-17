#ifndef BOOST_WIN32_THREAD_PRIMITIVES_HPP
#define BOOST_WIN32_THREAD_PRIMITIVES_HPP

//  win32_thread_primitives.hpp
//
//  (C) Copyright 2005-7 Anthony Williams
//  (C) Copyright 2007 David Deakins
//
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

#include <boost/thread/detail/config.hpp>
#include <boost/predef/platform.h>
#include <boost/throw_exception.hpp>
#include <boost/assert.hpp>
#include <boost/thread/exceptions.hpp>
#include <boost/detail/interlocked.hpp>
#include <boost/detail/winapi/config.hpp>
//#include <boost/detail/winapi/synchronization.hpp>
#include <algorithm>

#if BOOST_PLAT_WINDOWS_RUNTIME
#include <thread>
#endif

#if defined( BOOST_USE_WINDOWS_H )
# include <windows.h>

namespace boost
{
    namespace detail
    {
        namespace win32
        {
            typedef HANDLE handle;
            typedef SYSTEM_INFO system_info;
            typedef unsigned __int64 ticks_type;
            typedef FARPROC farproc_t;
            unsigned const infinite=INFINITE;
            unsigned const timeout=WAIT_TIMEOUT;
            handle const invalid_handle_value=INVALID_HANDLE_VALUE;
            unsigned const event_modify_state=EVENT_MODIFY_STATE;
            unsigned const synchronize=SYNCHRONIZE;
            unsigned const wait_abandoned=WAIT_ABANDONED;
            unsigned const create_event_initial_set = 0x00000002;
            unsigned const create_event_manual_reset = 0x00000001;
            unsigned const event_all_access = EVENT_ALL_ACCESS;
            unsigned const semaphore_all_access = SEMAPHORE_ALL_ACCESS;


# ifdef BOOST_NO_ANSI_APIS
# if BOOST_USE_WINAPI_VERSION < BOOST_WINAPI_VERSION_VISTA
            using ::CreateMutexW;
            using ::CreateEventW;
            using ::CreateSemaphoreW;
# else
            using ::CreateMutexExW;
            using ::CreateEventExW;
            using ::CreateSemaphoreExW;
# endif
            using ::OpenEventW;
            using ::GetModuleHandleW;
# else
            using ::CreateMutexA;
            using ::CreateEventA;
            using ::OpenEventA;
            using ::CreateSemaphoreA;
            using ::GetModuleHandleA;
# endif
#if BOOST_PLAT_WINDOWS_RUNTIME
            using ::GetNativeSystemInfo;
            using ::GetTickCount64;
#else
            using ::GetSystemInfo;
            using ::GetTickCount;
#endif
            using ::CloseHandle;
            using ::ReleaseMutex;
            using ::ReleaseSemaphore;
            using ::SetEvent;
            using ::ResetEvent;
            using ::WaitForMultipleObjectsEx;
            using ::WaitForSingleObjectEx;
            using ::GetCurrentProcessId;
            using ::GetCurrentThreadId;
            using ::GetCurrentThread;
            using ::GetCurrentProcess;
            using ::DuplicateHandle;
#if !BOOST_PLAT_WINDOWS_RUNTIME
            using ::SleepEx;
            using ::Sleep;
            using ::QueueUserAPC;
            using ::GetProcAddress;
#endif
        }
    }
}
#elif defined( WIN32 ) || defined( _WIN32 ) || defined( __WIN32__ )

# ifdef UNDER_CE
#  ifndef WINAPI
#   ifndef _WIN32_WCE_EMULATION
#    define WINAPI  __cdecl     // Note this doesn't match the desktop definition
#   else
#    define WINAPI  __stdcall
#   endif
#  endif

#  ifdef __cplusplus
extern "C" {
#  endif
typedef int BOOL;
typedef unsigned long DWORD;
typedef void* HANDLE;
#  include <kfuncs.h>
#  ifdef __cplusplus
}
#  endif
# endif

# ifdef __cplusplus
extern "C" {
# endif
struct _SYSTEM_INFO;
# ifdef __cplusplus
}
#endif

namespace boost
{
    namespace detail
    {
        namespace win32
        {
# ifdef _WIN64
            typedef unsigned __int64 ulong_ptr;
# else
            typedef unsigned long ulong_ptr;
# endif
            typedef void* handle;
            typedef _SYSTEM_INFO system_info;
            typedef unsigned __int64 ticks_type;
            typedef int (__stdcall *farproc_t)();
            unsigned const infinite=~0U;
            unsigned const timeout=258U;
            handle const invalid_handle_value=(handle)(-1);
            unsigned const event_modify_state=2;
            unsigned const synchronize=0x100000u;
            unsigned const wait_abandoned=0x00000080u;
            unsigned const create_event_initial_set = 0x00000002;
            unsigned const create_event_manual_reset = 0x00000001;
            unsigned const event_all_access = 0x1F0003;
            unsigned const semaphore_all_access = 0x1F0003;

            extern "C"
            {
                struct _SECURITY_ATTRIBUTES;
# ifdef BOOST_NO_ANSI_APIS
# if BOOST_USE_WINAPI_VERSION < BOOST_WINAPI_VERSION_VISTA
                __declspec(dllimport) void* __stdcall CreateMutexW(_SECURITY_ATTRIBUTES*,int,wchar_t const*);
                __declspec(dllimport) void* __stdcall CreateSemaphoreW(_SECURITY_ATTRIBUTES*,long,long,wchar_t const*);
                __declspec(dllimport) void* __stdcall CreateEventW(_SECURITY_ATTRIBUTES*,int,int,wchar_t const*);
# else
                __declspec(dllimport) void* __stdcall CreateMutexExW(_SECURITY_ATTRIBUTES*,wchar_t const*,unsigned long,unsigned long);
                __declspec(dllimport) void* __stdcall CreateEventExW(_SECURITY_ATTRIBUTES*,wchar_t const*,unsigned long,unsigned long);
                __declspec(dllimport) void* __stdcall CreateSemaphoreExW(_SECURITY_ATTRIBUTES*,long,long,wchar_t const*,unsigned long,unsigned long);
# endif
                __declspec(dllimport) void* __stdcall OpenEventW(unsigned long,int,wchar_t const*);
                __declspec(dllimport) void* __stdcall GetModuleHandleW(wchar_t const*);
# else
                __declspec(dllimport) void* __stdcall CreateMutexA(_SECURITY_ATTRIBUTES*,int,char const*);
                __declspec(dllimport) void* __stdcall CreateSemaphoreA(_SECURITY_ATTRIBUTES*,long,long,char const*);
                __declspec(dllimport) void* __stdcall CreateEventA(_SECURITY_ATTRIBUTES*,int,int,char const*);
                __declspec(dllimport) void* __stdcall OpenEventA(unsigned long,int,char const*);
                __declspec(dllimport) void* __stdcall GetModuleHandleA(char const*);
# endif
#if BOOST_PLAT_WINDOWS_RUNTIME
                __declspec(dllimport) void __stdcall GetNativeSystemInfo(_SYSTEM_INFO*);
                __declspec(dllimport) ticks_type __stdcall GetTickCount64();
#else
                __declspec(dllimport) void __stdcall GetSystemInfo(_SYSTEM_INFO*);
                __declspec(dllimport) unsigned long __stdcall GetTickCount();
#endif
                __declspec(dllimport) int __stdcall CloseHandle(void*);
                __declspec(dllimport) int __stdcall ReleaseMutex(void*);
                __declspec(dllimport) unsigned long __stdcall WaitForSingleObjectEx(void*,unsigned long,int);
                __declspec(dllimport) unsigned long __stdcall WaitForMultipleObjectsEx(unsigned long nCount,void* const * lpHandles,int bWaitAll,unsigned long dwMilliseconds,int bAlertable);
                __declspec(dllimport) int __stdcall ReleaseSemaphore(void*,long,long*);
                __declspec(dllimport) int __stdcall DuplicateHandle(void*,void*,void*,void**,unsigned long,int,unsigned long);
#if !BOOST_PLAT_WINDOWS_RUNTIME
                __declspec(dllimport) unsigned long __stdcall SleepEx(unsigned long,int);
                __declspec(dllimport) void __stdcall Sleep(unsigned long);
                typedef void (__stdcall *queue_user_apc_callback_function)(ulong_ptr);
                __declspec(dllimport) unsigned long __stdcall QueueUserAPC(queue_user_apc_callback_function,void*,ulong_ptr);
                __declspec(dllimport) farproc_t __stdcall GetProcAddress(void *, const char *);
#endif

# ifndef UNDER_CE
                __declspec(dllimport) unsigned long __stdcall GetCurrentProcessId();
                __declspec(dllimport) unsigned long __stdcall GetCurrentThreadId();
                __declspec(dllimport) void* __stdcall GetCurrentThread();
                __declspec(dllimport) void* __stdcall GetCurrentProcess();
                __declspec(dllimport) int __stdcall SetEvent(void*);
                __declspec(dllimport) int __stdcall ResetEvent(void*);
# else
                using ::GetCurrentProcessId;
                using ::GetCurrentThreadId;
                using ::GetCurrentThread;
                using ::GetCurrentProcess;
                using ::SetEvent;
                using ::ResetEvent;
# endif
            }
        }
    }
}
#else
# error "Win32 functions not available"
#endif

#include <boost/config/abi_prefix.hpp>

namespace boost
{
    namespace detail
    {
        namespace win32
        {
            namespace detail { typedef ticks_type (__stdcall *gettickcount64_t)(); }
#if !BOOST_PLAT_WINDOWS_RUNTIME
            extern "C"
            {
#ifdef _MSC_VER
                long _InterlockedCompareExchange(long volatile *, long, long);
#pragma intrinsic(_InterlockedCompareExchange)
#elif defined(__MINGW64_VERSION_MAJOR)
                long _InterlockedCompareExchange(long volatile *, long, long);
#else
                // Mingw doesn't provide intrinsics
#define _InterlockedCompareExchange InterlockedCompareExchange
#endif
            }
            // Borrowed from https://stackoverflow.com/questions/8211820/userland-interrupt-timer-access-such-as-via-kequeryinterrupttime-or-similar
            inline ticks_type __stdcall GetTickCount64emulation()
            {
                static volatile long count = 0xFFFFFFFF;
                unsigned long previous_count, current_tick32, previous_count_zone, current_tick32_zone;
                ticks_type current_tick64;

                previous_count = (unsigned long) _InterlockedCompareExchange(&count, 0, 0);
                current_tick32 = GetTickCount();

                if(previous_count == 0xFFFFFFFF)
                {
                    // count has never been written
                    unsigned long initial_count;
                    initial_count = current_tick32 >> 28;
                    previous_count = (unsigned long) _InterlockedCompareExchange(&count, initial_count, 0xFFFFFFFF);

                    current_tick64 = initial_count;
                    current_tick64 <<= 28;
                    current_tick64 += current_tick32 & 0x0FFFFFFF;
                    return current_tick64;
                }

                previous_count_zone = previous_count & 15;
                current_tick32_zone = current_tick32 >> 28;

                if(current_tick32_zone == previous_count_zone)
                {
                    // The top four bits of the 32-bit tick count haven't changed since count was last written.
                    current_tick64 = previous_count;
                    current_tick64 <<= 28;
                    current_tick64 += current_tick32 & 0x0FFFFFFF;
                    return current_tick64;
                }

                if(current_tick32_zone == previous_count_zone + 1 || (current_tick32_zone == 0 && previous_count_zone == 15))
                {
                    // The top four bits of the 32-bit tick count have been incremented since count was last written.
                    _InterlockedCompareExchange(&count, previous_count + 1, previous_count);
                    current_tick64 = previous_count + 1;
                    current_tick64 <<= 28;
                    current_tick64 += current_tick32 & 0x0FFFFFFF;
                    return current_tick64;
                }

                // Oops, we weren't called often enough, we're stuck
                return 0xFFFFFFFF;
            }
#else
#endif
            inline detail::gettickcount64_t GetTickCount64_()
            {
                static detail::gettickcount64_t gettickcount64impl;
                if(gettickcount64impl)
                    return gettickcount64impl;

                // GetTickCount and GetModuleHandle are not allowed in the Windows Runtime,
                // and kernel32 isn't used in Windows Phone.
#if BOOST_PLAT_WINDOWS_RUNTIME
                gettickcount64impl = &GetTickCount64;
#else
                farproc_t addr=GetProcAddress(
#if !defined(BOOST_NO_ANSI_APIS)
                    GetModuleHandleA("KERNEL32.DLL"),
#else
                    GetModuleHandleW(L"KERNEL32.DLL"),
#endif
                    "GetTickCount64");
                if(addr)
                    gettickcount64impl=(detail::gettickcount64_t) addr;
                else
                    gettickcount64impl=&GetTickCount64emulation;
#endif
                return gettickcount64impl;
            }

            enum event_type
            {
                auto_reset_event=false,
                manual_reset_event=true
            };

            enum initial_event_state
            {
                event_initially_reset=false,
                event_initially_set=true
            };

            inline handle create_event(
#if !defined(BOOST_NO_ANSI_APIS)
                const char *mutex_name,
#else
                const wchar_t *mutex_name,
#endif
                event_type type,
                initial_event_state state)
            {
#if !defined(BOOST_NO_ANSI_APIS)
                handle const res = win32::CreateEventA(0, type, state, mutex_name);
#elif BOOST_USE_WINAPI_VERSION < BOOST_WINAPI_VERSION_VISTA
                handle const res = win32::CreateEventW(0, type, state, mutex_name);
#else
                handle const res = win32::CreateEventExW(
                    0,
                    mutex_name,
                    type ? create_event_manual_reset : 0 | state ? create_event_initial_set : 0,
                    event_all_access);
#endif
                return res;
            }

            inline handle create_anonymous_event(event_type type,initial_event_state state)
            {
                handle const res = create_event(0, type, state);
                if(!res)
                {
                    boost::throw_exception(thread_resource_error());
                }
                return res;
            }

            inline handle create_anonymous_semaphore_nothrow(long initial_count,long max_count)
            {
#if !defined(BOOST_NO_ANSI_APIS)
                handle const res=win32::CreateSemaphoreA(0,initial_count,max_count,0);
#else
#if BOOST_USE_WINAPI_VERSION < BOOST_WINAPI_VERSION_VISTA
                handle const res=win32::CreateSemaphoreEx(0,initial_count,max_count,0,0);
#else
                handle const res=win32::CreateSemaphoreExW(0,initial_count,max_count,0,0,semaphore_all_access);
#endif
#endif
                return res;
            }

            inline handle create_anonymous_semaphore(long initial_count,long max_count)
            {
                handle const res=create_anonymous_semaphore_nothrow(initial_count,max_count);
                if(!res)
                {
                    boost::throw_exception(thread_resource_error());
                }
                return res;
            }

            inline handle duplicate_handle(handle source)
            {
                handle const current_process=GetCurrentProcess();
                long const same_access_flag=2;
                handle new_handle=0;
                bool const success=DuplicateHandle(current_process,source,current_process,&new_handle,0,false,same_access_flag)!=0;
                if(!success)
                {
                    boost::throw_exception(thread_resource_error());
                }
                return new_handle;
            }

            inline void release_semaphore(handle semaphore,long count)
            {
                BOOST_VERIFY(ReleaseSemaphore(semaphore,count,0)!=0);
            }

            inline void get_system_info(system_info *info)
            {
#if BOOST_PLAT_WINDOWS_RUNTIME
                win32::GetNativeSystemInfo(info);
#else
                win32::GetSystemInfo(info);
#endif
            }

            inline void sleep(unsigned long milliseconds)
            {
                if(milliseconds == 0)
                {
#if BOOST_PLAT_WINDOWS_RUNTIME
                    std::this_thread::yield();
#else
                    ::boost::detail::win32::Sleep(0);
#endif
                }
                else
                {
#if BOOST_PLAT_WINDOWS_RUNTIME
                    ::boost::detail::win32::WaitForSingleObjectEx(::boost::detail::win32::GetCurrentThread(), milliseconds, 0);
#else
                    ::boost::detail::win32::Sleep(milliseconds);
#endif
                }
            }

#if BOOST_PLAT_WINDOWS_RUNTIME
            class BOOST_THREAD_DECL scoped_winrt_thread
            {
            public:
                scoped_winrt_thread() : m_completionHandle(invalid_handle_value)
                {}

                ~scoped_winrt_thread()
                {
                    if (m_completionHandle != ::boost::detail::win32::invalid_handle_value)
                    {
                        CloseHandle(m_completionHandle);
                    }
                }

                typedef unsigned(__stdcall * thread_func)(void *);
                bool start(thread_func address, void *parameter, unsigned int *thrdId);

                handle waitable_handle() const
                {
                    BOOST_ASSERT(m_completionHandle != ::boost::detail::win32::invalid_handle_value);
                    return m_completionHandle;
                }

            private:
                handle m_completionHandle;
            };
#endif
            class BOOST_THREAD_DECL handle_manager
            {
            private:
                handle handle_to_manage;
                handle_manager(handle_manager&);
                handle_manager& operator=(handle_manager&);

                void cleanup()
                {
                    if(handle_to_manage && handle_to_manage!=invalid_handle_value)
                    {
                        BOOST_VERIFY(CloseHandle(handle_to_manage));
                    }
                }

            public:
                explicit handle_manager(handle handle_to_manage_):
                    handle_to_manage(handle_to_manage_)
                {}
                handle_manager():
                    handle_to_manage(0)
                {}

                handle_manager& operator=(handle new_handle)
                {
                    cleanup();
                    handle_to_manage=new_handle;
                    return *this;
                }

                operator handle() const
                {
                    return handle_to_manage;
                }

                handle duplicate() const
                {
                    return duplicate_handle(handle_to_manage);
                }

                void swap(handle_manager& other)
                {
                    std::swap(handle_to_manage,other.handle_to_manage);
                }

                handle release()
                {
                    handle const res=handle_to_manage;
                    handle_to_manage=0;
                    return res;
                }

                bool operator!() const
                {
                    return !handle_to_manage;
                }

                ~handle_manager()
                {
                    cleanup();
                }
            };
        }
    }
}

#if defined(BOOST_MSVC) && (_MSC_VER>=1400)  && !defined(UNDER_CE)

namespace boost
{
    namespace detail
    {
        namespace win32
        {
#if _MSC_VER==1400
            extern "C" unsigned char _interlockedbittestandset(long *a,long b);
            extern "C" unsigned char _interlockedbittestandreset(long *a,long b);
#else
            extern "C" unsigned char _interlockedbittestandset(volatile long *a,long b);
            extern "C" unsigned char _interlockedbittestandreset(volatile long *a,long b);
#endif

#pragma intrinsic(_interlockedbittestandset)
#pragma intrinsic(_interlockedbittestandreset)

            inline bool interlocked_bit_test_and_set(long* x,long bit)
            {
                return _interlockedbittestandset(x,bit)!=0;
            }

            inline bool interlocked_bit_test_and_reset(long* x,long bit)
            {
                return _interlockedbittestandreset(x,bit)!=0;
            }

        }
    }
}
#define BOOST_THREAD_BTS_DEFINED
#elif (defined(BOOST_MSVC) || defined(BOOST_INTEL_WIN)) && defined(_M_IX86)
namespace boost
{
    namespace detail
    {
        namespace win32
        {
            inline bool interlocked_bit_test_and_set(long* x,long bit)
            {
#ifndef BOOST_INTEL_CXX_VERSION
                __asm {
                    mov eax,bit;
                    mov edx,x;
                    lock bts [edx],eax;
                    setc al;
                };
#else
                bool ret;
                __asm {
                    mov eax,bit
                    mov edx,x
                    lock bts [edx],eax
                    setc al
                    mov ret, al
                };
                return ret;

#endif
            }

            inline bool interlocked_bit_test_and_reset(long* x,long bit)
            {
#ifndef BOOST_INTEL_CXX_VERSION
                __asm {
                    mov eax,bit;
                    mov edx,x;
                    lock btr [edx],eax;
                    setc al;
                };
#else
                bool ret;
                __asm {
                    mov eax,bit
                    mov edx,x
                    lock btr [edx],eax
                    setc al
                    mov ret, al
                };
                return ret;

#endif
            }

        }
    }
}
#define BOOST_THREAD_BTS_DEFINED
#endif

#ifndef BOOST_THREAD_BTS_DEFINED

namespace boost
{
    namespace detail
    {
        namespace win32
        {
            inline bool interlocked_bit_test_and_set(long* x,long bit)
            {
                long const value=1<<bit;
                long old=*x;
                do
                {
                    long const current=BOOST_INTERLOCKED_COMPARE_EXCHANGE(x,old|value,old);
                    if(current==old)
                    {
                        break;
                    }
                    old=current;
                }
                while(true) ;
                return (old&value)!=0;
            }

            inline bool interlocked_bit_test_and_reset(long* x,long bit)
            {
                long const value=1<<bit;
                long old=*x;
                do
                {
                    long const current=BOOST_INTERLOCKED_COMPARE_EXCHANGE(x,old&~value,old);
                    if(current==old)
                    {
                        break;
                    }
                    old=current;
                }
                while(true) ;
                return (old&value)!=0;
            }
        }
    }
}
#endif

#include <boost/config/abi_suffix.hpp>

#endif
