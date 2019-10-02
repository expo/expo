/*
 * Copyright (c) 2012-2014 Glen Joseph Fernandes 
 * glenfe at live dot com
 *
 * Distributed under the Boost Software License, 
 * Version 1.0. (See accompanying file LICENSE_1_0.txt 
 * or copy at http://boost.org/LICENSE_1_0.txt)
 */
#ifndef BOOST_SMART_PTR_DETAIL_ARRAY_ALLOCATOR_HPP
#define BOOST_SMART_PTR_DETAIL_ARRAY_ALLOCATOR_HPP

#include <boost/align/align.hpp>
#include <boost/smart_ptr/detail/array_traits.hpp>
#include <boost/smart_ptr/detail/array_utility.hpp>
#include <boost/type_traits/alignment_of.hpp>

namespace boost {
    namespace detail {
        struct ms_init_tag   { };
        struct ms_noinit_tag { };

        template<class T>
        struct ms_allocator_state;

        template<class T>
        struct ms_allocator_state<T[]> {
            typedef typename array_base<T>::type type;

            ms_allocator_state(std::size_t size_,
                type** result_)
                : size(size_ * array_total<T>::size),
                  result(result_) {
            }

            std::size_t size;

            union {
                type** result;
                type* object;
            };
        };

        template<class T, std::size_t N>
        struct ms_allocator_state<T[N]> {
            typedef typename array_base<T>::type type;

            ms_allocator_state(type** result_)
                : result(result_) {
            }

            enum {
                size = array_total<T[N]>::size
            };

            union {
                type** result;
                type* object;
            };
        };

        template<class A, class T, class R>
        class as_allocator
            : public A {
            template<class A_, class T_, class R_>
            friend class as_allocator;

#if !defined(BOOST_NO_CXX11_ALLOCATOR)
            typedef std::allocator_traits<A> AT;
            typedef typename AT::template rebind_alloc<char> CA;
            typedef typename AT::template rebind_traits<char> CT;
#else
            typedef typename A::template rebind<char>::other CA;
#endif

        public:
            typedef A allocator_type;

#if !defined(BOOST_NO_CXX11_ALLOCATOR)
            typedef typename AT::value_type value_type;
            typedef typename AT::pointer pointer;
            typedef typename AT::const_pointer const_pointer;
            typedef typename AT::void_pointer void_pointer;
            typedef typename AT::const_void_pointer const_void_pointer;
            typedef typename AT::size_type size_type;
            typedef typename AT::difference_type difference_type;
#else
            typedef typename A::value_type value_type;
            typedef typename A::pointer pointer;
            typedef typename A::const_pointer const_pointer;
            typedef typename A::size_type size_type;
            typedef typename A::difference_type difference_type;
            typedef typename A::reference reference;
            typedef typename A::const_reference const_reference;
            typedef void* void_pointer;
            typedef const void* const_void_pointer;
#endif

            template<class U>
            struct rebind {
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
                typedef as_allocator<typename AT::
                    template rebind_alloc<U>, T, R> other;
#else
                typedef as_allocator<typename A::
                    template rebind<U>::other, T, R> other;
#endif
            };

            typedef typename array_base<T>::type type;

            as_allocator(const A& allocator_, type** result)
                : A(allocator_),
                  data(result) {
            }

            as_allocator(const A& allocator_, std::size_t size,
                type** result)
                : A(allocator_),
                  data(size, result) {
            }

            template<class U>
            as_allocator(const as_allocator<U, T, R>& other)
                : A(other.allocator()),
                  data(other.data) {
            }

            pointer allocate(size_type count, const_void_pointer = 0) {
                enum {
                    M = boost::alignment_of<type>::value
                };
                std::size_t n1 = count * sizeof(value_type);
                std::size_t n2 = data.size * sizeof(type);
                std::size_t n3 = n2 + M;
                CA ca(allocator());
                void* p1 = ca.allocate(n1 + n3);
                void* p2 = static_cast<char*>(p1) + n1;
                (void)boost::alignment::align(M, n2, p2, n3);
                *data.result = static_cast<type*>(p2);
                return static_cast<value_type*>(p1);
            }

            void deallocate(pointer memory, size_type count) {
                enum {
                    M = boost::alignment_of<type>::value
                };
                std::size_t n1 = count * sizeof(value_type);
                std::size_t n2 = data.size * sizeof(type) + M;
                char* p1 = reinterpret_cast<char*>(memory);
                CA ca(allocator());
                ca.deallocate(p1, n1 + n2);
            }

            const A& allocator() const {
                return static_cast<const A&>(*this);
            }

            A& allocator() {
                return static_cast<A&>(*this);
            }

            void set(type* memory) {
                data.object = memory;
            }

            void operator()() {
                if (data.object) {
                    R tag;
                    release(tag);
                }
            }

        private:
            void release(ms_init_tag) {
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
                as_destroy(allocator(), data.object, data.size);
#else
                ms_destroy(data.object, data.size);
#endif
            }

            void release(ms_noinit_tag) {
                ms_destroy(data.object, data.size);
            }

            ms_allocator_state<T> data;
        };

        template<class A1, class A2, class T, class R>
        bool operator==(const as_allocator<A1, T, R>& a1,
            const as_allocator<A2, T, R>& a2) {
            return a1.allocator() == a2.allocator();
        }

        template<class A1, class A2, class T, class R>
        bool operator!=(const as_allocator<A1, T, R>& a1,
            const as_allocator<A2, T, R>& a2) {
            return a1.allocator() != a2.allocator();
        }

        template<class T, class Y = char>
        class ms_allocator;

        template<class T, class Y>
        class ms_allocator {
            template<class T_, class Y_>
            friend class ms_allocator;

        public:
            typedef typename array_base<T>::type type;

            typedef Y value_type;
            typedef Y* pointer;
            typedef const Y* const_pointer;
            typedef std::size_t size_type;
            typedef std::ptrdiff_t difference_type;
            typedef Y& reference;
            typedef const Y& const_reference;

            template<class U>
            struct rebind {
                typedef ms_allocator<T, U> other;
            };

            ms_allocator(type** result)
                : data(result) {
            }

            ms_allocator(std::size_t size, type** result)
                : data(size, result) {
            }

            template<class U>
            ms_allocator(const ms_allocator<T, U>& other)
                : data(other.data) {
            }

            pointer allocate(size_type count, const void* = 0) {
                enum {
                    M = boost::alignment_of<type>::value
                };
                std::size_t n1 = count * sizeof(Y);
                std::size_t n2 = data.size * sizeof(type);
                std::size_t n3 = n2 + M;
                void* p1 = ::operator new(n1 + n3);
                void* p2 = static_cast<char*>(p1) + n1;
                (void)boost::alignment::align(M, n2, p2, n3);
                *data.result = static_cast<type*>(p2);
                return static_cast<Y*>(p1);
            }

            void deallocate(pointer memory, size_type) {
                void* p1 = memory;
                ::operator delete(p1);
            }

#if defined(BOOST_NO_CXX11_ALLOCATOR)
            pointer address(reference value) const {
                return &value;
            }

            const_pointer address(const_reference value) const {
                return &value;
            }

            size_type max_size() const {
                enum {
                    N = static_cast<std::size_t>(-1) / sizeof(Y)
                };
                return N;
            }

            void construct(pointer memory, const_reference value) {
                void* p1 = memory;
                ::new(p1) Y(value);
            }

            void destroy(pointer memory) {
                (void)memory;
                memory->~Y();
            }
#endif

            void set(type* memory) {
                data.object = memory;
            }

            void operator()() {
                if (data.object) {
                    ms_destroy(data.object, data.size);
                }
            }

        private:
            ms_allocator_state<T> data;
        };

        template<class T, class Y1, class Y2>
        bool operator==(const ms_allocator<T, Y1>&,
            const ms_allocator<T, Y2>&) {
            return true;
        }

        template<class T, class Y1, class Y2>
        bool operator!=(const ms_allocator<T, Y1>&,
            const ms_allocator<T, Y2>&) {
            return false;
        }

        class ms_in_allocator_tag {
        public:
            void operator()(const void*) {
            }
        };
    }
}

#endif
