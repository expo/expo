// Copyright (C) 2014 Ian Forbed
// Copyright (C) 2014 Vicente J. Botet Escriba
//
//  Distributed under the Boost Software License, Version 1.0. (See accompanying
//  file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_THREAD_EXECUTORS_SCHEDULING_ADAPTOR_HPP
#define BOOST_THREAD_EXECUTORS_SCHEDULING_ADAPTOR_HPP

#include <boost/thread/executors/detail/scheduled_executor_base.hpp>

namespace boost
{
namespace executors
{

  template <typename Executor>
  class scheduling_adpator : public detail::scheduled_executor_base<>
  {
  private:
    Executor& _exec;
    thread _scheduler;
  public:

    scheduling_adpator(Executor& ex)
      : super(),
        _exec(ex),
        _scheduler(&super::loop, this) {}

    ~scheduling_adpator()
    {
      this->close();
      _scheduler.join();
    }

    Executor& underlying_executor()
    {
        return _exec;
    }

  private:
    typedef detail::scheduled_executor_base<> super;
  }; //end class

} //end executors

  using executors::scheduling_adpator;

} //end boost
#endif
