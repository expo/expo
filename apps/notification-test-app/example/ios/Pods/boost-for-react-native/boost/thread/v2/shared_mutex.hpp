#ifndef BOOST_THREAD_V2_SHARED_MUTEX_HPP
#define BOOST_THREAD_V2_SHARED_MUTEX_HPP

//  shared_mutex.hpp
//
// Copyright Howard Hinnant 2007-2010.
// Copyright Vicente J. Botet Escriba 2012.
//
//  Distributed under the Boost Software License, Version 1.0. (See
//  accompanying file LICENSE_1_0.txt or copy at
//  http://www.boost.org/LICENSE_1_0.txt)

/*
<shared_mutex> synopsis

namespace boost
{
namespace thread_v2
{

class shared_mutex
{
public:

    shared_mutex();
    ~shared_mutex();

    shared_mutex(const shared_mutex&) = delete;
    shared_mutex& operator=(const shared_mutex&) = delete;

    // Exclusive ownership

    void lock();
    bool try_lock();
    template <class Rep, class Period>
        bool try_lock_for(const boost::chrono::duration<Rep, Period>& rel_time);
    template <class Clock, class Duration>
        bool
        try_lock_until(
                      const boost::chrono::time_point<Clock, Duration>& abs_time);
    void unlock();

    // Shared ownership

    void lock_shared();
    bool try_lock_shared();
    template <class Rep, class Period>
        bool
        try_lock_shared_for(const boost::chrono::duration<Rep, Period>& rel_time);
    template <class Clock, class Duration>
        bool
        try_lock_shared_until(
                      const boost::chrono::time_point<Clock, Duration>& abs_time);
    void unlock_shared();
};

class upgrade_mutex
{
public:

    upgrade_mutex();
    ~upgrade_mutex();

    upgrade_mutex(const upgrade_mutex&) = delete;
    upgrade_mutex& operator=(const upgrade_mutex&) = delete;

    // Exclusive ownership

    void lock();
    bool try_lock();
    template <class Rep, class Period>
        bool try_lock_for(const boost::chrono::duration<Rep, Period>& rel_time);
    template <class Clock, class Duration>
        bool
        try_lock_until(
                      const boost::chrono::time_point<Clock, Duration>& abs_time);
    void unlock();

    // Shared ownership

    void lock_shared();
    bool try_lock_shared();
    template <class Rep, class Period>
        bool
        try_lock_shared_for(const boost::chrono::duration<Rep, Period>& rel_time);
    template <class Clock, class Duration>
        bool
        try_lock_shared_until(
                      const boost::chrono::time_point<Clock, Duration>& abs_time);
    void unlock_shared();

    // Upgrade ownership

    void lock_upgrade();
    bool try_lock_upgrade();
    template <class Rep, class Period>
        bool
        try_lock_upgrade_for(
                            const boost::chrono::duration<Rep, Period>& rel_time);
    template <class Clock, class Duration>
        bool
        try_lock_upgrade_until(
                      const boost::chrono::time_point<Clock, Duration>& abs_time);
    void unlock_upgrade();

    // Shared <-> Exclusive

    bool try_unlock_shared_and_lock();
    template <class Rep, class Period>
        bool
        try_unlock_shared_and_lock_for(
                            const boost::chrono::duration<Rep, Period>& rel_time);
    template <class Clock, class Duration>
        bool
        try_unlock_shared_and_lock_until(
                      const boost::chrono::time_point<Clock, Duration>& abs_time);
    void unlock_and_lock_shared();

    // Shared <-> Upgrade

    bool try_unlock_shared_and_lock_upgrade();
    template <class Rep, class Period>
        bool
        try_unlock_shared_and_lock_upgrade_for(
                            const boost::chrono::duration<Rep, Period>& rel_time);
    template <class Clock, class Duration>
        bool
        try_unlock_shared_and_lock_upgrade_until(
                      const boost::chrono::time_point<Clock, Duration>& abs_time);
    void unlock_upgrade_and_lock_shared();

    // Upgrade <-> Exclusive

    void unlock_upgrade_and_lock();
    bool try_unlock_upgrade_and_lock();
    template <class Rep, class Period>
        bool
        try_unlock_upgrade_and_lock_for(
                            const boost::chrono::duration<Rep, Period>& rel_time);
    template <class Clock, class Duration>
        bool
        try_unlock_upgrade_and_lock_until(
                      const boost::chrono::time_point<Clock, Duration>& abs_time);
    void unlock_and_lock_upgrade();
};

}  // thread_v2
}  // boost

 */

#include <boost/thread/detail/config.hpp>
#include <boost/thread/mutex.hpp>
#include <boost/thread/condition_variable.hpp>
#include <boost/thread/mutex.hpp>
#include <boost/chrono.hpp>
#include <climits>
#include <boost/system/system_error.hpp>
#define BOOST_THREAD_INLINE inline

namespace boost {
  namespace thread_v2 {

    class shared_mutex
    {
      typedef ::boost::mutex              mutex_t;
      typedef ::boost::condition_variable cond_t;
      typedef unsigned                count_t;

      mutex_t mut_;
      cond_t  gate1_;
      cond_t  gate2_;
      count_t state_;

      static const count_t write_entered_ = 1U << (sizeof(count_t)*CHAR_BIT - 1);
      static const count_t n_readers_ = ~write_entered_;

    public:
      BOOST_THREAD_INLINE shared_mutex();
      BOOST_THREAD_INLINE ~shared_mutex();

#ifndef BOOST_NO_CXX11_DELETED_FUNCTIONS
      shared_mutex(shared_mutex const&) = delete;
      shared_mutex& operator=(shared_mutex const&) = delete;
#else // BOOST_NO_CXX11_DELETED_FUNCTIONS
    private:
      shared_mutex(shared_mutex const&);
      shared_mutex& operator=(shared_mutex const&);
    public:
#endif // BOOST_NO_CXX11_DELETED_FUNCTIONS

      // Exclusive ownership

      BOOST_THREAD_INLINE void lock();
      BOOST_THREAD_INLINE bool try_lock();
      template <class Rep, class Period>
      bool try_lock_for(const boost::chrono::duration<Rep, Period>& rel_time)
      {
        return try_lock_until(boost::chrono::steady_clock::now() + rel_time);
      }
      template <class Clock, class Duration>
      bool
      try_lock_until(
          const boost::chrono::time_point<Clock, Duration>& abs_time);
      BOOST_THREAD_INLINE void unlock();


      // Shared ownership

      BOOST_THREAD_INLINE void lock_shared();
      BOOST_THREAD_INLINE bool try_lock_shared();
      template <class Rep, class Period>
      bool
      try_lock_shared_for(const boost::chrono::duration<Rep, Period>& rel_time)
      {
        return try_lock_shared_until(boost::chrono::steady_clock::now() +
            rel_time);
      }
      template <class Clock, class Duration>
      bool
      try_lock_shared_until(
          const boost::chrono::time_point<Clock, Duration>& abs_time);
      BOOST_THREAD_INLINE void unlock_shared();

#if defined BOOST_THREAD_USES_DATETIME
      bool timed_lock(system_time const& timeout);
      template<typename TimeDuration>
      bool timed_lock(TimeDuration const & relative_time)
      {
          return timed_lock(get_system_time()+relative_time);
      }
      bool timed_lock_shared(system_time const& timeout);
      template<typename TimeDuration>
      bool timed_lock_shared(TimeDuration const & relative_time)
      {
        return timed_lock_shared(get_system_time()+relative_time);
      }
#endif
    };

    template <class Clock, class Duration>
    bool
    shared_mutex::try_lock_until(
        const boost::chrono::time_point<Clock, Duration>& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (state_ & write_entered_)
      {
        while (true)
        {
          boost::cv_status status = gate1_.wait_until(lk, abs_time);
          if ((state_ & write_entered_) == 0)
            break;
          if (status == boost::cv_status::timeout)
            return false;
        }
      }
      state_ |= write_entered_;
      if (state_ & n_readers_)
      {
        while (true)
        {
          boost::cv_status status = gate2_.wait_until(lk, abs_time);
          if ((state_ & n_readers_) == 0)
            break;
          if (status == boost::cv_status::timeout)
          {
            state_ &= ~write_entered_;
            return false;
          }
        }
      }
      return true;
    }

    template <class Clock, class Duration>
    bool
    shared_mutex::try_lock_shared_until(
        const boost::chrono::time_point<Clock, Duration>& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if ((state_ & write_entered_) || (state_ & n_readers_) == n_readers_)
      {
        while (true)
        {
          boost::cv_status status = gate1_.wait_until(lk, abs_time);
          if ((state_ & write_entered_) == 0 &&
              (state_ & n_readers_) < n_readers_)
            break;
          if (status == boost::cv_status::timeout)
            return false;
        }
      }
      count_t num_readers = (state_ & n_readers_) + 1;
      state_ &= ~n_readers_;
      state_ |= num_readers;
      return true;
    }

#if defined BOOST_THREAD_USES_DATETIME
    bool shared_mutex::timed_lock(system_time const& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (state_ & write_entered_)
      {
        while (true)
        {
          bool status = gate1_.timed_wait(lk, abs_time);
          if ((state_ & write_entered_) == 0)
            break;
          if (!status)
            return false;
        }
      }
      state_ |= write_entered_;
      if (state_ & n_readers_)
      {
        while (true)
        {
          bool status = gate2_.timed_wait(lk, abs_time);
          if ((state_ & n_readers_) == 0)
            break;
          if (!status)
          {
            state_ &= ~write_entered_;
            return false;
          }
        }
      }
      return true;
    }
      bool shared_mutex::timed_lock_shared(system_time const& abs_time)
      {
        boost::unique_lock<mutex_t> lk(mut_);
        if (state_ & write_entered_)
        {
          while (true)
          {
            bool status = gate1_.timed_wait(lk, abs_time);
            if ((state_ & write_entered_) == 0)
              break;
            if (!status )
              return false;
          }
        }
        state_ |= write_entered_;
        if (state_ & n_readers_)
        {
          while (true)
          {
            bool status = gate2_.timed_wait(lk, abs_time);
            if ((state_ & n_readers_) == 0)
              break;
            if (!status)
            {
              state_ &= ~write_entered_;
              return false;
            }
          }
        }
        return true;
      }
#endif
    class upgrade_mutex
    {
      typedef boost::mutex              mutex_t;
      typedef boost::condition_variable cond_t;
      typedef unsigned                count_t;

      mutex_t mut_;
      cond_t  gate1_;
      cond_t  gate2_;
      count_t state_;

      static const unsigned write_entered_ = 1U << (sizeof(count_t)*CHAR_BIT - 1);
      static const unsigned upgradable_entered_ = write_entered_ >> 1;
      static const unsigned n_readers_ = ~(write_entered_ | upgradable_entered_);

    public:

      BOOST_THREAD_INLINE upgrade_mutex();
      BOOST_THREAD_INLINE ~upgrade_mutex();

#ifndef BOOST_CXX11_NO_DELETED_FUNCTIONS
      upgrade_mutex(const upgrade_mutex&) = delete;
      upgrade_mutex& operator=(const upgrade_mutex&) = delete;
#else // BOOST_CXX11_NO_DELETED_FUNCTIONS
    private:
      upgrade_mutex(const upgrade_mutex&);
      upgrade_mutex& operator=(const upgrade_mutex&);
    public:
#endif // BOOST_CXX11_NO_DELETED_FUNCTIONS

      // Exclusive ownership

      BOOST_THREAD_INLINE void lock();
      BOOST_THREAD_INLINE bool try_lock();
      template <class Rep, class Period>
      bool try_lock_for(const boost::chrono::duration<Rep, Period>& rel_time)
      {
        return try_lock_until(boost::chrono::steady_clock::now() + rel_time);
      }
      template <class Clock, class Duration>
      bool
      try_lock_until(
          const boost::chrono::time_point<Clock, Duration>& abs_time);
      BOOST_THREAD_INLINE void unlock();

      // Shared ownership

      BOOST_THREAD_INLINE void lock_shared();
      BOOST_THREAD_INLINE bool try_lock_shared();
      template <class Rep, class Period>
      bool
      try_lock_shared_for(const boost::chrono::duration<Rep, Period>& rel_time)
      {
        return try_lock_shared_until(boost::chrono::steady_clock::now() +
            rel_time);
      }
      template <class Clock, class Duration>
      bool
      try_lock_shared_until(
          const boost::chrono::time_point<Clock, Duration>& abs_time);
      BOOST_THREAD_INLINE void unlock_shared();

      // Upgrade ownership

      BOOST_THREAD_INLINE void lock_upgrade();
      BOOST_THREAD_INLINE bool try_lock_upgrade();
      template <class Rep, class Period>
      bool
      try_lock_upgrade_for(
          const boost::chrono::duration<Rep, Period>& rel_time)
      {
        return try_lock_upgrade_until(boost::chrono::steady_clock::now() +
            rel_time);
      }
      template <class Clock, class Duration>
      bool
      try_lock_upgrade_until(
          const boost::chrono::time_point<Clock, Duration>& abs_time);
      BOOST_THREAD_INLINE void unlock_upgrade();

      // Shared <-> Exclusive

      BOOST_THREAD_INLINE bool try_unlock_shared_and_lock();
      template <class Rep, class Period>
      bool
      try_unlock_shared_and_lock_for(
          const boost::chrono::duration<Rep, Period>& rel_time)
      {
        return try_unlock_shared_and_lock_until(
            boost::chrono::steady_clock::now() + rel_time);
      }
      template <class Clock, class Duration>
      bool
      try_unlock_shared_and_lock_until(
          const boost::chrono::time_point<Clock, Duration>& abs_time);
      BOOST_THREAD_INLINE void unlock_and_lock_shared();

      // Shared <-> Upgrade

      BOOST_THREAD_INLINE bool try_unlock_shared_and_lock_upgrade();
      template <class Rep, class Period>
      bool
      try_unlock_shared_and_lock_upgrade_for(
          const boost::chrono::duration<Rep, Period>& rel_time)
      {
        return try_unlock_shared_and_lock_upgrade_until(
            boost::chrono::steady_clock::now() + rel_time);
      }
      template <class Clock, class Duration>
      bool
      try_unlock_shared_and_lock_upgrade_until(
          const boost::chrono::time_point<Clock, Duration>& abs_time);
      BOOST_THREAD_INLINE void unlock_upgrade_and_lock_shared();

      // Upgrade <-> Exclusive

      BOOST_THREAD_INLINE void unlock_upgrade_and_lock();
      BOOST_THREAD_INLINE bool try_unlock_upgrade_and_lock();
      template <class Rep, class Period>
      bool
      try_unlock_upgrade_and_lock_for(
          const boost::chrono::duration<Rep, Period>& rel_time)
      {
        return try_unlock_upgrade_and_lock_until(
            boost::chrono::steady_clock::now() + rel_time);
      }
      template <class Clock, class Duration>
      bool
      try_unlock_upgrade_and_lock_until(
          const boost::chrono::time_point<Clock, Duration>& abs_time);
      BOOST_THREAD_INLINE void unlock_and_lock_upgrade();

#if defined BOOST_THREAD_USES_DATETIME
      inline bool timed_lock(system_time const& abs_time);
      template<typename TimeDuration>
      bool timed_lock(TimeDuration const & relative_time)
      {
          return timed_lock(get_system_time()+relative_time);
      }
      inline bool timed_lock_shared(system_time const& abs_time);
      template<typename TimeDuration>
      bool timed_lock_shared(TimeDuration const & relative_time)
      {
        return timed_lock_shared(get_system_time()+relative_time);
      }
      inline bool timed_lock_upgrade(system_time const& abs_time);
      template<typename TimeDuration>
      bool timed_lock_upgrade(TimeDuration const & relative_time)
      {
          return timed_lock_upgrade(get_system_time()+relative_time);
      }
#endif

    };

    template <class Clock, class Duration>
    bool
    upgrade_mutex::try_lock_until(
        const boost::chrono::time_point<Clock, Duration>& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (state_ & (write_entered_ | upgradable_entered_))
      {
        while (true)
        {
          boost::cv_status status = gate1_.wait_until(lk, abs_time);
          if ((state_ & (write_entered_ | upgradable_entered_)) == 0)
            break;
          if (status == boost::cv_status::timeout)
            return false;
        }
      }
      state_ |= write_entered_;
      if (state_ & n_readers_)
      {
        while (true)
        {
          boost::cv_status status = gate2_.wait_until(lk, abs_time);
          if ((state_ & n_readers_) == 0)
            break;
          if (status == boost::cv_status::timeout)
          {
            state_ &= ~write_entered_;
            return false;
          }
        }
      }
      return true;
    }

    template <class Clock, class Duration>
    bool
    upgrade_mutex::try_lock_shared_until(
        const boost::chrono::time_point<Clock, Duration>& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if ((state_ & write_entered_) || (state_ & n_readers_) == n_readers_)
      {
        while (true)
        {
          boost::cv_status status = gate1_.wait_until(lk, abs_time);
          if ((state_ & write_entered_) == 0 &&
              (state_ & n_readers_) < n_readers_)
            break;
          if (status == boost::cv_status::timeout)
            return false;
        }
      }
      count_t num_readers = (state_ & n_readers_) + 1;
      state_ &= ~n_readers_;
      state_ |= num_readers;
      return true;
    }

    template <class Clock, class Duration>
    bool
    upgrade_mutex::try_lock_upgrade_until(
        const boost::chrono::time_point<Clock, Duration>& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if ((state_ & (write_entered_ | upgradable_entered_)) ||
          (state_ & n_readers_) == n_readers_)
      {
        while (true)
        {
          boost::cv_status status = gate1_.wait_until(lk, abs_time);
          if ((state_ & (write_entered_ | upgradable_entered_)) == 0 &&
              (state_ & n_readers_) < n_readers_)
            break;
          if (status == boost::cv_status::timeout)
            return false;
        }
      }
      count_t num_readers = (state_ & n_readers_) + 1;
      state_ &= ~n_readers_;
      state_ |= upgradable_entered_ | num_readers;
      return true;
    }

#if defined BOOST_THREAD_USES_DATETIME
      bool upgrade_mutex::timed_lock(system_time const& abs_time)
      {
        boost::unique_lock<mutex_t> lk(mut_);
        if (state_ & (write_entered_ | upgradable_entered_))
        {
          while (true)
          {
            bool status = gate1_.timed_wait(lk, abs_time);
            if ((state_ & (write_entered_ | upgradable_entered_)) == 0)
              break;
            if (!status)
              return false;
          }
        }
        state_ |= write_entered_;
        if (state_ & n_readers_)
        {
          while (true)
          {
            bool status = gate2_.timed_wait(lk, abs_time);
            if ((state_ & n_readers_) == 0)
              break;
            if (!status)
            {
              state_ &= ~write_entered_;
              return false;
            }
          }
        }
        return true;
      }
      bool upgrade_mutex::timed_lock_shared(system_time const& abs_time)
      {
        boost::unique_lock<mutex_t> lk(mut_);
        if ((state_ & write_entered_) || (state_ & n_readers_) == n_readers_)
        {
          while (true)
          {
            bool status = gate1_.timed_wait(lk, abs_time);
            if ((state_ & write_entered_) == 0 &&
                (state_ & n_readers_) < n_readers_)
              break;
            if (!status)
              return false;
          }
        }
        count_t num_readers = (state_ & n_readers_) + 1;
        state_ &= ~n_readers_;
        state_ |= num_readers;
        return true;
      }
      bool upgrade_mutex::timed_lock_upgrade(system_time const& abs_time)
      {
        boost::unique_lock<mutex_t> lk(mut_);
        if ((state_ & (write_entered_ | upgradable_entered_)) ||
            (state_ & n_readers_) == n_readers_)
        {
          while (true)
          {
            bool status = gate1_.timed_wait(lk, abs_time);
            if ((state_ & (write_entered_ | upgradable_entered_)) == 0 &&
                (state_ & n_readers_) < n_readers_)
              break;
            if (!status)
              return false;
          }
        }
        count_t num_readers = (state_ & n_readers_) + 1;
        state_ &= ~n_readers_;
        state_ |= upgradable_entered_ | num_readers;
        return true;
      }

#endif
    template <class Clock, class Duration>
    bool
    upgrade_mutex::try_unlock_shared_and_lock_until(
        const boost::chrono::time_point<Clock, Duration>& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (state_ != 1)
      {
        while (true)
        {
          boost::cv_status status = gate2_.wait_until(lk, abs_time);
          if (state_ == 1)
            break;
          if (status == boost::cv_status::timeout)
            return false;
        }
      }
      state_ = write_entered_;
      return true;
    }

    template <class Clock, class Duration>
    bool
    upgrade_mutex::try_unlock_shared_and_lock_upgrade_until(
        const boost::chrono::time_point<Clock, Duration>& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if ((state_ & (write_entered_ | upgradable_entered_)) != 0)
      {
        while (true)
        {
          boost::cv_status status = gate2_.wait_until(lk, abs_time);
          if ((state_ & (write_entered_ | upgradable_entered_)) == 0)
            break;
          if (status == boost::cv_status::timeout)
            return false;
        }
      }
      state_ |= upgradable_entered_;
      return true;
    }

    template <class Clock, class Duration>
    bool
    upgrade_mutex::try_unlock_upgrade_and_lock_until(
        const boost::chrono::time_point<Clock, Duration>& abs_time)
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if ((state_ & n_readers_) != 1)
      {
        while (true)
        {
          boost::cv_status status = gate2_.wait_until(lk, abs_time);
          if ((state_ & n_readers_) == 1)
            break;
          if (status == boost::cv_status::timeout)
            return false;
        }
      }
      state_ = write_entered_;
      return true;
    }

    //////
    // shared_mutex

    shared_mutex::shared_mutex()
    : state_(0)
    {
    }

    shared_mutex::~shared_mutex()
    {
      boost::lock_guard<mutex_t> _(mut_);
    }

    // Exclusive ownership

    void
    shared_mutex::lock()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      while (state_ & write_entered_)
        gate1_.wait(lk);
      state_ |= write_entered_;
      while (state_ & n_readers_)
        gate2_.wait(lk);
    }

    bool
    shared_mutex::try_lock()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (state_ == 0)
      {
        state_ = write_entered_;
        return true;
      }
      return false;
    }

    void
    shared_mutex::unlock()
    {
      boost::lock_guard<mutex_t> _(mut_);
      state_ = 0;
      gate1_.notify_all();
    }

    // Shared ownership

    void
    shared_mutex::lock_shared()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      while ((state_ & write_entered_) || (state_ & n_readers_) == n_readers_)
        gate1_.wait(lk);
      count_t num_readers = (state_ & n_readers_) + 1;
      state_ &= ~n_readers_;
      state_ |= num_readers;
    }

    bool
    shared_mutex::try_lock_shared()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      count_t num_readers = state_ & n_readers_;
      if (!(state_ & write_entered_) && num_readers != n_readers_)
      {
        ++num_readers;
        state_ &= ~n_readers_;
        state_ |= num_readers;
        return true;
      }
      return false;
    }

    void
    shared_mutex::unlock_shared()
    {
      boost::lock_guard<mutex_t> _(mut_);
      count_t num_readers = (state_ & n_readers_) - 1;
      state_ &= ~n_readers_;
      state_ |= num_readers;
      if (state_ & write_entered_)
      {
        if (num_readers == 0)
          gate2_.notify_one();
      }
      else
      {
        if (num_readers == n_readers_ - 1)
          gate1_.notify_one();
      }
    }

    // upgrade_mutex

    upgrade_mutex::upgrade_mutex()
    : gate1_(),
      gate2_(),
      state_(0)
    {
    }

    upgrade_mutex::~upgrade_mutex()
    {
      boost::lock_guard<mutex_t> _(mut_);
    }

    // Exclusive ownership

    void
    upgrade_mutex::lock()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      while (state_ & (write_entered_ | upgradable_entered_))
        gate1_.wait(lk);
      state_ |= write_entered_;
      while (state_ & n_readers_)
        gate2_.wait(lk);
    }

    bool
    upgrade_mutex::try_lock()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (state_ == 0)
      {
        state_ = write_entered_;
        return true;
      }
      return false;
    }

    void
    upgrade_mutex::unlock()
    {
      boost::lock_guard<mutex_t> _(mut_);
      state_ = 0;
      gate1_.notify_all();
    }

    // Shared ownership

    void
    upgrade_mutex::lock_shared()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      while ((state_ & write_entered_) || (state_ & n_readers_) == n_readers_)
        gate1_.wait(lk);
      count_t num_readers = (state_ & n_readers_) + 1;
      state_ &= ~n_readers_;
      state_ |= num_readers;
    }

    bool
    upgrade_mutex::try_lock_shared()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      count_t num_readers = state_ & n_readers_;
      if (!(state_ & write_entered_) && num_readers != n_readers_)
      {
        ++num_readers;
        state_ &= ~n_readers_;
        state_ |= num_readers;
        return true;
      }
      return false;
    }

    void
    upgrade_mutex::unlock_shared()
    {
      boost::lock_guard<mutex_t> _(mut_);
      count_t num_readers = (state_ & n_readers_) - 1;
      state_ &= ~n_readers_;
      state_ |= num_readers;
      if (state_ & write_entered_)
      {
        if (num_readers == 0)
          gate2_.notify_one();
      }
      else
      {
        if (num_readers == n_readers_ - 1)
          gate1_.notify_one();
      }
    }

    // Upgrade ownership

    void
    upgrade_mutex::lock_upgrade()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      while ((state_ & (write_entered_ | upgradable_entered_)) ||
          (state_ & n_readers_) == n_readers_)
        gate1_.wait(lk);
      count_t num_readers = (state_ & n_readers_) + 1;
      state_ &= ~n_readers_;
      state_ |= upgradable_entered_ | num_readers;
    }

    bool
    upgrade_mutex::try_lock_upgrade()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      count_t num_readers = state_ & n_readers_;
      if (!(state_ & (write_entered_ | upgradable_entered_))
          && num_readers != n_readers_)
      {
        ++num_readers;
        state_ &= ~n_readers_;
        state_ |= upgradable_entered_ | num_readers;
        return true;
      }
      return false;
    }

    void
    upgrade_mutex::unlock_upgrade()
    {
      {
        boost::lock_guard<mutex_t> _(mut_);
        count_t num_readers = (state_ & n_readers_) - 1;
        state_ &= ~(upgradable_entered_ | n_readers_);
        state_ |= num_readers;
      }
      gate1_.notify_all();
    }

    // Shared <-> Exclusive

    bool
    upgrade_mutex::try_unlock_shared_and_lock()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (state_ == 1)
      {
        state_ = write_entered_;
        return true;
      }
      return false;
    }

    void
    upgrade_mutex::unlock_and_lock_shared()
    {
      {
        boost::lock_guard<mutex_t> _(mut_);
        state_ = 1;
      }
      gate1_.notify_all();
    }

    // Shared <-> Upgrade

    bool
    upgrade_mutex::try_unlock_shared_and_lock_upgrade()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (!(state_ & (write_entered_ | upgradable_entered_)))
      {
        state_ |= upgradable_entered_;
        return true;
      }
      return false;
    }

    void
    upgrade_mutex::unlock_upgrade_and_lock_shared()
    {
      {
        boost::lock_guard<mutex_t> _(mut_);
        state_ &= ~upgradable_entered_;
      }
      gate1_.notify_all();
    }

    // Upgrade <-> Exclusive

    void
    upgrade_mutex::unlock_upgrade_and_lock()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      count_t num_readers = (state_ & n_readers_) - 1;
      state_ &= ~(upgradable_entered_ | n_readers_);
      state_ |= write_entered_ | num_readers;
      while (state_ & n_readers_)
        gate2_.wait(lk);
    }

    bool
    upgrade_mutex::try_unlock_upgrade_and_lock()
    {
      boost::unique_lock<mutex_t> lk(mut_);
      if (state_ == (upgradable_entered_ | 1))
      {
        state_ = write_entered_;
        return true;
      }
      return false;
    }

    void
    upgrade_mutex::unlock_and_lock_upgrade()
    {
      {
        boost::lock_guard<mutex_t> _(mut_);
        state_ = upgradable_entered_ | 1;
      }
      gate1_.notify_all();
    }

  }  // thread_v2
}  // boost

namespace boost {
  //using thread_v2::shared_mutex;
  using thread_v2::upgrade_mutex;
  typedef thread_v2::upgrade_mutex shared_mutex;
}

#endif
