//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2015. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/interprocess for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_INTERPROCESS_DETAIL_WORKAROUND_HPP
#define BOOST_INTERPROCESS_DETAIL_WORKAROUND_HPP

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif
#
#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

#if defined(_WIN32) || defined(__WIN32__) || defined(WIN32)
   #define BOOST_INTERPROCESS_WINDOWS
   #define BOOST_INTERPROCESS_FORCE_GENERIC_EMULATION
   #define BOOST_INTERPROCESS_HAS_KERNEL_BOOTTIME
   //Define this to connect with shared memory created with versions < 1.54
   //#define BOOST_INTERPROCESS_BOOTSTAMP_IS_LASTBOOTUPTIME
#else
   #include <unistd.h>

   //////////////////////////////////////////////////////
   //Check for XSI shared memory objects. They are available in nearly all UNIX platforms
   //////////////////////////////////////////////////////
   #if !defined(__QNXNTO__) && !defined(__ANDROID__) && !defined(__HAIKU__)
      #define BOOST_INTERPROCESS_XSI_SHARED_MEMORY_OBJECTS
   #endif

   //////////////////////////////////////////////////////
   // From SUSv3/UNIX 98, pthread_mutexattr_settype is mandatory
   //////////////////////////////////////////////////////
   #if defined(_XOPEN_UNIX) && ((_XOPEN_VERSION + 0) >= 500)
      #define BOOST_INTERPROCESS_POSIX_RECURSIVE_MUTEXES
   #endif

   //////////////////////////////////////////////////////
   // _POSIX_THREAD_PROCESS_SHARED (POSIX.1b/POSIX.4)
   //////////////////////////////////////////////////////
   #if defined(_POSIX_THREAD_PROCESS_SHARED) && ((_POSIX_THREAD_PROCESS_SHARED + 0) > 0)
      //Cygwin defines _POSIX_THREAD_PROCESS_SHARED but does not implement it.
      #if defined(__CYGWIN__)
         #define BOOST_INTERPROCESS_BUGGY_POSIX_PROCESS_SHARED
      //Mac Os X < Lion (10.7) might define _POSIX_THREAD_PROCESS_SHARED but there is no real support.
      #elif defined(__APPLE__)
         #include "TargetConditionals.h"
         //Check we're on Mac OS target
         #if defined(TARGET_OS_MAC)
            #include "AvailabilityMacros.h"
            //If minimum target for this compilation is older than Mac Os Lion, then we are out of luck
            #if MAC_OS_X_VERSION_MIN_REQUIRED < 1070
               #define BOOST_INTERPROCESS_BUGGY_POSIX_PROCESS_SHARED
            #endif
         #endif
      #endif

      //If buggy _POSIX_THREAD_PROCESS_SHARED is detected avoid using it
      #if defined(BOOST_INTERPROCESS_BUGGY_POSIX_PROCESS_SHARED)
         #undef BOOST_INTERPROCESS_BUGGY_POSIX_PROCESS_SHARED
      #else
         #define BOOST_INTERPROCESS_POSIX_PROCESS_SHARED
      #endif
   #endif

   //////////////////////////////////////////////////////
   // _POSIX_SHARED_MEMORY_OBJECTS (POSIX.1b/POSIX.4)
   //////////////////////////////////////////////////////
   #if ( defined(_POSIX_SHARED_MEMORY_OBJECTS) && ((_POSIX_SHARED_MEMORY_OBJECTS + 0) > 0) ) ||\
         (defined(__vms) && __CRTL_VER >= 70200000)
      #define BOOST_INTERPROCESS_POSIX_SHARED_MEMORY_OBJECTS
      //Some systems have filesystem-based resources, so the
      //portable "/shmname" format does not work due to permission issues
      //For those systems we need to form a path to a temporary directory:
      //          hp-ux               tru64               vms               freebsd
      #if defined(__hpux) || defined(__osf__) || defined(__vms) || (defined(__FreeBSD__) && (__FreeBSD__ < 7))
         #define BOOST_INTERPROCESS_FILESYSTEM_BASED_POSIX_SHARED_MEMORY
      //Some systems have "jailed" environments where shm usage is restricted at runtime
      //and temporary file based shm is possible in those executions.
      #elif defined(__FreeBSD__)
         #define BOOST_INTERPROCESS_RUNTIME_FILESYSTEM_BASED_POSIX_SHARED_MEMORY
      #endif
   #endif

   //////////////////////////////////////////////////////
   // _POSIX_MAPPED_FILES (POSIX.1b/POSIX.4)
   //////////////////////////////////////////////////////
   #if defined(_POSIX_MAPPED_FILES) && ((_POSIX_MAPPED_FILES + 0) > 0)
      #define BOOST_INTERPROCESS_POSIX_MAPPED_FILES
   #endif

   //////////////////////////////////////////////////////
   // _POSIX_SEMAPHORES (POSIX.1b/POSIX.4)
   //////////////////////////////////////////////////////
   #if ( defined(_POSIX_SEMAPHORES) && ((_POSIX_SEMAPHORES + 0) > 0) ) ||\
       ( defined(__FreeBSD__) && (__FreeBSD__ >= 4)) || \
         defined(__APPLE__)
      #define BOOST_INTERPROCESS_POSIX_NAMED_SEMAPHORES
      //MacOsX declares _POSIX_SEMAPHORES but sem_init returns ENOSYS
      #if !defined(__APPLE__)
         #define BOOST_INTERPROCESS_POSIX_UNNAMED_SEMAPHORES
      #endif
      #if defined(__osf__) || defined(__vms)
         #define BOOST_INTERPROCESS_FILESYSTEM_BASED_POSIX_SEMAPHORES
      #endif
   #endif

   //////////////////////////////////////////////////////
   // _POSIX_BARRIERS (SUSv3/Unix03)
   //////////////////////////////////////////////////////
   #if defined(_POSIX_BARRIERS) && ((_POSIX_BARRIERS + 0) >= 200112L)
      #define BOOST_INTERPROCESS_POSIX_BARRIERS
   #endif

   //////////////////////////////////////////////////////
   // _POSIX_TIMEOUTS (SUSv3/Unix03)
   //////////////////////////////////////////////////////
   #if defined(_POSIX_TIMEOUTS) && ((_POSIX_TIMEOUTS + 0L) >= 200112L)
      #define BOOST_INTERPROCESS_POSIX_TIMEOUTS
   #endif

   //////////////////////////////////////////////////////
   // Detect BSD derivatives to detect sysctl
   //////////////////////////////////////////////////////
   #if defined(__FreeBSD__) || defined(__NetBSD__) || defined(__OpenBSD__) || defined(__APPLE__)
      #define BOOST_INTERPROCESS_BSD_DERIVATIVE
      //Some *BSD systems (OpenBSD & NetBSD) need sys/param.h before sys/sysctl.h, whereas
      //others (FreeBSD & Darwin) need sys/types.h
      #include <sys/types.h>
      #include <sys/param.h>
      #include <sys/sysctl.h>
      #if defined(CTL_KERN) && defined (KERN_BOOTTIME)
         //#define BOOST_INTERPROCESS_HAS_KERNEL_BOOTTIME
      #endif
   #endif

   //////////////////////////////////////////////////////
   //64 bit offset
   //////////////////////////////////////////////////////
   #if (defined (_V6_ILP32_OFFBIG)  &&(_V6_ILP32_OFFBIG   - 0 > 0)) ||\
       (defined (_V6_LP64_OFF64)    &&(_V6_LP64_OFF64     - 0 > 0)) ||\
       (defined (_V6_LPBIG_OFFBIG)  &&(_V6_LPBIG_OFFBIG   - 0 > 0)) ||\
       (defined (_XBS5_ILP32_OFFBIG)&&(_XBS5_ILP32_OFFBIG - 0 > 0)) ||\
       (defined (_XBS5_LP64_OFF64)  &&(_XBS5_LP64_OFF64   - 0 > 0)) ||\
       (defined (_XBS5_LPBIG_OFFBIG)&&(_XBS5_LPBIG_OFFBIG - 0 > 0)) ||\
       (defined (_FILE_OFFSET_BITS) &&(_FILE_OFFSET_BITS  - 0 >= 64))||\
       (defined (_FILE_OFFSET_BITS) &&(_FILE_OFFSET_BITS  - 0 >= 64))
      #define BOOST_INTERPROCESS_UNIX_64_BIT_OR_BIGGER_OFF_T
   #endif
#endif   //!defined(BOOST_INTERPROCESS_WINDOWS)

#if defined(BOOST_INTERPROCESS_WINDOWS) || defined(BOOST_INTERPROCESS_POSIX_MAPPED_FILES)
#  define BOOST_INTERPROCESS_MAPPED_FILES
#endif

//Now declare some Boost.Interprocess features depending on the implementation
#if defined(BOOST_INTERPROCESS_POSIX_NAMED_SEMAPHORES) && !defined(BOOST_INTERPROCESS_POSIX_SEMAPHORES_NO_UNLINK)
   #define BOOST_INTERPROCESS_NAMED_MUTEX_USES_POSIX_SEMAPHORES
   #define BOOST_INTERPROCESS_NAMED_SEMAPHORE_USES_POSIX_SEMAPHORES
#endif

#if    !defined(BOOST_NO_CXX11_RVALUE_REFERENCES) && !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
   #define BOOST_INTERPROCESS_PERFECT_FORWARDING
#endif

// Timeout duration use if BOOST_INTERPROCESS_ENABLE_TIMEOUT_WHEN_LOCKING is set
#ifndef BOOST_INTERPROCESS_TIMEOUT_WHEN_LOCKING_DURATION_MS
   #define BOOST_INTERPROCESS_TIMEOUT_WHEN_LOCKING_DURATION_MS 10000
#endif

//Other switches
//BOOST_INTERPROCESS_MSG_QUEUE_USES_CIRC_INDEX
//message queue uses a circular queue as index instead of an array (better performance)
//Boost version < 1.52 uses an array, so undef this if you want to communicate
//with processes compiled with those versions.
#define BOOST_INTERPROCESS_MSG_QUEUE_CIRCULAR_INDEX

//Macros for documentation purposes. For code, expands to the argument
#define BOOST_INTERPROCESS_IMPDEF(TYPE) TYPE
#define BOOST_INTERPROCESS_SEEDOC(TYPE) TYPE
#define BOOST_INTERPROCESS_DOC1ST(TYPE1, TYPE2) TYPE2
#define BOOST_INTERPROCESS_I ,
#define BOOST_INTERPROCESS_DOCIGN(T1) T1

//#define BOOST_INTERPROCESS_DISABLE_FORCEINLINE

#if defined(BOOST_INTERPROCESS_DISABLE_FORCEINLINE)
   #define BOOST_INTERPROCESS_FORCEINLINE inline
#elif defined(BOOST_INTERPROCESS_FORCEINLINE_IS_BOOST_FORCELINE)
   #define BOOST_INTERPROCESS_FORCEINLINE BOOST_FORCEINLINE
#elif defined(BOOST_MSVC) && defined(_DEBUG)
   //"__forceinline" and MSVC seems to have some bugs in debug mode
   #define BOOST_INTERPROCESS_FORCEINLINE inline
#elif defined(__GNUC__) && ((__GNUC__ < 4) || (__GNUC__ == 4 && (__GNUC_MINOR__ < 5)))
   //Older GCCs have problems with forceinline
   #define BOOST_INTERPROCESS_FORCEINLINE inline
#else
   #define BOOST_INTERPROCESS_FORCEINLINE BOOST_FORCEINLINE
#endif

#endif   //#ifndef BOOST_INTERPROCESS_DETAIL_WORKAROUND_HPP
