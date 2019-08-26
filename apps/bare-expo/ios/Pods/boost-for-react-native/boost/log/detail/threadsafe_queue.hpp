/*
 *          Copyright Andrey Semashev 2007 - 2015.
 * Distributed under the Boost Software License, Version 1.0.
 *    (See accompanying file LICENSE_1_0.txt or copy at
 *          http://www.boost.org/LICENSE_1_0.txt)
 */
/*!
 * \file   threadsafe_queue.hpp
 * \author Andrey Semashev
 * \date   05.11.2010
 *
 * \brief  This header is the Boost.Log library implementation, see the library documentation
 *         at http://www.boost.org/doc/libs/release/libs/log/doc/html/index.html.
 */

#ifndef BOOST_LOG_DETAIL_THREADSAFE_QUEUE_HPP_INCLUDED_
#define BOOST_LOG_DETAIL_THREADSAFE_QUEUE_HPP_INCLUDED_

#include <boost/log/detail/config.hpp>

#ifdef BOOST_HAS_PRAGMA_ONCE
#pragma once
#endif

#ifndef BOOST_LOG_NO_THREADS

#include <new>
#include <memory>
#include <cstddef>
#include <boost/aligned_storage.hpp>
#include <boost/move/core.hpp>
#include <boost/move/utility_core.hpp>
#include <boost/type_traits/alignment_of.hpp>
#include <boost/type_traits/type_with_alignment.hpp>
#include <boost/log/detail/header.hpp>

namespace boost {

BOOST_LOG_OPEN_NAMESPACE

namespace aux {

//! Base class for the thread-safe queue implementation
struct threadsafe_queue_impl
{
    struct BOOST_LOG_MAY_ALIAS pointer_storage
    {
        union
        {
            void* data[2];
            type_with_alignment< 2 * sizeof(void*) >::type alignment;
        };
    };

    struct node_base
    {
        pointer_storage next;
    };

    static BOOST_LOG_API threadsafe_queue_impl* create(node_base* first_node);

    static BOOST_LOG_API void* operator new (std::size_t size);
    static BOOST_LOG_API void operator delete (void* p, std::size_t);

    virtual ~threadsafe_queue_impl() {}
    virtual node_base* reset_last_node() = 0;
    virtual bool unsafe_empty() = 0;
    virtual void push(node_base* p) = 0;
    virtual bool try_pop(node_base*& node_to_free, node_base*& node_with_value) = 0;
};

//! A helper class to compose some of the types used by the queue
template< typename T, typename AllocatorT >
struct threadsafe_queue_types
{
    struct node :
        public threadsafe_queue_impl::node_base
    {
        typedef typename aligned_storage< sizeof(T), alignment_of< T >::value >::type storage_type;
        storage_type storage;

        node() {}
        explicit node(T const& val) { new (storage.address()) T(val); }
        T& value() { return *static_cast< T* >(storage.address()); }
        void destroy() { static_cast< T* >(storage.address())->~T(); }
    };

    typedef typename AllocatorT::BOOST_NESTED_TEMPLATE rebind< node >::other allocator_type;
};

/*!
 * \brief An unbounded thread-safe queue
 *
 * The implementation is based on algorithms published in the "Simple, Fast,
 * and Practical Non-Blocking and Blocking Concurrent Queue Algorithms" article
 * in PODC96 by Maged M. Michael and Michael L. Scott. Pseudocode is available here:
 * http://www.cs.rochester.edu/research/synchronization/pseudocode/queues.html
 *
 * The implementation provides thread-safe \c push and \c try_pop operations, as well as
 * a thread-unsafe \c empty operation. The queue imposes the following requirements
 * on the element type:
 *
 * \li Default constructible, the default constructor must not throw.
 * \li Copy constructible.
 * \li Movable (i.e. there should be an efficient move assignment for this type).
 *
 * The last requirement is not mandatory but is crucial for decent performance.
 */
template< typename T, typename AllocatorT = std::allocator< void > >
class threadsafe_queue :
    private threadsafe_queue_types< T, AllocatorT >::allocator_type
{
private:
    typedef typename threadsafe_queue_types< T, AllocatorT >::allocator_type base_type;
    typedef typename threadsafe_queue_types< T, AllocatorT >::node node;

    //! A simple scope guard to automate memory reclaiming
    struct auto_deallocate;
    friend struct auto_deallocate;
    struct auto_deallocate
    {
        auto_deallocate(base_type* alloc, node* dealloc, node* destr) :
            m_pAllocator(alloc),
            m_pDeallocate(dealloc),
            m_pDestroy(destr)
        {
        }
        ~auto_deallocate()
        {
            m_pAllocator->deallocate(m_pDeallocate, 1);
            m_pDestroy->destroy();
        }

    private:
        base_type* m_pAllocator;
        node* m_pDeallocate;
        node* m_pDestroy;
    };

public:
    typedef T value_type;
    typedef T& reference;
    typedef T const& const_reference;
    typedef T* pointer;
    typedef T const* const_pointer;
    typedef std::ptrdiff_t difference_type;
    typedef std::size_t size_type;
    typedef AllocatorT allocator_type;

public:
    /*!
     * Default constructor, creates an empty queue. Unlike most containers,
     * the constructor requires memory allocation.
     *
     * \throw std::bad_alloc if there is not sufficient memory
     */
    threadsafe_queue(base_type const& alloc = base_type()) :
        base_type(alloc)
    {
        node* p = base_type::allocate(1);
        if (p)
        {
            try
            {
                new (p) node();
                try
                {
                    m_pImpl = threadsafe_queue_impl::create(p);
                }
                catch (...)
                {
                    p->~node();
                    throw;
                }
            }
            catch (...)
            {
                base_type::deallocate(p, 1);
                throw;
            }
        }
        else
            throw std::bad_alloc();
    }
    /*!
     * Destructor
     */
    ~threadsafe_queue()
    {
        // Clear the queue
        if (!unsafe_empty())
        {
            value_type value;
            while (try_pop(value));
        }

        // Remove the last dummy node
        node* p = static_cast< node* >(m_pImpl->reset_last_node());
        p->~node();
        base_type::deallocate(p, 1);

        delete m_pImpl;
    }

    /*!
     * Checks if the queue is empty. Not thread-safe, the returned result may not be actual.
     */
    bool unsafe_empty() const { return m_pImpl->unsafe_empty(); }

    /*!
     * Puts a new element to the end of the queue. Thread-safe, can be called
     * concurrently by several threads, and concurrently with the \c pop operation.
     */
    void push(const_reference value)
    {
        node* p = base_type::allocate(1);
        if (p)
        {
            try
            {
                new (p) node(value);
            }
            catch (...)
            {
                base_type::deallocate(p, 1);
                throw;
            }
            m_pImpl->push(p);
        }
        else
            throw std::bad_alloc();
    }

    /*!
     * Attempts to pop an element from the beginning of the queue. Thread-safe, can
     * be called concurrently with the \c push operation. Should not be called by
     * several threads concurrently.
     */
    bool try_pop(reference value)
    {
        threadsafe_queue_impl::node_base *dealloc, *destr;
        if (m_pImpl->try_pop(dealloc, destr))
        {
            node* p = static_cast< node* >(destr);
            auto_deallocate guard(static_cast< base_type* >(this), static_cast< node* >(dealloc), p);
            value = boost::move(p->value());
            return true;
        }
        else
            return false;
    }

    // Copying and assignment is prohibited
    BOOST_DELETED_FUNCTION(threadsafe_queue(threadsafe_queue const&))
    BOOST_DELETED_FUNCTION(threadsafe_queue& operator= (threadsafe_queue const&))

private:
    //! Pointer to the implementation
    threadsafe_queue_impl* m_pImpl;
};

} // namespace aux

BOOST_LOG_CLOSE_NAMESPACE // namespace log

} // namespace boost

#include <boost/log/detail/footer.hpp>

#endif // BOOST_LOG_NO_THREADS

#endif // BOOST_LOG_DETAIL_THREADSAFE_QUEUE_HPP_INCLUDED_
