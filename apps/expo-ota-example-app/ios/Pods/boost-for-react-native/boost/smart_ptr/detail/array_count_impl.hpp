/*
 * Copyright (c) 2014 Glen Joseph Fernandes 
 * glenfe at live dot com
 *
 * Distributed under the Boost Software License, 
 * Version 1.0. (See accompanying file LICENSE_1_0.txt 
 * or copy at http://boost.org/LICENSE_1_0.txt)
 */
#ifndef BOOST_SMART_PTR_DETAIL_ARRAY_COUNT_IMPL_HPP
#define BOOST_SMART_PTR_DETAIL_ARRAY_COUNT_IMPL_HPP

#include <boost/smart_ptr/detail/array_allocator.hpp>
#include <boost/smart_ptr/detail/sp_counted_impl.hpp>

namespace boost {
    namespace detail {
        template<class P, class A>
        class sp_counted_impl_pda<P, ms_in_allocator_tag, A>
            : public sp_counted_base {
            typedef ms_in_allocator_tag D;
            typedef sp_counted_impl_pda<P, D, A> Y;
        public:
            sp_counted_impl_pda(P, D, const A& allocator_)
                : allocator(allocator_) {
            }

            virtual void dispose() {
                allocator();
            }

            virtual void destroy() {
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
                typedef typename std::allocator_traits<A>::
                    template rebind_alloc<Y> YA;
                typedef typename std::allocator_traits<A>::
                    template rebind_traits<Y> YT;
#else
                typedef typename A::template rebind<Y>::other YA;
#endif
                YA a1(allocator);
#if !defined(BOOST_NO_CXX11_ALLOCATOR)
                YT::destroy(a1, this);
                YT::deallocate(a1, this, 1);
#else
                this->~Y();
                a1.deallocate(this, 1);
#endif                
            }

            virtual void* get_deleter(const sp_typeinfo&) {
                return &reinterpret_cast<char&>(allocator);
            }

            virtual void* get_untyped_deleter() {
                return &reinterpret_cast<char&>(allocator);
            }

        private:
            sp_counted_impl_pda(const sp_counted_impl_pda&);
            sp_counted_impl_pda& operator=(const sp_counted_impl_pda&);

            A allocator;
        };
    }
}

#endif
