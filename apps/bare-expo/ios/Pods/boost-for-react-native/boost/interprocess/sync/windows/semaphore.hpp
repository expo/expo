//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2012. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/interprocess for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_INTERPROCESS_DETAIL_WINDOWS_SEMAPHORE_HPP
#define BOOST_INTERPROCESS_DETAIL_WINDOWS_SEMAPHORE_HPP

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
#include <boost/interprocess/detail/win32_api.hpp>
#include <boost/interprocess/detail/windows_intermodule_singleton.hpp>
#include <boost/interprocess/sync/windows/sync_utils.hpp>
#include <boost/interprocess/sync/windows/winapi_semaphore_wrapper.hpp>
#include <boost/interprocess/exceptions.hpp>
#include <boost/assert.hpp>


namespace boost {
namespace interprocess {
namespace ipcdetail {

class windows_semaphore
{
   windows_semaphore(const windows_semaphore &);
   windows_semaphore &operator=(const windows_semaphore &);
   public:

   windows_semaphore(unsigned int initialCount);
   ~windows_semaphore();

   void post(long release_count = 1);
   void wait();
   bool try_wait();
   bool timed_wait(const boost::posix_time::ptime &abs_time);

   private:
   const sync_id id_;
};

inline windows_semaphore::windows_semaphore(unsigned int initialCount)
   : id_(this)
{
   sync_handles &handles =
      windows_intermodule_singleton<sync_handles>::get();
   //Force smeaphore creation with the initial count
   bool open_or_created;
   handles.obtain_semaphore(this->id_, initialCount, &open_or_created);
   //The semaphore must be created, never opened
   BOOST_ASSERT(open_or_created);
   BOOST_ASSERT(open_or_created && winapi::get_last_error() != winapi::error_already_exists);
   (void)open_or_created;
}

inline windows_semaphore::~windows_semaphore()
{
   sync_handles &handles =
      windows_intermodule_singleton<sync_handles>::get();
   handles.destroy_handle(this->id_);
}

inline void windows_semaphore::wait(void)
{
   sync_handles &handles =
      windows_intermodule_singleton<sync_handles>::get();
   //This can throw
   winapi_semaphore_functions sem(handles.obtain_semaphore(this->id_, 0));
   sem.wait();
}

inline bool windows_semaphore::try_wait(void)
{
   sync_handles &handles =
      windows_intermodule_singleton<sync_handles>::get();
   //This can throw
   winapi_semaphore_functions sem(handles.obtain_semaphore(this->id_, 0));
   return sem.try_wait();
}

inline bool windows_semaphore::timed_wait(const boost::posix_time::ptime &abs_time)
{
   sync_handles &handles =
      windows_intermodule_singleton<sync_handles>::get();
   //This can throw
   winapi_semaphore_functions sem(handles.obtain_semaphore(this->id_, 0));
   return sem.timed_wait(abs_time);
}

inline void windows_semaphore::post(long release_count)
{
   sync_handles &handles =
      windows_intermodule_singleton<sync_handles>::get();
   winapi_semaphore_functions sem(handles.obtain_semaphore(this->id_, 0));
   sem.post(release_count);
}

}  //namespace ipcdetail {
}  //namespace interprocess {
}  //namespace boost {

#include <boost/interprocess/detail/config_end.hpp>

#endif   //BOOST_INTERPROCESS_DETAIL_WINDOWS_SEMAPHORE_HPP
