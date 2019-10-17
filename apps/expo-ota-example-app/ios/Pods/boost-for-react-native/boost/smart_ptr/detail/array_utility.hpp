/*
 * Copyright (c) 2012-2014 Glen Joseph Fernandes
 * glenfe at live dot com
 *
 * Distributed under the Boost Software License,
 * Version 1.0. (See accompanying file LICENSE_1_0.txt
 * or copy at http://boost.org/LICENSE_1_0.txt)
 */
#ifndef BOOST_SMART_PTR_DETAIL_ARRAY_UTILITY_HPP
#define BOOST_SMART_PTR_DETAIL_ARRAY_UTILITY_HPP

#include <boost/config.hpp>
#include <boost/type_traits/has_trivial_constructor.hpp>
#include <boost/type_traits/has_trivial_destructor.hpp>
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
#include <memory>
#endif

namespace boost {
    namespace detail {
        typedef boost::true_type  ms_is_trivial;
        typedef boost::false_type ms_no_trivial;

        template<class T>
        inline void ms_destroy(T*, std::size_t, ms_is_trivial) {
        }

        template<class T>
        inline void ms_destroy(T* memory, std::size_t size, ms_no_trivial) {
            for (std::size_t i = size; i > 0;) {
                memory[--i].~T();
            }
        }

        template<class T>
        inline void ms_destroy(T* memory, std::size_t size) {
            boost::has_trivial_destructor<T> trivial;
            ms_destroy(memory, size, trivial);
        }

        template<class T>
        inline void ms_init(T* memory, std::size_t size, ms_is_trivial) {
            for (std::size_t i = 0; i < size; i++) {
                void* p1 = memory + i;
                ::new(p1) T();
            }
        }

        template<class T>
        inline void ms_init(T* memory, std::size_t size, ms_no_trivial) {
#if !defined(BOOST_NO_EXCEPTIONS)
            std::size_t i = 0;
            try {
                for (; i < size; i++) {
                    void* p1 = memory + i;
                    ::new(p1) T();
                }
            } catch (...) {
                ms_destroy(memory, i);
                throw;
            }
#else
            for (std::size_t i = 0; i < size; i++) {
                void* p1 = memory + i;
                ::new(p1) T();
            }
#endif
        }

        template<class T>
        inline void ms_init(T* memory, std::size_t size) {
            boost::has_trivial_default_constructor<T> trivial;
            ms_init(memory, size, trivial);
        }

        template<class T, std::size_t N>
        inline void ms_init(T* memory, std::size_t size, const T* list) {
#if !defined(BOOST_NO_EXCEPTIONS)
            std::size_t i = 0;
            try {
                for (; i < size; i++) {
                    void* p1 = memory + i;
                    ::new(p1) T(list[i % N]);
                }
            } catch (...) {
                ms_destroy(memory, i);
                throw;
            }
#else
            for (std::size_t i = 0; i < size; i++) {
                void* p1 = memory + i;
                ::new(p1) T(list[i % N]);
            }
#endif
        }

#if !defined(BOOST_NO_CXX11_ALLOCATOR)
        template<class T, class A>
        inline void as_destroy(const A& allocator, T* memory,
            std::size_t size) {
            typedef typename std::allocator_traits<A>::
                template rebind_alloc<T> TA;
            typedef typename std::allocator_traits<A>::
                template rebind_traits<T> TT;
            TA a2(allocator);
            for (std::size_t i = size; i > 0;) {
                TT::destroy(a2, &memory[--i]);
            }
        }

        template<class T, class A>
        inline void as_init(const A& allocator, T* memory, std::size_t size,
            ms_is_trivial) {
            typedef typename std::allocator_traits<A>::
                template rebind_alloc<T> TA;
            typedef typename std::allocator_traits<A>::
                template rebind_traits<T> TT;
            TA a2(allocator);
            for (std::size_t i = 0; i < size; i++) {
                TT::construct(a2, memory + i);
            }
        }

        template<class T, class A>
        inline void as_init(const A& allocator, T* memory, std::size_t size,
            ms_no_trivial) {
            typedef typename std::allocator_traits<A>::
                template rebind_alloc<T> TA;
            typedef typename std::allocator_traits<A>::
                template rebind_traits<T> TT;
            TA a2(allocator);
#if !defined(BOOST_NO_EXCEPTIONS)
            std::size_t i = 0;
            try {
                for (; i < size; i++) {
                    TT::construct(a2, memory + i);
                }
            } catch (...) {
                as_destroy(a2, memory, i);
                throw;
            }
#else
            for (std::size_t i = 0; i < size; i++) {
                TT::construct(a2, memory + i);
            }
#endif
        }

        template<class T, class A>
        inline void as_init(const A& allocator, T* memory, std::size_t size) {
            boost::has_trivial_default_constructor<T> trivial;
            as_init(allocator, memory, size, trivial);
        }

        template<class T, class A, std::size_t N>
        inline void as_init(const A& allocator, T* memory, std::size_t size,
            const T* list) {
            typedef typename std::allocator_traits<A>::
                template rebind_alloc<T> TA;
            typedef typename std::allocator_traits<A>::
                template rebind_traits<T> TT;
            TA a2(allocator);
#if !defined(BOOST_NO_EXCEPTIONS)
            std::size_t i = 0;
            try {
                for (; i < size; i++) {
                    TT::construct(a2, memory + i, list[i % N]);
                }
            } catch (...) {
                as_destroy(a2, memory, i);
                throw;
            }
#else
            for (std::size_t i = 0; i < size; i++) {
                TT::construct(a2, memory + i, list[i % N]);
            }
#endif
        }
#endif

        template<class T>
        inline void ms_noinit(T*, std::size_t, ms_is_trivial) {
        }

        template<class T>
        inline void ms_noinit(T* memory, std::size_t size, ms_no_trivial) {
#if !defined(BOOST_NO_EXCEPTIONS)
            std::size_t i = 0;
            try {
                for (; i < size; i++) {
                    void* p1 = memory + i;
                    ::new(p1) T;
                }
            } catch (...) {
                ms_destroy(memory, i);
                throw;
            }
#else
            for (std::size_t i = 0; i < size; i++) {
                void* p1 = memory + i;
                ::new(p1) T;
            }
#endif
        }

        template<class T>
        inline void ms_noinit(T* memory, std::size_t size) {
            boost::has_trivial_default_constructor<T> trivial;
            ms_noinit(memory, size, trivial);
        }
    }
}

#endif
