/*
 * Copyright (c) 2012-2014 Glen Joseph Fernandes
 * glenfe at live dot com
 *
 * Distributed under the Boost Software License,
 * Version 1.0. (See accompanying file LICENSE_1_0.txt
 * or copy at http://boost.org/LICENSE_1_0.txt)
 */
#ifndef BOOST_SMART_PTR_ALLOCATE_SHARED_ARRAY_HPP
#define BOOST_SMART_PTR_ALLOCATE_SHARED_ARRAY_HPP

#include <boost/smart_ptr/detail/array_count_impl.hpp>
#include <boost/smart_ptr/detail/sp_if_array.hpp>

namespace boost {
    template<class T, class A>
    inline typename boost::detail::sp_if_array<T>::type
    allocate_shared(const A& allocator, std::size_t size) {
        typedef typename boost::detail::array_inner<T>::type T1;
        typedef typename boost::detail::array_base<T1>::type T2;
        typedef boost::detail::ms_init_tag R1;
        typedef boost::detail::as_allocator<A, T, R1> A1;
        typedef boost::detail::ms_in_allocator_tag D1;
        std::size_t n1 = size * boost::detail::array_total<T1>::size;
        T1* p1 = 0;
        T2* p2 = 0;
        D1 d1;
        A1 a1(allocator, size, &p2);
        shared_ptr<T> s1(p1, d1, a1);
        A1* a2 = static_cast<A1*>(s1._internal_get_untyped_deleter());
        a2->set(0);
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
        boost::detail::as_init(allocator, p2, n1);
#else
        boost::detail::ms_init(p2, n1);
#endif
        a2->set(p2);
        p1 = reinterpret_cast<T1*>(p2);
        return shared_ptr<T>(s1, p1);
    }

    template<class T, class A>
    inline typename boost::detail::sp_if_size_array<T>::type
    allocate_shared(const A& allocator) {
        typedef typename boost::detail::array_inner<T>::type T1;
        typedef typename boost::detail::array_base<T1>::type T2;
        typedef boost::detail::ms_init_tag R1;
        typedef boost::detail::as_allocator<A, T, R1> A1;
        typedef boost::detail::ms_in_allocator_tag D1;
        enum {
            N = boost::detail::array_total<T>::size
        };
        T1* p1 = 0;
        T2* p2 = 0;
        D1 d1;
        A1 a1(allocator, &p2);
        shared_ptr<T> s1(p1, d1, a1);
        A1* a2 = static_cast<A1*>(s1._internal_get_untyped_deleter());
        a2->set(0);
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
        boost::detail::as_init(allocator, p2, N);
#else
        boost::detail::ms_init(p2, N);
#endif
        a2->set(p2);
        p1 = reinterpret_cast<T1*>(p2);
        return shared_ptr<T>(s1, p1);
    }

    template<class T, class A>
    inline typename boost::detail::sp_if_array<T>::type
    allocate_shared(const A& allocator, std::size_t size,
        const typename boost::detail::array_inner<T>::type& value) {
        typedef typename boost::detail::array_inner<T>::type T1;
        typedef typename boost::detail::array_base<T1>::type T2;
        typedef const T2 T3;
        typedef boost::detail::ms_init_tag R1;
        typedef boost::detail::as_allocator<A, T, R1> A1;
        typedef boost::detail::ms_in_allocator_tag D1;
        enum {
            M = boost::detail::array_total<T1>::size
        };
        std::size_t n1 = M * size;
        T1* p1 = 0;
        T2* p2 = 0;
        T3* p3 = reinterpret_cast<T3*>(&value);
        D1 d1;
        A1 a1(allocator, size, &p2);
        shared_ptr<T> s1(p1, d1, a1);
        A1* a2 = static_cast<A1*>(s1._internal_get_untyped_deleter());
        a2->set(0);
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
        boost::detail::as_init<T2, A, M>(allocator, p2, n1, p3);
#else
        boost::detail::ms_init<T2, M>(p2, n1, p3);
#endif
        a2->set(p2);
        p1 = reinterpret_cast<T1*>(p2);
        return shared_ptr<T>(s1, p1);
    }

    template<class T, class A>
    inline typename boost::detail::sp_if_size_array<T>::type
    allocate_shared(const A& allocator, 
        const typename boost::detail::array_inner<T>::type& value) {
        typedef typename boost::detail::array_inner<T>::type T1;
        typedef typename boost::detail::array_base<T1>::type T2;
        typedef const T2 T3;
        typedef boost::detail::ms_init_tag R1;
        typedef boost::detail::as_allocator<A, T, R1> A1;
        typedef boost::detail::ms_in_allocator_tag D1;
        enum {
            N = boost::detail::array_total<T>::size,
            M = boost::detail::array_total<T1>::size
        };
        T1* p1 = 0;
        T2* p2 = 0;
        T3* p3 = reinterpret_cast<T3*>(&value);
        D1 d1;
        A1 a1(allocator, &p2);
        shared_ptr<T> s1(p1, d1, a1);
        A1* a2 = static_cast<A1*>(s1._internal_get_untyped_deleter());
        a2->set(0);
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
        boost::detail::as_init<T2, A, M>(allocator, p2, N, p3);
#else
        boost::detail::ms_init<T2,  M>(p2, N, p3);
#endif
        a2->set(p2);
        p1 = reinterpret_cast<T1*>(p2);
        return shared_ptr<T>(s1, p1);
    }

    template<class T, class A>
    inline typename boost::detail::sp_if_array<T>::type
    allocate_shared_noinit(const A& allocator, std::size_t size) {
        typedef typename boost::detail::array_inner<T>::type T1;
        typedef typename boost::detail::array_base<T1>::type T2;
        typedef boost::detail::ms_noinit_tag R1;
        typedef boost::detail::as_allocator<A, T, R1> A1;
        typedef boost::detail::ms_in_allocator_tag D1;
        std::size_t n1 = size * boost::detail::array_total<T1>::size;
        T1* p1 = 0;
        T2* p2 = 0;
        D1 d1;
        A1 a1(allocator, size, &p2);
        shared_ptr<T> s1(p1, d1, a1);
        A1* a2 = static_cast<A1*>(s1._internal_get_untyped_deleter());
        a2->set(0);
        boost::detail::ms_noinit(p2, n1);
        a2->set(p2);
        p1 = reinterpret_cast<T1*>(p2);
        return shared_ptr<T>(s1, p1);
    }

    template<class T, class A>
    inline typename boost::detail::sp_if_size_array<T>::type
    allocate_shared_noinit(const A& allocator) {
        typedef typename boost::detail::array_inner<T>::type T1;
        typedef typename boost::detail::array_base<T1>::type T2;
        typedef boost::detail::ms_noinit_tag R1;
        typedef boost::detail::as_allocator<A, T, R1> A1;
        typedef boost::detail::ms_in_allocator_tag D1;
        enum {
            N = boost::detail::array_total<T>::size
        };
        T1* p1 = 0;
        T2* p2 = 0;
        D1 d1;
        A1 a1(allocator, &p2);
        shared_ptr<T> s1(p1, d1, a1);
        A1* a2 = static_cast<A1*>(s1._internal_get_untyped_deleter());
        a2->set(0);
        boost::detail::ms_noinit(p2, N);
        a2->set(p2);
        p1 = reinterpret_cast<T1*>(p2);
        return shared_ptr<T>(s1, p1);
    }
}

#endif
