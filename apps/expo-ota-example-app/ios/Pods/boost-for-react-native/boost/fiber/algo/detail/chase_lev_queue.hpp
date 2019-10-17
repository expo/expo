
//          Copyright Oliver Kowalke 2013.
// Distributed under the Boost Software License, Version 1.0.
//    (See accompanying file LICENSE_1_0.txt or copy at
//          http://www.boost.org/LICENSE_1_0.txt)

#ifndef BOOST_FIBERS_ALGO_DETAIL_CHASE_LEV_QUEUE_H
#define BOOST_FIBERS_ALGO_DETAIL_CHASE_LEV_QUEUE_H

#include <atomic>
#include <cstddef>
#include <memory>
#include <type_traits>
#include <vector>

#include <boost/assert.hpp>
#include <boost/config.hpp>

#include <boost/fiber/detail/config.hpp>
#include <boost/fiber/context.hpp>

// David Chase and Yossi Lev. Dynamic circular work-stealing deque.
// In SPAA ’05: Proceedings of the seventeenth annual ACM symposium
// on Parallelism in algorithms and architectures, pages 21–28,
// New York, NY, USA, 2005. ACM.
//
// Nhat Minh Lê, Antoniu Pop, Albert Cohen, and Francesco Zappa Nardelli. 2013.
// Correct and efficient work-stealing for weak memory models.
// In Proceedings of the 18th ACM SIGPLAN symposium on Principles and practice
// of parallel programming (PPoPP '13). ACM, New York, NY, USA, 69-80.
namespace boost {
namespace fibers {
namespace algo {
namespace detail {

class chase_lev_queue {
private:
	class circular_buffer {
    private:
        typedef typename std::aligned_storage< sizeof( context *), alignof( context *) >::type    storage_t;

        int64_t                                 size_;
        context                             **  items;
		chase_lev_queue                     *   queue_;

	public:
		circular_buffer( int64_t size, chase_lev_queue * queue) noexcept :
            size_{ size },
            items{ reinterpret_cast< context ** >( new storage_t[size_] ) },
            queue_{ queue } {
        }

        ~circular_buffer() {
            delete [] reinterpret_cast< storage_t * >( items);
        }

		int64_t size() const noexcept {
			return size_;
		}

        context * get( int64_t idx) noexcept {
            BOOST_ASSERT( 0 <= idx);
			return * (items + (idx & (size() - 1)));
		}

		void put( int64_t idx, context * ctx) noexcept {
            BOOST_ASSERT( 0 <= idx);
			* (items + (idx & (size() - 1))) = ctx;
		}

		circular_buffer * grow( int64_t top, int64_t bottom) {
            BOOST_ASSERT( 0 <= top);
            BOOST_ASSERT( 0 <= bottom);
			circular_buffer * buffer = new circular_buffer{ size() * 2, queue_ };
			queue_->old_buffers_.push_back( this);
			for ( int64_t i = top; i != bottom; ++i) {
				buffer->put( i, get( i) );
            }
			return buffer;
		}
	};

	std::atomic< int64_t >             top_{ 0 };
	std::atomic< int64_t >             bottom_{ 0 };
	std::atomic< circular_buffer * >   buffer_;
    std::vector< circular_buffer * >   old_buffers_;

public:
	chase_lev_queue() :
        buffer_{ new circular_buffer{ 1024, this } } {
        old_buffers_.resize( 10);
    }

	~chase_lev_queue() {
        delete buffer_.load( std::memory_order_seq_cst);
        for ( circular_buffer * buffer : old_buffers_) {
            delete buffer;
        }
    }

    chase_lev_queue( chase_lev_queue const&) = delete;
    chase_lev_queue( chase_lev_queue &&) = delete;

    chase_lev_queue & operator=( chase_lev_queue const&) = delete;
    chase_lev_queue & operator=( chase_lev_queue &&) = delete;

    bool empty() const noexcept {
		int64_t bottom = bottom_.load( std::memory_order_relaxed);
		int64_t top = top_.load( std::memory_order_relaxed);
		return bottom <= top;
    }

	void push( context * ctx) {
		int64_t bottom = bottom_.load( std::memory_order_relaxed);
		int64_t top = top_.load( std::memory_order_acquire);
		circular_buffer * buffer = buffer_.load( std::memory_order_relaxed);
		if ( (bottom - top) > buffer->size() - 1) {
            // queue is full
			buffer = buffer->grow( top, bottom);
			buffer_.store( buffer, std::memory_order_release);
		}
		buffer->put( bottom, ctx);
		std::atomic_thread_fence( std::memory_order_release);
		bottom_.store( bottom + 1, std::memory_order_relaxed);
	}

    context * pop() {
		int64_t bottom = bottom_.load( std::memory_order_relaxed) - 1;
		circular_buffer * buffer = buffer_.load( std::memory_order_relaxed);
		bottom_.store( bottom, std::memory_order_relaxed);
		std::atomic_thread_fence( std::memory_order_seq_cst);
		int64_t top = top_.load( std::memory_order_relaxed);
        context * ctx = nullptr;
		if ( top <= bottom) {
            // queue is not empty
            ctx = buffer->get( bottom);
            // last element
            if ( top == bottom) {
                if ( ! top_.compare_exchange_strong( top, top + 1,
                                                     std::memory_order_seq_cst, std::memory_order_relaxed) ) {
                    return nullptr;
                }
                bottom_.store( bottom + 1, std::memory_order_relaxed);
            }
        } else {
            // queue is empty
            bottom_.store( bottom + 1, std::memory_order_relaxed);
        }
		return ctx;
	}

    context * steal() {
		int64_t top = top_.load( std::memory_order_acquire);
		std::atomic_thread_fence( std::memory_order_seq_cst);
		int64_t bottom = bottom_.load( std::memory_order_acquire);
        context * ctx = nullptr;
		if ( top < bottom) {
            // queue is not empty
			circular_buffer * buffer = buffer_.load( std::memory_order_consume);
            ctx = buffer->get( top);
			if ( ! top_.compare_exchange_strong( top, top + 1,
                                                 std::memory_order_seq_cst, std::memory_order_relaxed) ) {
				return nullptr;
            }
		}
        return ctx;
	}
};

}}}}

#endif // #define BOOST_FIBERS_ALGO_DETAIL_CHASE_LEV_QUEUE_H
