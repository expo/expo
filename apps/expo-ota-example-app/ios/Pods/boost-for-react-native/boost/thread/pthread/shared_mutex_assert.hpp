#ifndef BOOST_THREAD_PTHREAD_SHARED_MUTEX_HPP
#define BOOST_THREAD_PTHREAD_SHARED_MUTEX_HPP

//  (C) Copyright 2006-8 Anthony Williams
//  (C) Copyright 2012 Vicente J. Botet Escriba
//
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

#include <boost/assert.hpp>
#include <boost/static_assert.hpp>
#include <boost/thread/mutex.hpp>
#include <boost/thread/condition_variable.hpp>
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
#include <boost/thread/detail/thread_interruption.hpp>
#endif
#ifdef BOOST_THREAD_USES_CHRONO
#include <boost/chrono/system_clocks.hpp>
#include <boost/chrono/ceil.hpp>
#endif
#include <boost/thread/detail/delete.hpp>
#include <boost/assert.hpp>

#include <boost/config/abi_prefix.hpp>

namespace boost
{
    class shared_mutex
    {
    private:
        class state_data
        {
        public:
            state_data () :
              shared_count(0),
              exclusive(false),
              upgrade(false),
              exclusive_waiting_blocked(false)
            {}

            void assert_free() const
            {
                BOOST_ASSERT( ! exclusive );
                BOOST_ASSERT( ! upgrade );
                BOOST_ASSERT( shared_count==0 );
            }

            void assert_locked() const
            {
                BOOST_ASSERT( exclusive );
                BOOST_ASSERT( shared_count==0 );
                BOOST_ASSERT( ! upgrade );
            }

            void assert_lock_shared () const
            {
                BOOST_ASSERT( ! exclusive );
                BOOST_ASSERT( shared_count>0 );
                //BOOST_ASSERT( (! upgrade) || (shared_count>1));
                // if upgraded there are at least 2 threads sharing the mutex,
                // except when unlock_upgrade_and_lock has decreased the number of readers but has not taken yet exclusive ownership.
            }

            void assert_lock_upgraded () const
            {
                BOOST_ASSERT( ! exclusive );
                BOOST_ASSERT(  upgrade );
                BOOST_ASSERT(  shared_count>0 );
            }

            void assert_lock_not_upgraded () const
            {
                BOOST_ASSERT(  ! upgrade );
            }

            bool can_lock () const
            {
                return ! (shared_count || exclusive);
            }

            void exclusive_blocked (bool blocked)
            {
                exclusive_waiting_blocked = blocked;
            }

            void lock ()
            {
                exclusive = true;
            }

            void unlock ()
            {
                exclusive = false;
                exclusive_waiting_blocked = false;
            }

            bool can_lock_shared () const
            {
                return ! (exclusive || exclusive_waiting_blocked);
            }

            bool is_last_shared () const
            {
                return !shared_count ;
            }
            unsigned get_shared_count () const
            {
                return shared_count ;
            }
            unsigned  lock_shared ()
            {
                return ++shared_count;
            }


            void unlock_shared ()
            {
                --shared_count;
            }

            bool unlock_shared_downgrades()
            {
                  if (upgrade) {
                      upgrade=false;
                      exclusive=true;
                      return true;
                  } else {
                      exclusive_waiting_blocked=false;
                      return false;
                  }
            }

            void lock_upgrade ()
            {
                lock_shared ();
                upgrade=true;
            }
            bool can_lock_upgrade () const
            {
                return ! (exclusive || exclusive_waiting_blocked || upgrade);
            }

            void unlock_upgrade ()
            {
                upgrade=false;
                unlock_shared();
            }

        //private:
            unsigned shared_count;
            bool exclusive;
            bool upgrade;
            bool exclusive_waiting_blocked;
        };



        state_data state;
        boost::mutex state_change;
        boost::condition_variable shared_cond;
        boost::condition_variable exclusive_cond;
        boost::condition_variable upgrade_cond;

        void release_waiters()
        {
            exclusive_cond.notify_one();
            shared_cond.notify_all();
        }

    public:
        BOOST_THREAD_NO_COPYABLE(shared_mutex)

        shared_mutex()
        {
        }

        ~shared_mutex()
        {
        }

        void lock_shared()
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
            boost::this_thread::disable_interruption do_not_disturb;
#endif
            boost::unique_lock<boost::mutex> lk(state_change);

            while(!state.can_lock_shared())
            {
                shared_cond.wait(lk);
            }
            state.lock_shared();
        }

        bool try_lock_shared()
        {
            boost::unique_lock<boost::mutex> lk(state_change);
            if(!state.can_lock_shared())
            {
                return false;
            }
            else
            {
                state.lock_shared();
                return true;
            }
        }

#if defined BOOST_THREAD_USES_DATETIME
        bool timed_lock_shared(system_time const& timeout)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
            boost::this_thread::disable_interruption do_not_disturb;
#endif
            boost::unique_lock<boost::mutex> lk(state_change);

            while(!state.can_lock_shared())
            {
                if(!shared_cond.timed_wait(lk,timeout))
                {
                    return false;
                }
            }
            state.lock_shared();
            return true;
        }

        template<typename TimeDuration>
        bool timed_lock_shared(TimeDuration const & relative_time)
        {
            return timed_lock_shared(get_system_time()+relative_time);
        }
#endif
#ifdef BOOST_THREAD_USES_CHRONO
        template <class Rep, class Period>
        bool try_lock_shared_for(const chrono::duration<Rep, Period>& rel_time)
        {
          return try_lock_shared_until(chrono::steady_clock::now() + rel_time);
        }
        template <class Clock, class Duration>
        bool try_lock_shared_until(const chrono::time_point<Clock, Duration>& abs_time)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
          boost::this_thread::disable_interruption do_not_disturb;
#endif
          boost::unique_lock<boost::mutex> lk(state_change);

          while(!state.can_lock_shared())
          {
              if(cv_status::timeout==shared_cond.wait_until(lk,abs_time))
              {
                  return false;
              }
          }
          state.lock_shared();
          return true;
        }
#endif
        void unlock_shared()
        {
            boost::unique_lock<boost::mutex> lk(state_change);
            state.assert_lock_shared();
            state.unlock_shared();
            if (state.get_shared_count () == 0)
            {
              if (state.unlock_shared_downgrades())
              {
                lk.unlock();
                upgrade_cond.notify_one();
              } else {
                lk.unlock();
              }
              release_waiters();
            }
        }

        void lock()
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
            boost::this_thread::disable_interruption do_not_disturb;
#endif
            boost::unique_lock<boost::mutex> lk(state_change);

            while(!state.can_lock())
            {
                state.exclusive_blocked(true);
                exclusive_cond.wait(lk);
            }
            state.lock();
        }

#if defined BOOST_THREAD_USES_DATETIME
        bool timed_lock(system_time const& timeout)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
            boost::this_thread::disable_interruption do_not_disturb;
#endif
            boost::unique_lock<boost::mutex> lk(state_change);

            while(!state.can_lock())
            {
                state.exclusive_blocked(true);
                if(!exclusive_cond.timed_wait(lk,timeout))
                {
                    if(!state.can_lock())
                    {
                        state.exclusive_blocked(false);
                        release_waiters();
                        return false;
                    }
                    break;
                }
            }
            state.exclusive=true;
            //state.lock();
            return true;
        }

        template<typename TimeDuration>
        bool timed_lock(TimeDuration const & relative_time)
        {
            return timed_lock(get_system_time()+relative_time);
        }
#endif
#ifdef BOOST_THREAD_USES_CHRONO
        template <class Rep, class Period>
        bool try_lock_for(const chrono::duration<Rep, Period>& rel_time)
        {
          return try_lock_until(chrono::steady_clock::now() + rel_time);
        }
        template <class Clock, class Duration>
        bool try_lock_until(const chrono::time_point<Clock, Duration>& abs_time)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
          boost::this_thread::disable_interruption do_not_disturb;
#endif
          boost::unique_lock<boost::mutex> lk(state_change);

          while(!state.can_lock())
          {
              state.exclusive_blocked(true);
              if(cv_status::timeout == exclusive_cond.wait_until(lk,abs_time))
              {
                  if(!state.can_lock())
                  {
                      state.exclusive_blocked(false);
                      release_waiters();
                      return false;
                  }
                  break;
              }
          }
          state.exclusive=true;
          //state.lock();
          return true;
        }
#endif

        bool try_lock()
        {
            boost::unique_lock<boost::mutex> lk(state_change);

            if(!state.can_lock())
            {
                return false;
            }
            else
            {
                state.lock();
                return true;
            }

        }

        void unlock()
        {
            boost::unique_lock<boost::mutex> lk(state_change);
            state.assert_locked();
            state.unlock();
            state.assert_free();
            release_waiters();
        }

        void lock_upgrade()
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
            boost::this_thread::disable_interruption do_not_disturb;
#endif
            boost::unique_lock<boost::mutex> lk(state_change);
            while(!state.can_lock_upgrade())
            {
                shared_cond.wait(lk);
            }
            state.lock_upgrade();
        }

#if defined BOOST_THREAD_USES_DATETIME
        bool timed_lock_upgrade(system_time const& timeout)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
            boost::this_thread::disable_interruption do_not_disturb;
#endif
            boost::unique_lock<boost::mutex> lk(state_change);
            while(!state.can_lock_upgrade())
            {
                if(!shared_cond.timed_wait(lk,timeout))
                {
                    if(!state.can_lock_upgrade())
                    {
                        return false;
                    }
                    break;
                }
            }
            state.lock_upgrade();
            return true;
        }

        template<typename TimeDuration>
        bool timed_lock_upgrade(TimeDuration const & relative_time)
        {
            return timed_lock_upgrade(get_system_time()+relative_time);
        }
#endif
#ifdef BOOST_THREAD_USES_CHRONO
        template <class Rep, class Period>
        bool try_lock_upgrade_for(const chrono::duration<Rep, Period>& rel_time)
        {
          return try_lock_upgrade_until(chrono::steady_clock::now() + rel_time);
        }
        template <class Clock, class Duration>
        bool try_lock_upgrade_until(const chrono::time_point<Clock, Duration>& abs_time)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
          boost::this_thread::disable_interruption do_not_disturb;
#endif
          boost::unique_lock<boost::mutex> lk(state_change);
          while(!state.can_lock_upgrade())
          {
              if(cv_status::timeout == shared_cond.wait_until(lk,abs_time))
              {
                  if(!state.can_lock_upgrade())
                  {
                      return false;
                  }
                  break;
              }
          }
          state.lock_upgrade();
          return true;
        }
#endif
        bool try_lock_upgrade()
        {
            boost::unique_lock<boost::mutex> lk(state_change);
            if(!state.can_lock_upgrade())
            {
                return false;
            }
            else
            {
                state.lock_upgrade();
                state.assert_lock_upgraded();
                return true;
            }
        }

        void unlock_upgrade()
        {
            boost::unique_lock<boost::mutex> lk(state_change);
            state.assert_lock_upgraded();
            state.unlock_upgrade();
            state.assert_lock_not_upgraded ();
            if(state.get_shared_count () == 0)
            {
                state.exclusive_blocked(false);
                lk.unlock();
                release_waiters();
            } else {
                lk.unlock();
                shared_cond.notify_all();
            }
        }

        // Upgrade <-> Exclusive
        void unlock_upgrade_and_lock()
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
            boost::this_thread::disable_interruption do_not_disturb;
#endif
            boost::unique_lock<boost::mutex> lk(state_change);
            state.assert_lock_upgraded();
            // assert state.get_shared_count() >=1
            while(
                //! state.exclusive_waiting_blocked  // Fixme: is this needed?
                //&&
                state.get_shared_count()!=1)
            {
                upgrade_cond.wait(lk);
            }
            state.unlock_upgrade();
            state.lock();
            state.assert_locked();
        }

        void unlock_and_lock_upgrade()
        {
            boost::unique_lock<boost::mutex> lk(state_change);
            state.assert_locked();
            state.unlock();
            state.lock_upgrade();
            state.assert_lock_upgraded();
            release_waiters();
        }

        bool try_unlock_upgrade_and_lock()
        {
          boost::unique_lock<boost::mutex> lk(state_change);
          state.assert_lock_upgraded();
          if( //!state.exclusive // this should be removed once the assertion work
                 ! state.exclusive_waiting_blocked // Fixme: why this is needed?
              //&& state.upgrade // this should be removed once the assertion work
              && state.get_shared_count()==1)
          {
            state.unlock_upgrade();
            state.lock();
            state.assert_locked();
            return true;
          }
          return false;
        }
#ifdef BOOST_THREAD_USES_CHRONO
        template <class Rep, class Period>
        bool
        try_unlock_upgrade_and_lock_for(
                                const chrono::duration<Rep, Period>& rel_time)
        {
          return try_unlock_upgrade_and_lock_until(
                                 chrono::steady_clock::now() + rel_time);
        }
        template <class Clock, class Duration>
        bool
        try_unlock_upgrade_and_lock_until(
                          const chrono::time_point<Clock, Duration>& abs_time)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
          boost::this_thread::disable_interruption do_not_disturb;
#endif
          boost::unique_lock<boost::mutex> lk(state_change);
          state.assert_lock_upgraded();
          if (//state.exclusive // this should be removed once the assertion work
                 state.exclusive_waiting_blocked  // Fixme: is this needed?
              //|| ! state.upgrade // this should be removed once the assertion work
              || state.get_shared_count() != 1)
          {
              for (;;)
              {
                //cv_status status = shared_cond.wait_until(lk,abs_time);
                cv_status status = upgrade_cond.wait_until(lk,abs_time);
                if (//!state.exclusive // this should be removed once the assertion work
                       ! state.exclusive_waiting_blocked  // Fixme: is this needed?
                    //&& ! state.upgrade // this should be removed once the assertion work
                    &&   state.get_shared_count() == 1)
                  break;
                if(status == cv_status::timeout)
                  return false;
              }
          }
          state.unlock_upgrade();
          state.lock();
          return true;
        }
#endif

        // Shared <-> Exclusive
        void unlock_and_lock_shared()
        {
            boost::unique_lock<boost::mutex> lk(state_change);
            state.assert_locked();
            state.unlock();
            state.lock_shared();
            release_waiters();
        }

#ifdef BOOST_THREAD_PROVIDES_SHARED_MUTEX_UPWARDS_CONVERSIONS
        bool try_unlock_shared_and_lock()
        {
          boost::unique_lock<boost::mutex> lk(state_change);
          state.assert_lock_shared();
          if( //!state.exclusive // this should be removed once the assertion work
                 ! state.exclusive_waiting_blocked // Fixme: why this is needed?
              //&& ! state.upgrade // Fixme: why this is needed if state.get_shared_count()==1?
              &&   state.get_shared_count()==1)
          {
            state.unlock_shared();
            state.lock();
            return true;
          }
          return false;
        }
#ifdef BOOST_THREAD_USES_CHRONO
        template <class Rep, class Period>
            bool
            try_unlock_shared_and_lock_for(
                                const chrono::duration<Rep, Period>& rel_time)
        {
          return try_unlock_shared_and_lock_until(
                                 chrono::steady_clock::now() + rel_time);
        }
        template <class Clock, class Duration>
            bool
            try_unlock_shared_and_lock_until(
                          const chrono::time_point<Clock, Duration>& abs_time)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
          boost::this_thread::disable_interruption do_not_disturb;
#endif
          boost::unique_lock<boost::mutex> lk(state_change);
          state.assert_lock_shared();
          if (  //   !state.exclusive // this should be removed once the assertion work
                state.exclusive_waiting_blocked  // Fixme: is this needed?
                //|| state.upgrade // Fixme: why this is needed if state.get_shared_count()==1?
             || state.get_shared_count() != 1)
          {
              for (;;)
              {
                cv_status status = shared_cond.wait_until(lk,abs_time);
                if (    //! state.exclusive // this should be removed once the assertion work
                        ! state.exclusive_waiting_blocked  // Fixme: is this needed?
                     //&& ! state.upgrade
                     &&   state.get_shared_count() == 1)
                  break;
                if(status == cv_status::timeout)
                  return false;
              }
          }
          state.unlock_shared();
          state.lock();
          state.upgrade=false; // Is this absolutely needed?
          state.exclusive_waiting_blocked=false; // Is this absolutely needed?
          return true;
        }
#endif
#endif

        // Shared <-> Upgrade
        void unlock_upgrade_and_lock_shared()
        {
            boost::unique_lock<boost::mutex> lk(state_change);
            state.assert_lock_upgraded();
            //state.unlock_upgrade();
            //state.lock_shared(); // less efficient
            state.upgrade=false;
            state.exclusive_waiting_blocked=false; // Is this absolutely needed?
            release_waiters();
        }

#ifdef BOOST_THREAD_PROVIDES_SHARED_MUTEX_UPWARDS_CONVERSIONS
        bool try_unlock_shared_and_lock_upgrade()
        {
          boost::unique_lock<boost::mutex> lk(state_change);
          state.assert_lock_shared();
          if(    //! state.exclusive // this should be removed once the assertion work
                 ! state.exclusive_waiting_blocked  // Fixme: is this needed?
              && ! state.upgrade
              )
          {
            state.upgrade=true;
            return true;
          }
          return false;
        }
#ifdef BOOST_THREAD_USES_CHRONO
        template <class Rep, class Period>
            bool
            try_unlock_shared_and_lock_upgrade_for(
                                const chrono::duration<Rep, Period>& rel_time)
        {
          return try_unlock_shared_and_lock_upgrade_until(
                                 chrono::steady_clock::now() + rel_time);
        }
        template <class Clock, class Duration>
            bool
            try_unlock_shared_and_lock_upgrade_until(
                          const chrono::time_point<Clock, Duration>& abs_time)
        {
#if defined BOOST_THREAD_PROVIDES_INTERRUPTIONS
          boost::this_thread::disable_interruption do_not_disturb;
#endif
          boost::unique_lock<boost::mutex> lk(state_change);
          state.assert_lock_shared();
          if(    //state.exclusive // this should be removed once the assertion work
                 state.exclusive_waiting_blocked  // Fixme: is this needed?
              || state.upgrade
              )
          {
              for (;;)
              {
                cv_status status = exclusive_cond.wait_until(lk,abs_time);
                if(    //! state.exclusive // this should be removed once the assertion work
                       ! state.exclusive_waiting_blocked  // Fixme: is this needed?
                    && ! state.upgrade
                    )
                  break;
                if(status == cv_status::timeout)
                  return false;
              }
          }
          //state.unlock_shared();
          //state.lock_upgrade(); // less efficient
          state.upgrade=true;
          return true;
        }
#endif
#endif
    };

    typedef shared_mutex upgrade_mutex;
}

#include <boost/config/abi_suffix.hpp>

#endif
