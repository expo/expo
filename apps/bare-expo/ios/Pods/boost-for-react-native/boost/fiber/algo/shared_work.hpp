
//          Copyright Nat Goodspeed + Oliver Kowalke 2015.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_ALGO_SHARED_WORK_H
#define BOOST_FIBERS_ALGO_SHARED_WORK_H

#include <condition_variable>
#include <chrono>
#include <deque>
#include <mutex>

#include <boost/config.hpp>

#include <boost/fiber/algo/algorithm.hpp>
#include <boost/fiber/context.hpp>
#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/scheduler.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

#ifdef _MSC_VER
# pragma warning(push)
# pragma warning(disable:4251)
#endif

namespace boost {
namespace fibers {
namespace algo {

class BOOST_FIBERS_DECL shared_work : public algorithm {
private:
    typedef std::deque< context * >  rqueue_t;
    typedef scheduler::ready_queue_t lqueue_t;

    static rqueue_t     	rqueue_;
    static std::mutex   	rqueue_mtx_;

    lqueue_t            	lqueue_{};
    std::mutex              mtx_{};
    std::condition_variable cnd_{};
    bool                    flag_{ false };
    bool                    suspend_;

public:
    shared_work() = default;

    shared_work( bool suspend) :
        suspend_{ suspend } {
    }

	shared_work( shared_work const&) = delete;
	shared_work( shared_work &&) = delete;

	shared_work & operator=( shared_work const&) = delete;
	shared_work & operator=( shared_work &&) = delete;

    void awakened( context * ctx) noexcept;

    context * pick_next() noexcept;

    bool has_ready_fibers() const noexcept {
        std::unique_lock< std::mutex > lock( rqueue_mtx_);
        return ! rqueue_.empty() || ! lqueue_.empty();
    }

	void suspend_until( std::chrono::steady_clock::time_point const& time_point) noexcept;

	void notify() noexcept;
};

}}}

#ifdef _MSC_VER
# pragma warning(pop)
#endif

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_ALGO_SHARED_WORK_H
