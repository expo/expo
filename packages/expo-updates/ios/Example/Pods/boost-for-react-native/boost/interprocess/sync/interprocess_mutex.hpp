//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2012. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/interprocess for documentation.
//
//////////////////////////////////////////////////////////////////////////////
//
// Parts of the pthread code come from Boost Threads code.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_INTERPROCESS_MUTEX_HPP
#define BOOST_INTERPROCESS_MUTEX_HPP

#if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif
#
#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

#include <boost/interprocess/detail/config_begin.hpp>
#include <boost/interprocess/exceptions.hpp>
#include <boost/interprocess/detail/workaround.hpp>
#include <boost/interprocess/detail/posix_time_types_wrk.hpp>
#include <boost/assert.hpp>

#if !defined(BOOST_INTERPROCESS_FORCE_GENERIC_EMULATION) && defined (BOOST_INTERPROCESS_POSIX_PROCESS_SHARED)
   #include <boost/interprocess/sync/posix/mutex.hpp>
   #define BOOST_INTERPROCESS_USE_POSIX
//Experimental...
#elif !defined(BOOST_INTERPROCESS_FORCE_GENERIC_EMULATION) && defined (BOOST_INTERPROCESS_WINDOWS)
   #include <boost/interprocess/sync/windows/mutex.hpp>
   #define BOOST_INTERPROCESS_USE_WINDOWS
#elif !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)
   #include <boost/interprocess/sync/spin/mutex.hpp>
   #define BOOST_INTERPROCESS_USE_GENERIC_EMULATION

namespace boost {
namespace interprocess {
namespace ipcdetail{
namespace robust_emulation_helpers {

template<class T>
class mutex_traits;

}}}}

#endif

#endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED

//!\file
//!Describes a mutex class that can be placed in memory shared by
//!several processes.

namespace boost {
namespace interprocess {

class interprocess_condition;

//!Wraps a interprocess_mutex that can be placed in shared memory and can be
//!shared between processes. Allows timed lock tries
class interprocess_mutex
{
   #if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)
   //Non-copyable
   interprocess_mutex(const interprocess_mutex &);
   interprocess_mutex &operator=(const interprocess_mutex &);
   friend class interprocess_condition;

   public:
   #if defined(BOOST_INTERPROCESS_USE_GENERIC_EMULATION)
      #undef BOOST_INTERPROCESS_USE_GENERIC_EMULATION
      typedef ipcdetail::spin_mutex internal_mutex_type;
      private:
      friend class ipcdetail::robust_emulation_helpers::mutex_traits<interprocess_mutex>;
      void take_ownership(){ m_mutex.take_ownership(); }
      public:
   #elif defined(BOOST_INTERPROCESS_USE_POSIX)
      #undef BOOST_INTERPROCESS_USE_POSIX
      typedef ipcdetail::posix_mutex internal_mutex_type;
   #elif defined(BOOST_INTERPROCESS_USE_WINDOWS)
      #undef BOOST_INTERPROCESS_USE_WINDOWS
      typedef ipcdetail::windows_mutex internal_mutex_type;
   #else
      #error "Unknown platform for interprocess_mutex"
   #endif

   #endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED
   public:

   //!Constructor.
   //!Throws interprocess_exception on error.
   interprocess_mutex();

   //!Destructor. If any process uses the mutex after the destructor is called
   //!the result is undefined. Does not throw.
   ~interprocess_mutex();

   //!Effects: The calling thread tries to obtain ownership of the mutex, and
   //!   if another thread has ownership of the mutex, it waits until it can
   //!   obtain the ownership. If a thread takes ownership of the mutex the
   //!   mutex must be unlocked by the same mutex.
   //!Throws: interprocess_exception on error.
   void lock();

   //!Effects: The calling thread tries to obtain ownership of the mutex, and
   //!   if another thread has ownership of the mutex returns immediately.
   //!Returns: If the thread acquires ownership of the mutex, returns true, if
   //!   the another thread has ownership of the mutex, returns false.
   //!Throws: interprocess_exception on error.
   bool try_lock();

   //!Effects: The calling thread will try to obtain exclusive ownership of the
   //!   mutex if it can do so in until the specified time is reached. If the
   //!   mutex supports recursive locking, the mutex must be unlocked the same
   //!   number of times it is locked.
   //!Returns: If the thread acquires ownership of the mutex, returns true, if
   //!   the timeout expires returns false.
   //!Throws: interprocess_exception on error.
   bool timed_lock(const boost::posix_time::ptime &abs_time);

   //!Effects: The calling thread releases the exclusive ownership of the mutex.
   //!Throws: interprocess_exception on error.
   void unlock();

   #if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)
   internal_mutex_type &internal_mutex()
   {  return m_mutex;   }

   const internal_mutex_type &internal_mutex() const
   {  return m_mutex;   }

   private:
   internal_mutex_type m_mutex;
   #endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED
};

}  //namespace interprocess {
}  //namespace boost {


namespace boost {
namespace interprocess {

inline interprocess_mutex::interprocess_mutex(){}

inline interprocess_mutex::~interprocess_mutex(){}

inline void interprocess_mutex::lock()
{
   #ifdef BOOST_INTERPROCESS_ENABLE_TIMEOUT_WHEN_LOCKING
      boost::posix_time::ptime wait_time
         = microsec_clock::universal_time()
         + boost::posix_time::milliseconds(BOOST_INTERPROCESS_TIMEOUT_WHEN_LOCKING_DURATION_MS);
      if (!m_mutex.timed_lock(wait_time))
      {
         throw interprocess_exception(timeout_when_locking_error
                                     , "Interprocess mutex timeout when locking. Possible deadlock: "
                                       "owner died without unlocking?");
      }
   #else
      m_mutex.lock();
   #endif
}

inline bool interprocess_mutex::try_lock()
{ return m_mutex.try_lock(); }

inline bool interprocess_mutex::timed_lock(const boost::posix_time::ptime &abs_time)
{ return m_mutex.timed_lock(abs_time); }

inline void interprocess_mutex::unlock()
{ m_mutex.unlock(); }

}  //namespace interprocess {
}  //namespace boost {

#include <boost/interprocess/detail/config_end.hpp>

#endif   //BOOST_INTERPROCESS_MUTEX_HPP
