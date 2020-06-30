#ifndef BOOST_BASIC_TIMED_MUTEX_WIN32_HPP
#define BOOST_BASIC_TIMED_MUTEX_WIN32_HPP

//  basic_timed_mutex_win32.hpp
//
//  (C) Copyright 2006-8 Anthony Williams
//  (C) Copyright 2011-2012 Vicente J. Botet Escriba
//
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

#include <boost/assert.hpp>
#include <boost/thread/win32/thread_primitives.hpp>
#include <boost/thread/win32/interlocked_read.hpp>
#include <boost/thread/thread_time.hpp>
#if defined BOOST_THREAD_USES_DATETIME
#include <boost/thread/xtime.hpp>
#endif
#include <boost/detail/interlocked.hpp>
#ifdef BOOST_THREAD_USES_CHRONO
#include <boost/chrono/system_clocks.hpp>
#include <boost/chrono/ceil.hpp>
#endif
#include <boost/config/abi_prefix.hpp>

namespace boost
{
    namespace detail
    {
        struct basic_timed_mutex
        {
            BOOST_STATIC_CONSTANT(unsigned char,lock_flag_bit=31);
            BOOST_STATIC_CONSTANT(unsigned char,event_set_flag_bit=30);
            BOOST_STATIC_CONSTANT(long,lock_flag_value=1<<lock_flag_bit);
            BOOST_STATIC_CONSTANT(long,event_set_flag_value=1<<event_set_flag_bit);
            long active_count;
            void* event;

            void initialize()
            {
                active_count=0;
                event=0;
            }

            void destroy()
            {
#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4312)
#endif
                void* const old_event=BOOST_INTERLOCKED_EXCHANGE_POINTER(&event,0);
#ifdef BOOST_MSVC
#pragma warning(pop)
#endif
                if(old_event)
                {
                    win32::CloseHandle(old_event);
                }
            }


            bool try_lock() BOOST_NOEXCEPT
            {
                return !win32::interlocked_bit_test_and_set(&active_count,lock_flag_bit);
            }

            void lock()
            {
                if(try_lock())
                {
                    return;
                }
                long old_count=active_count;
                mark_waiting_and_try_lock(old_count);

                if(old_count&lock_flag_value)
                {
                    bool lock_acquired=false;
                    void* const sem=get_event();

                    do
                    {
                        unsigned const retval(win32::WaitForSingleObjectEx(sem, ::boost::detail::win32::infinite,0));
                        BOOST_VERIFY(0 == retval || ::boost::detail::win32::wait_abandoned == retval);
//                        BOOST_VERIFY(win32::WaitForSingleObject(
//                                         sem,::boost::detail::win32::infinite)==0);
                        clear_waiting_and_try_lock(old_count);
                        lock_acquired=!(old_count&lock_flag_value);
                    }
                    while(!lock_acquired);
                }
            }
            void mark_waiting_and_try_lock(long& old_count)
            {
                for(;;)
                {
                    bool const was_locked=(old_count&lock_flag_value) ? true : false;
                    long const new_count=was_locked?(old_count+1):(old_count|lock_flag_value);
                    long const current=BOOST_INTERLOCKED_COMPARE_EXCHANGE(&active_count,new_count,old_count);
                    if(current==old_count)
                    {
                        if(was_locked)
                            old_count=new_count;
                        break;
                    }
                    old_count=current;
                }
            }

            void clear_waiting_and_try_lock(long& old_count)
            {
                old_count&=~lock_flag_value;
                old_count|=event_set_flag_value;
                for(;;)
                {
                    long const new_count=((old_count&lock_flag_value)?old_count:((old_count-1)|lock_flag_value))&~event_set_flag_value;
                    long const current=BOOST_INTERLOCKED_COMPARE_EXCHANGE(&active_count,new_count,old_count);
                    if(current==old_count)
                    {
                        break;
                    }
                    old_count=current;
                }
            }


#if defined BOOST_THREAD_USES_DATETIME
            bool timed_lock(::boost::system_time const& wait_until)
            {
                if(try_lock())
                {
                    return true;
                }
                long old_count=active_count;
                mark_waiting_and_try_lock(old_count);

                if(old_count&lock_flag_value)
                {
                    bool lock_acquired=false;
                    void* const sem=get_event();

                    do
                    {
                        if(win32::WaitForSingleObjectEx(sem,::boost::detail::get_milliseconds_until(wait_until),0)!=0)
                        {
                            BOOST_INTERLOCKED_DECREMENT(&active_count);
                            return false;
                        }
                        clear_waiting_and_try_lock(old_count);
                        lock_acquired=!(old_count&lock_flag_value);
                    }
                    while(!lock_acquired);
                }
                return true;
            }

            template<typename Duration>
            bool timed_lock(Duration const& timeout)
            {
                return timed_lock(get_system_time()+timeout);
            }

            bool timed_lock(boost::xtime const& timeout)
            {
                return timed_lock(system_time(timeout));
            }
#endif
#ifdef BOOST_THREAD_USES_CHRONO
            template <class Rep, class Period>
            bool try_lock_for(const chrono::duration<Rep, Period>& rel_time)
            {
              return try_lock_until(chrono::steady_clock::now() + rel_time);
            }
            template <class Clock, class Duration>
            bool try_lock_until(const chrono::time_point<Clock, Duration>& t)
            {
              using namespace chrono;
              system_clock::time_point     s_now = system_clock::now();
              typename Clock::time_point  c_now = Clock::now();
              return try_lock_until(s_now + ceil<system_clock::duration>(t - c_now));
            }
            template <class Duration>
            bool try_lock_until(const chrono::time_point<chrono::system_clock, Duration>& t)
            {
              using namespace chrono;
              typedef time_point<chrono::system_clock, chrono::system_clock::duration> sys_tmpt;
              return try_lock_until(sys_tmpt(chrono::ceil<chrono::system_clock::duration>(t.time_since_epoch())));
            }
            bool try_lock_until(const chrono::time_point<chrono::system_clock, chrono::system_clock::duration>& tp)
            {
              if(try_lock())
              {
                  return true;
              }
              long old_count=active_count;
              mark_waiting_and_try_lock(old_count);

              if(old_count&lock_flag_value)
              {
                  bool lock_acquired=false;
                  void* const sem=get_event();

                  do
                  {
                      chrono::time_point<chrono::system_clock, chrono::system_clock::duration> now = chrono::system_clock::now();
                      if (tp<=now) {
                        BOOST_INTERLOCKED_DECREMENT(&active_count);
                        return false;
                      }
                      chrono::milliseconds rel_time= chrono::ceil<chrono::milliseconds>(tp-now);

                      if(win32::WaitForSingleObjectEx(sem,static_cast<unsigned long>(rel_time.count()),0)!=0)
                      {
                          BOOST_INTERLOCKED_DECREMENT(&active_count);
                          return false;
                      }
                      clear_waiting_and_try_lock(old_count);
                      lock_acquired=!(old_count&lock_flag_value);
                  }
                  while(!lock_acquired);
              }
              return true;
            }
#endif

            void unlock()
            {
                long const offset=lock_flag_value;
                long const old_count=BOOST_INTERLOCKED_EXCHANGE_ADD(&active_count,lock_flag_value);
                if(!(old_count&event_set_flag_value) && (old_count>offset))
                {
                    if(!win32::interlocked_bit_test_and_set(&active_count,event_set_flag_bit))
                    {
                        win32::SetEvent(get_event());
                    }
                }
            }

        private:
            void* get_event()
            {
                void* current_event=::boost::detail::interlocked_read_acquire(&event);

                if(!current_event)
                {
                    void* const new_event=win32::create_anonymous_event(win32::auto_reset_event,win32::event_initially_reset);
#ifdef BOOST_MSVC
#pragma warning(push)
#pragma warning(disable:4311)
#pragma warning(disable:4312)
#endif
                    void* const old_event=BOOST_INTERLOCKED_COMPARE_EXCHANGE_POINTER(&event,new_event,0);
#ifdef BOOST_MSVC
#pragma warning(pop)
#endif
                    if(old_event!=0)
                    {
                        win32::CloseHandle(new_event);
                        return old_event;
                    }
                    else
                    {
                        return new_event;
                    }
                }
                return current_event;
            }

        };

    }
}

#define BOOST_BASIC_TIMED_MUTEX_INITIALIZER {0}

#include <boost/config/abi_suffix.hpp>

#endif
