
// Copyright (C) 2003-2004 Jeremy B. Maitin-Shepard.
// Copyright (C) 2005-2011 Daniel James.
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)

//  See http://www.boost.org/libs/unordered for documentation

#ifndef BOOST_UNORDERED_UNORDERED_SET_HPP_INCLUDED
#define BOOST_UNORDERED_UNORDERED_SET_HPP_INCLUDED

#include <boost/config.hpp>
#if defined(BOOST_HAS_PRAGMA_ONCE)
#pragma once
#endif

#include <boost/unordered/detail/set.hpp>
#include <boost/functional/hash.hpp>
#include <boost/move/move.hpp>

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
#include <initializer_list>
#endif

#if defined(BOOST_MSVC)
#pragma warning(push)
#if BOOST_MSVC >= 1400
#pragma warning(disable:4396) //the inline specifier cannot be used when a
                              // friend declaration refers to a specialization
                              // of a function template
#endif
#endif

namespace boost
{
namespace unordered
{
    template <class T, class H, class P, class A>
    class unordered_set
    {
#if defined(BOOST_UNORDERED_USE_MOVE)
        BOOST_COPYABLE_AND_MOVABLE(unordered_set)
#endif
    public:

        typedef T key_type;
        typedef T value_type;
        typedef H hasher;
        typedef P key_equal;
        typedef A allocator_type;

    private:

        typedef boost::unordered::detail::set<A, T, H, P> types;
        typedef typename types::traits allocator_traits;
        typedef typename types::table table;

    public:

        typedef typename allocator_traits::pointer pointer;
        typedef typename allocator_traits::const_pointer const_pointer;

        typedef value_type& reference;
        typedef value_type const& const_reference;

        typedef std::size_t size_type;
        typedef std::ptrdiff_t difference_type;

        typedef typename table::cl_iterator const_local_iterator;
        typedef typename table::l_iterator local_iterator;
        typedef typename table::c_iterator const_iterator;
        typedef typename table::iterator iterator;

    private:

        table table_;

    public:

        // constructors

        unordered_set();

        explicit unordered_set(
                size_type,
                const hasher& = hasher(),
                const key_equal& = key_equal(),
                const allocator_type& = allocator_type());

        explicit unordered_set(
                size_type,
                const allocator_type&);

        explicit unordered_set(
                size_type,
                const hasher&,
                const allocator_type&);

        explicit unordered_set(allocator_type const&);

        template <class InputIt>
        unordered_set(InputIt, InputIt);

        template <class InputIt>
        unordered_set(
                InputIt, InputIt,
                size_type,
                const hasher& = hasher(),
                const key_equal& = key_equal());

        template <class InputIt>
        unordered_set(
                InputIt, InputIt,
                size_type,
                const hasher&,
                const key_equal&,
                const allocator_type&);

        template <class InputIt>
        unordered_set(
                InputIt, InputIt,
                size_type,
                const hasher&,
                const allocator_type&);

        template <class InputIt>
        unordered_set(
                InputIt, InputIt,
                size_type,
                const allocator_type&);

        // copy/move constructors

        unordered_set(unordered_set const&);

        unordered_set(unordered_set const&, allocator_type const&);
        unordered_set(BOOST_RV_REF(unordered_set), allocator_type const&);

#if defined(BOOST_UNORDERED_USE_MOVE)
        unordered_set(BOOST_RV_REF(unordered_set) other)
                BOOST_NOEXCEPT_IF(table::nothrow_move_constructible)
            : table_(other.table_, boost::unordered::detail::move_tag())
        {
        }
#elif !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        unordered_set(unordered_set&& other)
                BOOST_NOEXCEPT_IF(table::nothrow_move_constructible)
            : table_(other.table_, boost::unordered::detail::move_tag())
        {
        }
#endif

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
        unordered_set(
                std::initializer_list<value_type>,
                size_type = boost::unordered::detail::default_bucket_count,
                const hasher& = hasher(),
                const key_equal&l = key_equal(),
                const allocator_type& = allocator_type());
        unordered_set(
                std::initializer_list<value_type>,
                size_type,
                const hasher&,
                const allocator_type&);
        unordered_set(
                std::initializer_list<value_type>,
                size_type,
                const allocator_type&);
#endif

        // Destructor

        ~unordered_set() BOOST_NOEXCEPT;

        // Assign

#if defined(BOOST_UNORDERED_USE_MOVE)
        unordered_set& operator=(BOOST_COPY_ASSIGN_REF(unordered_set) x)
        {
            table_.assign(x.table_);
            return *this;
        }

        unordered_set& operator=(BOOST_RV_REF(unordered_set) x)
        {
            table_.move_assign(x.table_);
            return *this;
        }
#else
        unordered_set& operator=(unordered_set const& x)
        {
            table_.assign(x.table_);
            return *this;
        }

#if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        unordered_set& operator=(unordered_set&& x)
        {
            table_.move_assign(x.table_);
            return *this;
        }
#endif
#endif

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
        unordered_set& operator=(std::initializer_list<value_type>);
#endif

        allocator_type get_allocator() const BOOST_NOEXCEPT
        {
            return table_.node_alloc();
        }

        // size and capacity

        bool empty() const BOOST_NOEXCEPT
        {
            return table_.size_ == 0;
        }

        size_type size() const BOOST_NOEXCEPT
        {
            return table_.size_;
        }

        size_type max_size() const BOOST_NOEXCEPT;

        // iterators

        iterator begin() BOOST_NOEXCEPT
        {
            return iterator(table_.begin());
        }

        const_iterator begin() const BOOST_NOEXCEPT
        {
            return const_iterator(table_.begin());
        }

        iterator end() BOOST_NOEXCEPT
        {
            return iterator();
        }

        const_iterator end() const BOOST_NOEXCEPT
        {
            return const_iterator();
        }

        const_iterator cbegin() const BOOST_NOEXCEPT
        {
            return const_iterator(table_.begin());
        }

        const_iterator cend() const BOOST_NOEXCEPT
        {
            return const_iterator();
        }

        // emplace

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
        template <class... Args>
        std::pair<iterator, bool> emplace(BOOST_FWD_REF(Args)... args)
        {
            return table_.emplace(boost::forward<Args>(args)...);
        }

        template <class... Args>
        iterator emplace_hint(const_iterator hint, BOOST_FWD_REF(Args)... args)
        {
            return table_.emplace_hint(hint, boost::forward<Args>(args)...);
        }
#else

#if !BOOST_WORKAROUND(__SUNPRO_CC, BOOST_TESTED_AT(0x5100))

        // 0 argument emplace requires special treatment in case
        // the container is instantiated with a value type that
        // doesn't have a default constructor.

        std::pair<iterator, bool> emplace(
                boost::unordered::detail::empty_emplace
                    = boost::unordered::detail::empty_emplace(),
                value_type v = value_type())
        {
            return this->emplace(boost::move(v));
        }

        iterator emplace_hint(const_iterator hint,
                boost::unordered::detail::empty_emplace
                    = boost::unordered::detail::empty_emplace(),
                value_type v = value_type()
            )
        {
            return this->emplace_hint(hint, boost::move(v));
        }

#endif

        template <typename A0>
        std::pair<iterator, bool> emplace(BOOST_FWD_REF(A0) a0)
        {
            return table_.emplace(
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0))
            );
        }

        template <typename A0>
        iterator emplace_hint(const_iterator hint, BOOST_FWD_REF(A0) a0)
        {
            return table_.emplace_hint(hint,
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0))
            );
        }

        template <typename A0, typename A1>
        std::pair<iterator, bool> emplace(
            BOOST_FWD_REF(A0) a0,
            BOOST_FWD_REF(A1) a1)
        {
            return table_.emplace(
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0),
                    boost::forward<A1>(a1))
            );
        }

        template <typename A0, typename A1>
        iterator emplace_hint(const_iterator hint,
            BOOST_FWD_REF(A0) a0,
            BOOST_FWD_REF(A1) a1)
        {
            return table_.emplace_hint(hint,
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0),
                    boost::forward<A1>(a1))
            );
        }

        template <typename A0, typename A1, typename A2>
        std::pair<iterator, bool> emplace(
            BOOST_FWD_REF(A0) a0,
            BOOST_FWD_REF(A1) a1,
            BOOST_FWD_REF(A2) a2)
        {
            return table_.emplace(
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0),
                    boost::forward<A1>(a1),
                    boost::forward<A2>(a2))
            );
        }

        template <typename A0, typename A1, typename A2>
        iterator emplace_hint(const_iterator hint,
            BOOST_FWD_REF(A0) a0,
            BOOST_FWD_REF(A1) a1,
            BOOST_FWD_REF(A2) a2)
        {
            return table_.emplace_hint(hint,
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0),
                    boost::forward<A1>(a1),
                    boost::forward<A2>(a2))
            );
        }

#define BOOST_UNORDERED_EMPLACE(z, n, _)                                    \
            template <                                                      \
                BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)                    \
            >                                                               \
            std::pair<iterator, bool> emplace(                              \
                    BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_FWD_PARAM, a)      \
            )                                                               \
            {                                                               \
                return table_.emplace(                                      \
                    boost::unordered::detail::create_emplace_args(          \
                        BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_CALL_FORWARD,  \
                            a)                                              \
                ));                                                         \
            }                                                               \
                                                                            \
            template <                                                      \
                BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)                    \
            >                                                               \
            iterator emplace_hint(                                          \
                    const_iterator hint,                                    \
                    BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_FWD_PARAM, a)      \
            )                                                               \
            {                                                               \
                return table_.emplace_hint(hint,                            \
                    boost::unordered::detail::create_emplace_args(          \
                        BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_CALL_FORWARD,  \
                            a)                                              \
                ));                                                         \
            }

        BOOST_PP_REPEAT_FROM_TO(4, BOOST_UNORDERED_EMPLACE_LIMIT,
            BOOST_UNORDERED_EMPLACE, _)

#undef BOOST_UNORDERED_EMPLACE

#endif

        std::pair<iterator, bool> insert(value_type const& x)
        {
            return this->emplace(x);
        }

        std::pair<iterator, bool> insert(BOOST_UNORDERED_RV_REF(value_type) x)
        {
            return this->emplace(boost::move(x));
        }

        iterator insert(const_iterator hint, value_type const& x)
        {
            return this->emplace_hint(hint, x);
        }

        iterator insert(const_iterator hint,
                BOOST_UNORDERED_RV_REF(value_type) x)
        {
            return this->emplace_hint(hint, boost::move(x));
        }

        template <class InputIt> void insert(InputIt, InputIt);

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
        void insert(std::initializer_list<value_type>);
#endif

        iterator erase(const_iterator);
        size_type erase(const key_type&);
        iterator erase(const_iterator, const_iterator);
        void quick_erase(const_iterator it) { erase(it); }
        void erase_return_void(const_iterator it) { erase(it); }

        void clear();
        void swap(unordered_set&);

        // observers

        hasher hash_function() const;
        key_equal key_eq() const;

        // lookup

        const_iterator find(const key_type&) const;

        template <class CompatibleKey, class CompatibleHash,
            class CompatiblePredicate>
        const_iterator find(
                CompatibleKey const&,
                CompatibleHash const&,
                CompatiblePredicate const&) const;

        size_type count(const key_type&) const;

        std::pair<const_iterator, const_iterator>
        equal_range(const key_type&) const;

        // bucket interface

        size_type bucket_count() const BOOST_NOEXCEPT
        {
            return table_.bucket_count_;
        }

        size_type max_bucket_count() const BOOST_NOEXCEPT
        {
            return table_.max_bucket_count();
        }

        size_type bucket_size(size_type) const;

        size_type bucket(const key_type& k) const
        {
            return table_.hash_to_bucket(table_.hash(k));
        }

        local_iterator begin(size_type n)
        {
            return local_iterator(
                table_.begin(n), n, table_.bucket_count_);
        }

        const_local_iterator begin(size_type n) const
        {
            return const_local_iterator(
                table_.begin(n), n, table_.bucket_count_);
        }

        local_iterator end(size_type)
        {
            return local_iterator();
        }

        const_local_iterator end(size_type) const
        {
            return const_local_iterator();
        }

        const_local_iterator cbegin(size_type n) const
        {
            return const_local_iterator(
                table_.begin(n), n, table_.bucket_count_);
        }

        const_local_iterator cend(size_type) const
        {
            return const_local_iterator();
        }

        // hash policy

        float max_load_factor() const BOOST_NOEXCEPT
        {
            return table_.mlf_;
        }

        float load_factor() const BOOST_NOEXCEPT;
        void max_load_factor(float) BOOST_NOEXCEPT;
        void rehash(size_type);
        void reserve(size_type);

#if !BOOST_WORKAROUND(__BORLANDC__, < 0x0582)
        friend bool operator==<T,H,P,A>(
                unordered_set const&, unordered_set const&);
        friend bool operator!=<T,H,P,A>(
                unordered_set const&, unordered_set const&);
#endif
    }; // class template unordered_set

    template <class T, class H, class P, class A>
    class unordered_multiset
    {
#if defined(BOOST_UNORDERED_USE_MOVE)
        BOOST_COPYABLE_AND_MOVABLE(unordered_multiset)
#endif
    public:

        typedef T key_type;
        typedef T value_type;
        typedef H hasher;
        typedef P key_equal;
        typedef A allocator_type;

    private:

        typedef boost::unordered::detail::multiset<A, T, H, P> types;
        typedef typename types::traits allocator_traits;
        typedef typename types::table table;

    public:

        typedef typename allocator_traits::pointer pointer;
        typedef typename allocator_traits::const_pointer const_pointer;

        typedef value_type& reference;
        typedef value_type const& const_reference;

        typedef std::size_t size_type;
        typedef std::ptrdiff_t difference_type;

        typedef typename table::cl_iterator const_local_iterator;
        typedef typename table::l_iterator local_iterator;
        typedef typename table::c_iterator const_iterator;
        typedef typename table::iterator iterator;

    private:

        table table_;

    public:

        // constructors

        unordered_multiset();

        explicit unordered_multiset(
                size_type,
                const hasher& = hasher(),
                const key_equal& = key_equal(),
                const allocator_type& = allocator_type());

        explicit unordered_multiset(
                size_type,
                const allocator_type&);

        explicit unordered_multiset(
                size_type,
                const hasher&,
                const allocator_type&);

        explicit unordered_multiset(allocator_type const&);

        template <class InputIt>
        unordered_multiset(InputIt, InputIt);

        template <class InputIt>
        unordered_multiset(
                InputIt, InputIt,
                size_type,
                const hasher& = hasher(),
                const key_equal& = key_equal());

        template <class InputIt>
        unordered_multiset(
                InputIt, InputIt,
                size_type,
                const hasher&,
                const key_equal&,
                const allocator_type&);

        template <class InputIt>
        unordered_multiset(
                InputIt, InputIt,
                size_type,
                const hasher&,
                const allocator_type&);

        template <class InputIt>
        unordered_multiset(
                InputIt, InputIt,
                size_type,
                const allocator_type&);

        // copy/move constructors

        unordered_multiset(unordered_multiset const&);

        unordered_multiset(unordered_multiset const&, allocator_type const&);
        unordered_multiset(BOOST_RV_REF(unordered_multiset), allocator_type const&);

#if defined(BOOST_UNORDERED_USE_MOVE)
        unordered_multiset(BOOST_RV_REF(unordered_multiset) other)
                BOOST_NOEXCEPT_IF(table::nothrow_move_constructible)
            : table_(other.table_, boost::unordered::detail::move_tag())
        {
        }
#elif !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        unordered_multiset(unordered_multiset&& other)
                BOOST_NOEXCEPT_IF(table::nothrow_move_constructible)
            : table_(other.table_, boost::unordered::detail::move_tag())
        {
        }
#endif

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
        unordered_multiset(
                std::initializer_list<value_type>,
                size_type = boost::unordered::detail::default_bucket_count,
                const hasher& = hasher(),
                const key_equal&l = key_equal(),
                const allocator_type& = allocator_type());
        unordered_multiset(
                std::initializer_list<value_type>,
                size_type,
                const hasher&,
                const allocator_type&);
        unordered_multiset(
                std::initializer_list<value_type>,
                size_type,
                const allocator_type&);
#endif

        // Destructor

        ~unordered_multiset() BOOST_NOEXCEPT;

        // Assign

#if defined(BOOST_UNORDERED_USE_MOVE)
        unordered_multiset& operator=(
                BOOST_COPY_ASSIGN_REF(unordered_multiset) x)
        {
            table_.assign(x.table_);
            return *this;
        }

        unordered_multiset& operator=(BOOST_RV_REF(unordered_multiset) x)
        {
            table_.move_assign(x.table_);
            return *this;
        }
#else
        unordered_multiset& operator=(unordered_multiset const& x)
        {
            table_.assign(x.table_);
            return *this;
        }

#if !defined(BOOST_NO_CXX11_RVALUE_REFERENCES)
        unordered_multiset& operator=(unordered_multiset&& x)
        {
            table_.move_assign(x.table_);
            return *this;
        }
#endif
#endif

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
        unordered_multiset& operator=(std::initializer_list<value_type>);
#endif

        allocator_type get_allocator() const BOOST_NOEXCEPT
        {
            return table_.node_alloc();
        }

        // size and capacity

        bool empty() const BOOST_NOEXCEPT
        {
            return table_.size_ == 0;
        }

        size_type size() const BOOST_NOEXCEPT
        {
            return table_.size_;
        }

        size_type max_size() const BOOST_NOEXCEPT;

        // iterators

        iterator begin() BOOST_NOEXCEPT
        {
            return iterator(table_.begin());
        }

        const_iterator begin() const BOOST_NOEXCEPT
        {
            return const_iterator(table_.begin());
        }

        iterator end() BOOST_NOEXCEPT
        {
            return iterator();
        }

        const_iterator end() const BOOST_NOEXCEPT
        {
            return const_iterator();
        }

        const_iterator cbegin() const BOOST_NOEXCEPT
        {
            return const_iterator(table_.begin());
        }

        const_iterator cend() const BOOST_NOEXCEPT
        {
            return const_iterator();
        }

        // emplace

#if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
        template <class... Args>
        iterator emplace(BOOST_FWD_REF(Args)... args)
        {
            return table_.emplace(boost::forward<Args>(args)...);
        }

        template <class... Args>
        iterator emplace_hint(const_iterator hint, BOOST_FWD_REF(Args)... args)
        {
            return table_.emplace_hint(hint, boost::forward<Args>(args)...);
        }
#else

#if !BOOST_WORKAROUND(__SUNPRO_CC, BOOST_TESTED_AT(0x5100))

        // 0 argument emplace requires special treatment in case
        // the container is instantiated with a value type that
        // doesn't have a default constructor.

        iterator emplace(
                boost::unordered::detail::empty_emplace
                    = boost::unordered::detail::empty_emplace(),
                value_type v = value_type())
        {
            return this->emplace(boost::move(v));
        }

        iterator emplace_hint(const_iterator hint,
                boost::unordered::detail::empty_emplace
                    = boost::unordered::detail::empty_emplace(),
                value_type v = value_type()
            )
        {
            return this->emplace_hint(hint, boost::move(v));
        }

#endif

        template <typename A0>
        iterator emplace(BOOST_FWD_REF(A0) a0)
        {
            return table_.emplace(
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0))
            );
        }

        template <typename A0>
        iterator emplace_hint(const_iterator hint, BOOST_FWD_REF(A0) a0)
        {
            return table_.emplace_hint(hint,
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0))
            );
        }

        template <typename A0, typename A1>
        iterator emplace(
            BOOST_FWD_REF(A0) a0,
            BOOST_FWD_REF(A1) a1)
        {
            return table_.emplace(
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0),
                    boost::forward<A1>(a1))
            );
        }

        template <typename A0, typename A1>
        iterator emplace_hint(const_iterator hint,
            BOOST_FWD_REF(A0) a0,
            BOOST_FWD_REF(A1) a1)
        {
            return table_.emplace_hint(hint,
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0),
                    boost::forward<A1>(a1))
            );
        }

        template <typename A0, typename A1, typename A2>
        iterator emplace(
            BOOST_FWD_REF(A0) a0,
            BOOST_FWD_REF(A1) a1,
            BOOST_FWD_REF(A2) a2)
        {
            return table_.emplace(
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0),
                    boost::forward<A1>(a1),
                    boost::forward<A2>(a2))
            );
        }

        template <typename A0, typename A1, typename A2>
        iterator emplace_hint(const_iterator hint,
            BOOST_FWD_REF(A0) a0,
            BOOST_FWD_REF(A1) a1,
            BOOST_FWD_REF(A2) a2)
        {
            return table_.emplace_hint(hint,
                boost::unordered::detail::create_emplace_args(
                    boost::forward<A0>(a0),
                    boost::forward<A1>(a1),
                    boost::forward<A2>(a2))
            );
        }

#define BOOST_UNORDERED_EMPLACE(z, n, _)                                    \
            template <                                                      \
                BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)                    \
            >                                                               \
            iterator emplace(                                               \
                    BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_FWD_PARAM, a)      \
            )                                                               \
            {                                                               \
                return table_.emplace(                                      \
                    boost::unordered::detail::create_emplace_args(          \
                        BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_CALL_FORWARD,  \
                            a)                                              \
                ));                                                         \
            }                                                               \
                                                                            \
            template <                                                      \
                BOOST_PP_ENUM_PARAMS_Z(z, n, typename A)                    \
            >                                                               \
            iterator emplace_hint(                                          \
                    const_iterator hint,                                    \
                    BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_FWD_PARAM, a)      \
            )                                                               \
            {                                                               \
                return table_.emplace_hint(hint,                            \
                    boost::unordered::detail::create_emplace_args(          \
                        BOOST_PP_ENUM_##z(n, BOOST_UNORDERED_CALL_FORWARD,  \
                            a)                                              \
                ));                                                         \
            }

        BOOST_PP_REPEAT_FROM_TO(4, BOOST_UNORDERED_EMPLACE_LIMIT,
            BOOST_UNORDERED_EMPLACE, _)

#undef BOOST_UNORDERED_EMPLACE

#endif

        iterator insert(value_type const& x)
        {
            return this->emplace(x);
        }

        iterator insert(BOOST_UNORDERED_RV_REF(value_type) x)
        {
            return this->emplace(boost::move(x));
        }

        iterator insert(const_iterator hint, value_type const& x)
        {
            return this->emplace_hint(hint, x);
        }

        iterator insert(const_iterator hint,
                BOOST_UNORDERED_RV_REF(value_type) x)
        {
            return this->emplace_hint(hint, boost::move(x));
        }

        template <class InputIt> void insert(InputIt, InputIt);

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
        void insert(std::initializer_list<value_type>);
#endif

        iterator erase(const_iterator);
        size_type erase(const key_type&);
        iterator erase(const_iterator, const_iterator);
        void quick_erase(const_iterator it) { erase(it); }
        void erase_return_void(const_iterator it) { erase(it); }

        void clear();
        void swap(unordered_multiset&);

        // observers

        hasher hash_function() const;
        key_equal key_eq() const;

        // lookup

        const_iterator find(const key_type&) const;

        template <class CompatibleKey, class CompatibleHash,
            class CompatiblePredicate>
        const_iterator find(
                CompatibleKey const&,
                CompatibleHash const&,
                CompatiblePredicate const&) const;

        size_type count(const key_type&) const;

        std::pair<const_iterator, const_iterator>
        equal_range(const key_type&) const;

        // bucket interface

        size_type bucket_count() const BOOST_NOEXCEPT
        {
            return table_.bucket_count_;
        }

        size_type max_bucket_count() const BOOST_NOEXCEPT
        {
            return table_.max_bucket_count();
        }

        size_type bucket_size(size_type) const;

        size_type bucket(const key_type& k) const
        {
            return table_.hash_to_bucket(table_.hash(k));
        }

        local_iterator begin(size_type n)
        {
            return local_iterator(
                table_.begin(n), n, table_.bucket_count_);
        }

        const_local_iterator begin(size_type n) const
        {
            return const_local_iterator(
                table_.begin(n), n, table_.bucket_count_);
        }

        local_iterator end(size_type)
        {
            return local_iterator();
        }

        const_local_iterator end(size_type) const
        {
            return const_local_iterator();
        }

        const_local_iterator cbegin(size_type n) const
        {
            return const_local_iterator(
                table_.begin(n), n, table_.bucket_count_);
        }

        const_local_iterator cend(size_type) const
        {
            return const_local_iterator();
        }

        // hash policy

        float max_load_factor() const BOOST_NOEXCEPT
        {
            return table_.mlf_;
        }

        float load_factor() const BOOST_NOEXCEPT;
        void max_load_factor(float) BOOST_NOEXCEPT;
        void rehash(size_type);
        void reserve(size_type);

#if !BOOST_WORKAROUND(__BORLANDC__, < 0x0582)
        friend bool operator==<T,H,P,A>(
                unordered_multiset const&, unordered_multiset const&);
        friend bool operator!=<T,H,P,A>(
                unordered_multiset const&, unordered_multiset const&);
#endif
    }; // class template unordered_multiset

////////////////////////////////////////////////////////////////////////////////

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set()
      : table_(boost::unordered::detail::default_bucket_count, hasher(),
            key_equal(), allocator_type())
    {
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            size_type n, const hasher &hf, const key_equal &eql,
            const allocator_type &a)
      : table_(n, hf, eql, a)
    {
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            size_type n, const allocator_type &a)
      : table_(n, hasher(), key_equal(), a)
    {
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            size_type n, const hasher &hf, const allocator_type &a)
      : table_(n, hf, key_equal(), a)
    {
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(allocator_type const& a)
      : table_(boost::unordered::detail::default_bucket_count,
            hasher(), key_equal(), a)
    {
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            unordered_set const& other, allocator_type const& a)
      : table_(other.table_, a)
    {
    }

    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_set<T,H,P,A>::unordered_set(InputIt f, InputIt l)
      : table_(boost::unordered::detail::initial_size(f, l),
        hasher(), key_equal(), allocator_type())
    {
        table_.insert_range(f, l);
    }

    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_set<T,H,P,A>::unordered_set(
            InputIt f, InputIt l,
            size_type n,
            const hasher &hf,
            const key_equal &eql)
      : table_(boost::unordered::detail::initial_size(f, l, n),
            hf, eql, allocator_type())
    {
        table_.insert_range(f, l);
    }
    
    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_set<T,H,P,A>::unordered_set(
            InputIt f, InputIt l,
            size_type n,
            const hasher &hf,
            const key_equal &eql,
            const allocator_type &a)
      : table_(boost::unordered::detail::initial_size(f, l, n), hf, eql, a)
    {
        table_.insert_range(f, l);
    }
    
    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_set<T,H,P,A>::unordered_set(
            InputIt f, InputIt l,
            size_type n,
            const hasher &hf,
            const allocator_type &a)
      : table_(boost::unordered::detail::initial_size(f, l, n),
            hf, key_equal(), a)
    {
        table_.insert_range(f, l);
    }

    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_set<T,H,P,A>::unordered_set(
            InputIt f, InputIt l,
            size_type n,
            const allocator_type &a)
      : table_(boost::unordered::detail::initial_size(f, l, n),
            hasher(), key_equal(), a)
    {
        table_.insert_range(f, l);
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::~unordered_set() BOOST_NOEXCEPT {}

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            unordered_set const& other)
      : table_(other.table_)
    {
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            BOOST_RV_REF(unordered_set) other, allocator_type const& a)
      : table_(other.table_, a, boost::unordered::detail::move_tag())
    {
    }

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            std::initializer_list<value_type> list, size_type n,
            const hasher &hf, const key_equal &eql, const allocator_type &a)
      : table_(
            boost::unordered::detail::initial_size(
                list.begin(), list.end(), n),
            hf, eql, a)
    {
        table_.insert_range(list.begin(), list.end());
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            std::initializer_list<value_type> list, size_type n,
            const hasher &hf, const allocator_type &a)
      : table_(
            boost::unordered::detail::initial_size(
                list.begin(), list.end(), n),
            hf, key_equal(), a)
    {
        table_.insert_range(list.begin(), list.end());
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>::unordered_set(
            std::initializer_list<value_type> list, size_type n,
            const allocator_type &a)
      : table_(
            boost::unordered::detail::initial_size(
                list.begin(), list.end(), n),
            hasher(), key_equal(), a)
    {
        table_.insert_range(list.begin(), list.end());
    }

    template <class T, class H, class P, class A>
    unordered_set<T,H,P,A>& unordered_set<T,H,P,A>::operator=(
            std::initializer_list<value_type> list)
    {
        table_.clear();
        table_.insert_range(list.begin(), list.end());
        return *this;
    }

#endif

    // size and capacity

    template <class T, class H, class P, class A>
    std::size_t unordered_set<T,H,P,A>::max_size() const BOOST_NOEXCEPT
    {
        return table_.max_size();
    }

    // modifiers

    template <class T, class H, class P, class A>
    template <class InputIt>
    void unordered_set<T,H,P,A>::insert(InputIt first, InputIt last)
    {
        table_.insert_range(first, last);
    }

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
    template <class T, class H, class P, class A>
    void unordered_set<T,H,P,A>::insert(
            std::initializer_list<value_type> list)
    {
        table_.insert_range(list.begin(), list.end());
    }
#endif

    template <class T, class H, class P, class A>
    typename unordered_set<T,H,P,A>::iterator
        unordered_set<T,H,P,A>::erase(const_iterator position)
    {
        return table_.erase(position);
    }

    template <class T, class H, class P, class A>
    typename unordered_set<T,H,P,A>::size_type
        unordered_set<T,H,P,A>::erase(const key_type& k)
    {
        return table_.erase_key(k);
    }

    template <class T, class H, class P, class A>
    typename unordered_set<T,H,P,A>::iterator
        unordered_set<T,H,P,A>::erase(
            const_iterator first, const_iterator last)
    {
        return table_.erase_range(first, last);
    }

    template <class T, class H, class P, class A>
    void unordered_set<T,H,P,A>::clear()
    {
        table_.clear();
    }

    template <class T, class H, class P, class A>
    void unordered_set<T,H,P,A>::swap(unordered_set& other)
    {
        table_.swap(other.table_);
    }

    // observers

    template <class T, class H, class P, class A>
    typename unordered_set<T,H,P,A>::hasher
        unordered_set<T,H,P,A>::hash_function() const
    {
        return table_.hash_function();
    }

    template <class T, class H, class P, class A>
    typename unordered_set<T,H,P,A>::key_equal
        unordered_set<T,H,P,A>::key_eq() const
    {
        return table_.key_eq();
    }

    // lookup

    template <class T, class H, class P, class A>
    typename unordered_set<T,H,P,A>::const_iterator
        unordered_set<T,H,P,A>::find(const key_type& k) const
    {
        return const_iterator(table_.find_node(k));
    }

    template <class T, class H, class P, class A>
    template <class CompatibleKey, class CompatibleHash,
        class CompatiblePredicate>
    typename unordered_set<T,H,P,A>::const_iterator
        unordered_set<T,H,P,A>::find(
            CompatibleKey const& k,
            CompatibleHash const& hash,
            CompatiblePredicate const& eq) const
    {
        return const_iterator(table_.generic_find_node(k, hash, eq));
    }

    template <class T, class H, class P, class A>
    typename unordered_set<T,H,P,A>::size_type
        unordered_set<T,H,P,A>::count(const key_type& k) const
    {
        return table_.count(k);
    }

    template <class T, class H, class P, class A>
    std::pair<
            typename unordered_set<T,H,P,A>::const_iterator,
            typename unordered_set<T,H,P,A>::const_iterator>
        unordered_set<T,H,P,A>::equal_range(const key_type& k) const
    {
        return table_.equal_range(k);
    }

    template <class T, class H, class P, class A>
    typename unordered_set<T,H,P,A>::size_type
        unordered_set<T,H,P,A>::bucket_size(size_type n) const
    {
        return table_.bucket_size(n);
    }

    // hash policy

    template <class T, class H, class P, class A>
    float unordered_set<T,H,P,A>::load_factor() const BOOST_NOEXCEPT
    {
        return table_.load_factor();
    }

    template <class T, class H, class P, class A>
    void unordered_set<T,H,P,A>::max_load_factor(float m) BOOST_NOEXCEPT
    {
        table_.max_load_factor(m);
    }

    template <class T, class H, class P, class A>
    void unordered_set<T,H,P,A>::rehash(size_type n)
    {
        table_.rehash(n);
    }

    template <class T, class H, class P, class A>
    void unordered_set<T,H,P,A>::reserve(size_type n)
    {
        table_.reserve(n);
    }

    template <class T, class H, class P, class A>
    inline bool operator==(
            unordered_set<T,H,P,A> const& m1,
            unordered_set<T,H,P,A> const& m2)
    {
#if BOOST_WORKAROUND(__CODEGEARC__, BOOST_TESTED_AT(0x0613))
        struct dummy { unordered_set<T,H,P,A> x; };
#endif
        return m1.table_.equals(m2.table_);
    }

    template <class T, class H, class P, class A>
    inline bool operator!=(
            unordered_set<T,H,P,A> const& m1,
            unordered_set<T,H,P,A> const& m2)
    {
#if BOOST_WORKAROUND(__CODEGEARC__, BOOST_TESTED_AT(0x0613))
        struct dummy { unordered_set<T,H,P,A> x; };
#endif
        return !m1.table_.equals(m2.table_);
    }

    template <class T, class H, class P, class A>
    inline void swap(
            unordered_set<T,H,P,A> &m1,
            unordered_set<T,H,P,A> &m2)
    {
#if BOOST_WORKAROUND(__CODEGEARC__, BOOST_TESTED_AT(0x0613))
        struct dummy { unordered_set<T,H,P,A> x; };
#endif
        m1.swap(m2);
    }

////////////////////////////////////////////////////////////////////////////////

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset()
      : table_(boost::unordered::detail::default_bucket_count, hasher(),
            key_equal(), allocator_type())
    {
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            size_type n, const hasher &hf, const key_equal &eql,
            const allocator_type &a)
      : table_(n, hf, eql, a)
    {
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            size_type n, const allocator_type &a)
      : table_(n, hasher(), key_equal(), a)
    {
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            size_type n, const hasher &hf, const allocator_type &a)
      : table_(n, hf, key_equal(), a)
    {
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(allocator_type const& a)
      : table_(boost::unordered::detail::default_bucket_count,
            hasher(), key_equal(), a)
    {
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            unordered_multiset const& other, allocator_type const& a)
      : table_(other.table_, a)
    {
    }

    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_multiset<T,H,P,A>::unordered_multiset(InputIt f, InputIt l)
      : table_(boost::unordered::detail::initial_size(f, l),
        hasher(), key_equal(), allocator_type())
    {
        table_.insert_range(f, l);
    }

    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            InputIt f, InputIt l,
            size_type n,
            const hasher &hf,
            const key_equal &eql)
      : table_(boost::unordered::detail::initial_size(f, l, n),
            hf, eql, allocator_type())
    {
        table_.insert_range(f, l);
    }
    
    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            InputIt f, InputIt l,
            size_type n,
            const hasher &hf,
            const key_equal &eql,
            const allocator_type &a)
      : table_(boost::unordered::detail::initial_size(f, l, n), hf, eql, a)
    {
        table_.insert_range(f, l);
    }
    
    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            InputIt f, InputIt l,
            size_type n,
            const hasher &hf,
            const allocator_type &a)
      : table_(boost::unordered::detail::initial_size(f, l, n),
            hf, key_equal(), a)
    {
        table_.insert_range(f, l);
    }

    template <class T, class H, class P, class A>
    template <class InputIt>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            InputIt f, InputIt l,
            size_type n,
            const allocator_type &a)
      : table_(boost::unordered::detail::initial_size(f, l, n),
            hasher(), key_equal(), a)
    {
        table_.insert_range(f, l);
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::~unordered_multiset() BOOST_NOEXCEPT {}

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            unordered_multiset const& other)
      : table_(other.table_)
    {
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            BOOST_RV_REF(unordered_multiset) other, allocator_type const& a)
      : table_(other.table_, a, boost::unordered::detail::move_tag())
    {
    }

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            std::initializer_list<value_type> list, size_type n,
            const hasher &hf, const key_equal &eql, const allocator_type &a)
      : table_(
            boost::unordered::detail::initial_size(
                list.begin(), list.end(), n),
            hf, eql, a)
    {
        table_.insert_range(list.begin(), list.end());
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            std::initializer_list<value_type> list, size_type n,
            const hasher &hf, const allocator_type &a)
      : table_(
            boost::unordered::detail::initial_size(
                list.begin(), list.end(), n),
            hf, key_equal(), a)
    {
        table_.insert_range(list.begin(), list.end());
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>::unordered_multiset(
            std::initializer_list<value_type> list, size_type n,
            const allocator_type &a)
      : table_(
            boost::unordered::detail::initial_size(
                list.begin(), list.end(), n),
            hasher(), key_equal(), a)
    {
        table_.insert_range(list.begin(), list.end());
    }

    template <class T, class H, class P, class A>
    unordered_multiset<T,H,P,A>& unordered_multiset<T,H,P,A>::operator=(
            std::initializer_list<value_type> list)
    {
        table_.clear();
        table_.insert_range(list.begin(), list.end());
        return *this;
    }

#endif

    // size and capacity

    template <class T, class H, class P, class A>
    std::size_t unordered_multiset<T,H,P,A>::max_size() const BOOST_NOEXCEPT
    {
        return table_.max_size();
    }

    // modifiers

    template <class T, class H, class P, class A>
    template <class InputIt>
    void unordered_multiset<T,H,P,A>::insert(InputIt first, InputIt last)
    {
        table_.insert_range(first, last);
    }

#if !defined(BOOST_NO_CXX11_HDR_INITIALIZER_LIST)
    template <class T, class H, class P, class A>
    void unordered_multiset<T,H,P,A>::insert(
            std::initializer_list<value_type> list)
    {
        table_.insert_range(list.begin(), list.end());
    }
#endif

    template <class T, class H, class P, class A>
    typename unordered_multiset<T,H,P,A>::iterator
        unordered_multiset<T,H,P,A>::erase(const_iterator position)
    {
        return table_.erase(position);
    }

    template <class T, class H, class P, class A>
    typename unordered_multiset<T,H,P,A>::size_type
        unordered_multiset<T,H,P,A>::erase(const key_type& k)
    {
        return table_.erase_key(k);
    }

    template <class T, class H, class P, class A>
    typename unordered_multiset<T,H,P,A>::iterator
        unordered_multiset<T,H,P,A>::erase(
                const_iterator first, const_iterator last)
    {
        return table_.erase_range(first, last);
    }

    template <class T, class H, class P, class A>
    void unordered_multiset<T,H,P,A>::clear()
    {
        table_.clear();
    }

    template <class T, class H, class P, class A>
    void unordered_multiset<T,H,P,A>::swap(unordered_multiset& other)
    {
        table_.swap(other.table_);
    }

    // observers

    template <class T, class H, class P, class A>
    typename unordered_multiset<T,H,P,A>::hasher
        unordered_multiset<T,H,P,A>::hash_function() const
    {
        return table_.hash_function();
    }

    template <class T, class H, class P, class A>
    typename unordered_multiset<T,H,P,A>::key_equal
        unordered_multiset<T,H,P,A>::key_eq() const
    {
        return table_.key_eq();
    }

    // lookup

    template <class T, class H, class P, class A>
    typename unordered_multiset<T,H,P,A>::const_iterator
        unordered_multiset<T,H,P,A>::find(const key_type& k) const
    {
        return const_iterator(table_.find_node(k));
    }

    template <class T, class H, class P, class A>
    template <class CompatibleKey, class CompatibleHash,
        class CompatiblePredicate>
    typename unordered_multiset<T,H,P,A>::const_iterator
        unordered_multiset<T,H,P,A>::find(
            CompatibleKey const& k,
            CompatibleHash const& hash,
            CompatiblePredicate const& eq) const
    {
        return const_iterator(table_.generic_find_node(k, hash, eq));
    }

    template <class T, class H, class P, class A>
    typename unordered_multiset<T,H,P,A>::size_type
        unordered_multiset<T,H,P,A>::count(const key_type& k) const
    {
        return table_.count(k);
    }

    template <class T, class H, class P, class A>
    std::pair<
            typename unordered_multiset<T,H,P,A>::const_iterator,
            typename unordered_multiset<T,H,P,A>::const_iterator>
        unordered_multiset<T,H,P,A>::equal_range(const key_type& k) const
    {
        return table_.equal_range(k);
    }

    template <class T, class H, class P, class A>
    typename unordered_multiset<T,H,P,A>::size_type
        unordered_multiset<T,H,P,A>::bucket_size(size_type n) const
    {
        return table_.bucket_size(n);
    }

    // hash policy

    template <class T, class H, class P, class A>
    float unordered_multiset<T,H,P,A>::load_factor() const BOOST_NOEXCEPT
    {
        return table_.load_factor();
    }

    template <class T, class H, class P, class A>
    void unordered_multiset<T,H,P,A>::max_load_factor(float m) BOOST_NOEXCEPT
    {
        table_.max_load_factor(m);
    }

    template <class T, class H, class P, class A>
    void unordered_multiset<T,H,P,A>::rehash(size_type n)
    {
        table_.rehash(n);
    }

    template <class T, class H, class P, class A>
    void unordered_multiset<T,H,P,A>::reserve(size_type n)
    {
        table_.reserve(n);
    }

    template <class T, class H, class P, class A>
    inline bool operator==(
            unordered_multiset<T,H,P,A> const& m1,
            unordered_multiset<T,H,P,A> const& m2)
    {
#if BOOST_WORKAROUND(__CODEGEARC__, BOOST_TESTED_AT(0x0613))
        struct dummy { unordered_multiset<T,H,P,A> x; };
#endif
        return m1.table_.equals(m2.table_);
    }

    template <class T, class H, class P, class A>
    inline bool operator!=(
            unordered_multiset<T,H,P,A> const& m1,
            unordered_multiset<T,H,P,A> const& m2)
    {
#if BOOST_WORKAROUND(__CODEGEARC__, BOOST_TESTED_AT(0x0613))
        struct dummy { unordered_multiset<T,H,P,A> x; };
#endif
        return !m1.table_.equals(m2.table_);
    }

    template <class T, class H, class P, class A>
    inline void swap(
            unordered_multiset<T,H,P,A> &m1,
            unordered_multiset<T,H,P,A> &m2)
    {
#if BOOST_WORKAROUND(__CODEGEARC__, BOOST_TESTED_AT(0x0613))
        struct dummy { unordered_multiset<T,H,P,A> x; };
#endif
        m1.swap(m2);
    }
} // namespace unordered
} // namespace boost

#if defined(BOOST_MSVC)
#pragma warning(pop)
#endif

#endif // BOOST_UNORDERED_UNORDERED_SET_HPP_INCLUDED
