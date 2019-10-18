// Copyright (C) 2014 Ian Forbed
// Copyright (C) 2014 Vicente J. Botet Escriba
//
//  Distributed under the Boost Software License, Version 1.0. (See accompanying
//  file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_THREAD_SYNC_TIMED_QUEUE_HPP
#define BOOST_THREAD_SYNC_TIMED_QUEUE_HPP

#include <boost/thread/detail/config.hpp>

#include <boost/thread/concurrent_queues/sync_priority_queue.hpp>
#include <boost/chrono/duration.hpp>
#include <boost/chrono/time_point.hpp>
#include <boost/chrono/system_clocks.hpp>
#include <boost/chrono/chrono_io.hpp>

#include <boost/config/abi_prefix.hpp>

namespace boost
{
namespace concurrent
{
namespace detail
{
  template <class T, class Clock = chrono::steady_clock>
  struct scheduled_type
  {
    typedef T value_type;
    typedef Clock clock;
    typedef typename clock::time_point time_point;
    T data;
    time_point time;

    BOOST_THREAD_COPYABLE_AND_MOVABLE(scheduled_type)

    scheduled_type(T const& pdata, time_point tp) : data(pdata), time(tp) {}
    scheduled_type(BOOST_THREAD_RV_REF(T) pdata, time_point tp) : data(boost::move(pdata)), time(tp) {}

    scheduled_type(scheduled_type const& other) : data(other.data), time(other.time) {}
    scheduled_type& operator=(BOOST_THREAD_COPY_ASSIGN_REF(scheduled_type) other) {
      data = other.data;
      time = other.time;
      return *this;
    }

    scheduled_type(BOOST_THREAD_RV_REF(scheduled_type) other) : data(boost::move(other.data)), time(other.time) {}
    scheduled_type& operator=(BOOST_THREAD_RV_REF(scheduled_type) other) {
      data = boost::move(other.data);
      time = other.time;
      return *this;
    }

    bool time_not_reached() const
    {
      return time > clock::now();
    }

    bool operator <(const scheduled_type<T> other) const
    {
      return this->time > other.time;
    }
  }; //end struct

} //end detail namespace

  template <class T, class Clock = chrono::steady_clock>
  class sync_timed_queue
    : private sync_priority_queue<detail::scheduled_type<T, Clock> >
  {
    typedef detail::scheduled_type<T, Clock> stype;
    typedef sync_priority_queue<stype> super;
  public:
    typedef T value_type;
    typedef Clock clock;
    typedef typename clock::duration duration;
    typedef typename clock::time_point time_point;
    typedef typename super::underlying_queue_type underlying_queue_type;
    typedef typename super::size_type size_type;
    typedef typename super::op_status op_status;

    sync_timed_queue() : super() {};
    ~sync_timed_queue() {}

    using super::size;
    using super::empty;
    using super::full;
    using super::close;
    using super::closed;

    T pull();
    void pull(T& elem);

    template <class Duration>
    queue_op_status pull_until(chrono::time_point<clock,Duration> const& tp, T& elem);
    template <class Rep, class Period>
    queue_op_status pull_for(chrono::duration<Rep,Period> const& dura, T& elem);

    queue_op_status try_pull(T& elem);
    queue_op_status wait_pull(T& elem);
    queue_op_status nonblocking_pull(T& elem);

    template <class Duration>
    void push(const T& elem, chrono::time_point<clock,Duration> const& tp);
    template <class Rep, class Period>
    void push(const T& elem, chrono::duration<Rep,Period> const& dura);

    template <class Duration>
    void push(BOOST_THREAD_RV_REF(T) elem, chrono::time_point<clock,Duration> const& tp);
    template <class Rep, class Period>
    void push(BOOST_THREAD_RV_REF(T) elem, chrono::duration<Rep,Period> const& dura);

    template <class Duration>
    queue_op_status try_push(const T& elem, chrono::time_point<clock,Duration> const& tp);
    template <class Rep, class Period>
    queue_op_status try_push(const T& elem, chrono::duration<Rep,Period> const& dura);

    template <class Duration>
    queue_op_status try_push(BOOST_THREAD_RV_REF(T) elem, chrono::time_point<clock,Duration> const& tp);
    template <class Rep, class Period>
    queue_op_status try_push(BOOST_THREAD_RV_REF(T) elem, chrono::duration<Rep,Period> const& dura);

  private:
    T pull(unique_lock<mutex>&);
    T pull(lock_guard<mutex>&);

    void pull(unique_lock<mutex>&, T& elem);
    void pull(lock_guard<mutex>&, T& elem);

    queue_op_status try_pull(unique_lock<mutex>&, T& elem);
    queue_op_status try_pull(lock_guard<mutex>&, T& elem);

    queue_op_status wait_pull(unique_lock<mutex>& lk, T& elem);

    bool wait_until_not_empty_time_reached_or_closed(unique_lock<mutex>&);
    T pull_when_time_reached(unique_lock<mutex>&);
    template <class Duration>
    queue_op_status pull_when_time_reached_until(unique_lock<mutex>&, chrono::time_point<clock,Duration> const& tp, T& elem);
    bool time_not_reached(unique_lock<mutex>&);
    bool time_not_reached(lock_guard<mutex>&);
    bool empty_or_time_not_reached(unique_lock<mutex>&);
    bool empty_or_time_not_reached(lock_guard<mutex>&);

    sync_timed_queue(const sync_timed_queue&);
    sync_timed_queue& operator=(const sync_timed_queue&);
    sync_timed_queue(BOOST_THREAD_RV_REF(sync_timed_queue));
    sync_timed_queue& operator=(BOOST_THREAD_RV_REF(sync_timed_queue));
  }; //end class


  template <class T, class Clock>
  template <class Duration>
  void sync_timed_queue<T, Clock>::push(const T& elem, chrono::time_point<clock,Duration> const& tp)
  {
    super::push(stype(elem,tp));
  }

  template <class T, class Clock>
  template <class Rep, class Period>
  void sync_timed_queue<T, Clock>::push(const T& elem, chrono::duration<Rep,Period> const& dura)
  {
    push(elem, clock::now() + dura);
  }

  template <class T, class Clock>
  template <class Duration>
  void sync_timed_queue<T, Clock>::push(BOOST_THREAD_RV_REF(T) elem, chrono::time_point<clock,Duration> const& tp)
  {
    super::push(stype(boost::move(elem),tp));
  }

  template <class T, class Clock>
  template <class Rep, class Period>
  void sync_timed_queue<T, Clock>::push(BOOST_THREAD_RV_REF(T) elem, chrono::duration<Rep,Period> const& dura)
  {
    push(boost::move(elem), clock::now() + dura);
  }



  template <class T, class Clock>
  template <class Duration>
  queue_op_status sync_timed_queue<T, Clock>::try_push(const T& elem, chrono::time_point<clock,Duration> const& tp)
  {
    return super::try_push(stype(elem,tp));
  }

  template <class T, class Clock>
  template <class Rep, class Period>
  queue_op_status sync_timed_queue<T, Clock>::try_push(const T& elem, chrono::duration<Rep,Period> const& dura)
  {
    return try_push(elem,clock::now() + dura);
  }

  template <class T, class Clock>
  template <class Duration>
  queue_op_status sync_timed_queue<T, Clock>::try_push(BOOST_THREAD_RV_REF(T) elem, chrono::time_point<clock,Duration> const& tp)
  {
    return super::try_push(stype(boost::move(elem), tp));
  }

  template <class T, class Clock>
  template <class Rep, class Period>
  queue_op_status sync_timed_queue<T, Clock>::try_push(BOOST_THREAD_RV_REF(T) elem, chrono::duration<Rep,Period> const& dura)
  {
    return try_push(boost::move(elem), clock::now() + dura);
  }

  ///////////////////////////
  template <class T, class Clock>
  bool sync_timed_queue<T, Clock>::time_not_reached(unique_lock<mutex>&)
  {
    return super::data_.top().time_not_reached();
  }

  template <class T, class Clock>
  bool sync_timed_queue<T, Clock>::time_not_reached(lock_guard<mutex>&)
  {
    return super::data_.top().time_not_reached();
  }

  ///////////////////////////
  template <class T, class Clock>
  bool sync_timed_queue<T, Clock>::wait_until_not_empty_time_reached_or_closed(unique_lock<mutex>& lk)
  {
    for (;;)
    {
      if (super::closed(lk)) return true;
      while (! super::empty(lk)) {
        if (! time_not_reached(lk)) return false;
        time_point tp = super::data_.top().time;
        super::not_empty_.wait_until(lk, tp);
        if (super::closed(lk)) return true;
      }
      if (super::closed(lk)) return true;
      super::not_empty_.wait(lk);
    }
    //return false;
  }

  ///////////////////////////
  template <class T, class Clock>
  T sync_timed_queue<T, Clock>::pull_when_time_reached(unique_lock<mutex>& lk)
  {
    while (time_not_reached(lk))
    {
      super::throw_if_closed(lk);
      time_point tp = super::data_.top().time;
      super::not_empty_.wait_until(lk,tp);
      super::wait_until_not_empty(lk);
    }
    return pull(lk);
  }

  template <class T, class Clock>
  template <class Duration>
  queue_op_status
  sync_timed_queue<T, Clock>::pull_when_time_reached_until(unique_lock<mutex>& lk, chrono::time_point<clock,Duration> const& tp, T& elem)
  {
    chrono::time_point<clock,Duration> tpmin = (tp < super::data_.top().time) ? tp : super::data_.top().time;
    while (time_not_reached(lk))
    {
      super::throw_if_closed(lk);
      if (cv_status::timeout == super::not_empty_.wait_until(lk, tpmin)) {
        if (time_not_reached(lk)) return queue_op_status::not_ready;
        return queue_op_status::timeout;
      }
    }
    pull(lk, elem);
    return queue_op_status::success;
  }

  ///////////////////////////
  template <class T, class Clock>
  bool sync_timed_queue<T, Clock>::empty_or_time_not_reached(unique_lock<mutex>& lk)
  {
    if ( super::empty(lk) ) return true;
    if ( time_not_reached(lk) ) return true;
    return false;
  }
  template <class T, class Clock>
  bool sync_timed_queue<T, Clock>::empty_or_time_not_reached(lock_guard<mutex>& lk)
  {
    if ( super::empty(lk) ) return true;
    if ( time_not_reached(lk) ) return true;
    return false;
  }

  ///////////////////////////
  template <class T, class Clock>
  T sync_timed_queue<T, Clock>::pull(unique_lock<mutex>&)
  {
#if ! defined  BOOST_NO_CXX11_RVALUE_REFERENCES
    return boost::move(super::data_.pull().data);
#else
    return super::data_.pull().data;
#endif
  }

  template <class T, class Clock>
  T sync_timed_queue<T, Clock>::pull(lock_guard<mutex>&)
  {
#if ! defined  BOOST_NO_CXX11_RVALUE_REFERENCES
    return boost::move(super::data_.pull().data);
#else
    return super::data_.pull().data;
#endif
  }
  template <class T, class Clock>
  T sync_timed_queue<T, Clock>::pull()
  {
    unique_lock<mutex> lk(super::mtx_);
    super::wait_until_not_empty(lk);
    return pull_when_time_reached(lk);
  }

  ///////////////////////////
  template <class T, class Clock>
  void sync_timed_queue<T, Clock>::pull(unique_lock<mutex>&, T& elem)
  {
#if ! defined  BOOST_NO_CXX11_RVALUE_REFERENCES
    elem = boost::move(super::data_.pull().data);
#else
    elem = super::data_.pull().data;
#endif
  }

  template <class T, class Clock>
  void sync_timed_queue<T, Clock>::pull(lock_guard<mutex>&, T& elem)
  {
#if ! defined  BOOST_NO_CXX11_RVALUE_REFERENCES
    elem = boost::move(super::data_.pull().data);
#else
    elem = super::data_.pull().data;
#endif
  }

  template <class T, class Clock>
  void sync_timed_queue<T, Clock>::pull(T& elem)
  {
    unique_lock<mutex> lk(super::mtx_);
    super::wait_until_not_empty(lk);
    elem = pull_when_time_reached(lk);
  }

  //////////////////////
  template <class T, class Clock>
  template <class Duration>
  queue_op_status
  sync_timed_queue<T, Clock>::pull_until(chrono::time_point<clock,Duration> const& tp, T& elem)
  {
    unique_lock<mutex> lk(super::mtx_);

    if (queue_op_status::timeout == super::wait_until_not_empty_until(lk, tp))
      return queue_op_status::timeout;
    return pull_when_time_reached_until(lk, tp, elem);
  }

  //////////////////////
  template <class T, class Clock>
  template <class Rep, class Period>
  queue_op_status
  sync_timed_queue<T, Clock>::pull_for(chrono::duration<Rep,Period> const& dura, T& elem)
  {
    return pull_until(clock::now() + dura, elem);
  }

  ///////////////////////////
  template <class T, class Clock>
  queue_op_status sync_timed_queue<T, Clock>::try_pull(unique_lock<mutex>& lk, T& elem)
  {
    if ( super::empty(lk) )
    {
      if (super::closed(lk)) return queue_op_status::closed;
      return queue_op_status::empty;
    }
    if ( time_not_reached(lk) )
    {
      if (super::closed(lk)) return queue_op_status::closed;
      return queue_op_status::not_ready;
    }

    pull(lk, elem);
    return queue_op_status::success;
  }
  template <class T, class Clock>
  queue_op_status sync_timed_queue<T, Clock>::try_pull(lock_guard<mutex>& lk, T& elem)
  {
    if ( super::empty(lk) )
    {
      if (super::closed(lk)) return queue_op_status::closed;
      return queue_op_status::empty;
    }
    if ( time_not_reached(lk) )
    {
      if (super::closed(lk)) return queue_op_status::closed;
      return queue_op_status::not_ready;
    }
    pull(lk, elem);
    return queue_op_status::success;
  }

  template <class T, class Clock>
  queue_op_status sync_timed_queue<T, Clock>::try_pull(T& elem)
  {
    lock_guard<mutex> lk(super::mtx_);
    return try_pull(lk, elem);
  }

  ///////////////////////////
  template <class T, class Clock>
  queue_op_status sync_timed_queue<T, Clock>::wait_pull(unique_lock<mutex>& lk, T& elem)
  {
    if (super::empty(lk))
    {
      if (super::closed(lk)) return queue_op_status::closed;
    }
    bool has_been_closed = wait_until_not_empty_time_reached_or_closed(lk);
    if (has_been_closed) return queue_op_status::closed;
    pull(lk, elem);
    return queue_op_status::success;
  }

  template <class T, class Clock>
  queue_op_status sync_timed_queue<T, Clock>::wait_pull(T& elem)
  {
    unique_lock<mutex> lk(super::mtx_);
    return wait_pull(lk, elem);
  }

//  ///////////////////////////
//  template <class T, class Clock>
//  queue_op_status sync_timed_queue<T, Clock>::wait_pull(unique_lock<mutex> &lk, T& elem)
//  {
//    if (super::empty(lk))
//    {
//      if (super::closed(lk)) return queue_op_status::closed;
//    }
//    bool has_been_closed = super::wait_until_not_empty_or_closed(lk);
//    if (has_been_closed) return queue_op_status::closed;
//    pull(lk, elem);
//    return queue_op_status::success;
//  }
//  template <class T>
//  queue_op_status sync_timed_queue<T, Clock>::wait_pull(T& elem)
//  {
//    unique_lock<mutex> lk(super::mtx_);
//    return wait_pull(lk, elem);
//  }

  ///////////////////////////
  template <class T, class Clock>
  queue_op_status sync_timed_queue<T, Clock>::nonblocking_pull(T& elem)
  {
    unique_lock<mutex> lk(super::mtx_, try_to_lock);
    if (! lk.owns_lock()) return queue_op_status::busy;
    return try_pull(lk, elem);
  }

} //end concurrent namespace

using concurrent::sync_timed_queue;

} //end boost namespace
#include <boost/config/abi_suffix.hpp>

#endif
