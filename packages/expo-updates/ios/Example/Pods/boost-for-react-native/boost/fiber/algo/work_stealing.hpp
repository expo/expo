
//          Copyright Oliver Kowalke 2015.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_FIBERS_ALGO_WORK_STEALING_H
#define BOOST_FIBERS_ALGO_WORK_STEALING_H

#include <condition_variable>
#include <chrono>
#include <cstddef>
#include <mutex>
#include <vector>

#include <boost/config.hpp>

#include <boost/fiber/algo/algorithm.hpp>
#include <boost/fiber/detail/context_spmc_queue.hpp>
#include <boost/fiber/context.hpp>
#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/scheduler.hpp>

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_PREFIX
#endif

namespace boost {
namespace fibers {
namespace algo {

class work_stealing : public algorithm {
private:
    typedef scheduler::ready_queue_t lqueue_t;

    static std::vector< work_stealing * >        schedulers_;

    std::size_t                                     idx_;
    std::size_t                                     max_idx_;
    detail::context_spmc_queue                      rqueue_{};
    lqueue_t                                        lqueue_{};
    std::mutex                                      mtx_{};
    std::condition_variable                         cnd_{};
    bool                                            flag_{ false };
    bool                                            suspend_;

    static void init_( std::size_t max_idx);

public:
    work_stealing( std::size_t max_idx, std::size_t idx, bool suspend = false);

	work_stealing( work_stealing const&) = delete;
	work_stealing( work_stealing &&) = delete;

	work_stealing & operator=( work_stealing const&) = delete;
	work_stealing & operator=( work_stealing &&) = delete;

    void awakened( context * ctx) noexcept;

    context * pick_next() noexcept;

    context * steal() noexcept {
        return rqueue_.pop();
    }

    bool has_ready_fibers() const noexcept {
        return ! rqueue_.empty() || ! lqueue_.empty();
    }

	void suspend_until( std::chrono::steady_clock::time_point const& time_point) noexcept;

	void notify() noexcept;
};

}}}

#ifdef BOOST_HAS_ABI_HEADERS
#  include BOOST_ABI_SUFFIX
#endif

#endif // BOOST_FIBERS_ALGO_WORK_STEALING_H
