//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2012. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/interprocess for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_INTERPROCESS_DETAIL_SPIN_MUTEX_HPP
#define BOOST_INTERPROCESS_DETAIL_SPIN_MUTEX_HPP

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif
#
#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

#include <boost/interprocess/detail/config_begin.hpp>
#include <boost/interprocess/detail/workaround.hpp>
#include <boost/interprocess/detail/posix_time_types_wrk.hpp>
#include <boost/assert.hpp>
#include <boost/interprocess/detail/atomic.hpp>
#include <boost/cstdint.hpp>
#include <boost/interprocess/detail/os_thread_functions.hpp>
#include <boost/interprocess/sync/detail/common_algorithms.hpp>

namespace boost {
namespace interprocess {
namespace ipcdetail {

class spin_mutex
{
   spin_mutex(const spin_mutex &);
   spin_mutex &operator=(const spin_mutex &);
   public:

   spin_mutex();
   ~spin_mutex();

   void lock();
   bool try_lock();
   bool timed_lock(const boost::posix_time::ptime &abs_time);
   void unlock();
   void take_ownership(){};
   private:
   volatile boost::uint32_t m_s;
};

inline spin_mutex::spin_mutex()
   : m_s(0)
{
   //Note that this class is initialized to zero.
   //So zeroed memory can be interpreted as an
   //initialized mutex
}

inline spin_mutex::~spin_mutex()
{
   //Trivial destructor
}

inline void spin_mutex::lock(void)
{  return ipcdetail::try_based_lock(*this); }

inline bool spin_mutex::try_lock(void)
{
   boost::uint32_t prev_s = ipcdetail::atomic_cas32(const_cast<boost::uint32_t*>(&m_s), 1, 0);
   return m_s == 1 && prev_s == 0;
}

inline bool spin_mutex::timed_lock(const boost::posix_time::ptime &abs_time)
{  return ipcdetail::try_based_timed_lock(*this, abs_time); }

inline void spin_mutex::unlock(void)
{  ipcdetail::atomic_cas32(const_cast<boost::uint32_t*>(&m_s), 0, 1);   }

}  //namespace ipcdetail {
}  //namespace interprocess {
}  //namespace boost {

#include <boost/interprocess/detail/config_end.hpp>

#endif   //BOOST_INTERPROCESS_DETAIL_SPIN_MUTEX_HPP
