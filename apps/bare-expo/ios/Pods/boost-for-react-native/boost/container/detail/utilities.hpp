//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2013. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/container for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_CONTAINER_DETAIL_UTILITIES_HPP
#define BOOST_CONTAINER_DETAIL_UTILITIES_HPP

#if defined(_MSC_VER)
#  pragma once
#endif

#include <boost/container/detail/config_begin.hpp>
#include <boost/container/detail/workaround.hpp>

#include <cstdio>
#include <cstring> //for ::memmove / ::memcpy
#include <boost/type_traits/is_pointer.hpp>
#include <boost/type_traits/is_enum.hpp>
#include <boost/type_traits/is_class.hpp>
#include <boost/type_traits/is_integral.hpp>
#include <boost/type_traits/is_floating_point.hpp>
#include <boost/type_traits/is_copy_constructible.hpp>
#include <boost/type_traits/has_trivial_destructor.hpp>
#include <boost/type_traits/has_trivial_copy.hpp>
#include <boost/type_traits/has_trivial_assign.hpp>
#include <boost/type_traits/is_pod.hpp>
#include <boost/move/core.hpp>
#include <boost/move/utility_core.hpp>
#include <boost/move/iterator.hpp>
#include <boost/assert.hpp>
#include <boost/container/throw_exception.hpp>
#include <boost/container/detail/mpl.hpp>
#include <boost/container/detail/type_traits.hpp>
#include <boost/container/allocator_traits.hpp>
#include <boost/core/no_exceptions_support.hpp>
#include <boost/container/detail/memory_util.hpp>
#include <boost/intrusive/pointer_traits.hpp>
#include <boost/aligned_storage.hpp>
#include <iterator>
#include <utility>   //std::distance

namespace boost {
namespace container {

//////////////////////////////////////////////////////////////////////////////
//
//                                  swap
//
//////////////////////////////////////////////////////////////////////////////

namespace container_swap {

template<class T, bool IsClass = boost::is_class<T>::value >
struct has_member_swap
{
   static const bool value = boost::container::container_detail::
      has_member_function_callable_with_swap<T, T &>::value;
};

template<class T>
struct has_member_swap<T, false>
{
   static const bool value = false;
};

}  //namespace container_swap {

template<class T> inline
typename container_detail::enable_if_c
      <container_swap::has_member_swap<T>::value, void>::type
swap_dispatch(T &left, T &right)   //swap using member swap
{
   left.swap(right); // may throw
}

template<class T> inline
typename container_detail::enable_if_c
      <!container_swap::has_member_swap<T>::value/* && boost::has_move_emulation_enabled<T>::value*/, void>::type
   swap_dispatch(T &left, T &right)
{
   T temp(boost::move(left)); // may throw
   left = boost::move(right); // may throw
   right = boost::move(temp); // may throw
}
/*
template<class T> inline
typename container_detail::enable_if_c
      <!container_swap::has_member_swap<T>::value && !boost::has_move_emulation_enabled<T>::value, void>::type
   swap_dispatch(T &left, T &right)
{
   using std::swap;
   swap(left, right);   // may throw
}
*/
namespace container_detail {

template <typename T>
inline T* addressof(T& obj)
{
   return static_cast<T*>(
      static_cast<void*>(
         const_cast<char*>(
            &reinterpret_cast<const char&>(obj)
   )));
}

template<class T>
const T &max_value(const T &a, const T &b)
{  return a > b ? a : b;   }

template<class T>
const T &min_value(const T &a, const T &b)
{  return a < b ? a : b;   }

enum NextCapacityOption { NextCapacityDouble, NextCapacity60Percent };

template<class SizeType, NextCapacityOption Option>
struct next_capacity_calculator;

template<class SizeType>
struct next_capacity_calculator<SizeType, NextCapacityDouble>
{
   static SizeType get(const SizeType max_size
                     ,const SizeType capacity
                     ,const SizeType n)
   {
      const SizeType remaining = max_size - capacity;
      if ( remaining < n )
         boost::container::throw_length_error("get_next_capacity, allocator's max_size reached");
      const SizeType additional = max_value(n, capacity);
      return ( remaining < additional ) ? max_size : ( capacity + additional );
   }
};


template<class SizeType>
struct next_capacity_calculator<SizeType, NextCapacity60Percent>
{
   static SizeType get(const SizeType max_size
                     ,const SizeType capacity
                     ,const SizeType n)
   {
      const SizeType remaining = max_size - capacity;
      if ( remaining < n )
         boost::container::throw_length_error("get_next_capacity, allocator's max_size reached");
      const SizeType m3 = max_size/3;

      if (capacity < m3)
         return capacity + max_value(3*(capacity+1)/5, n);

      if (capacity < m3*2)
         return capacity + max_value((capacity+1)/2, n);
      return max_size;
   }
};

template <class T>
inline T* to_raw_pointer(T* p)
{  return p; }

template <class Pointer>
inline typename boost::intrusive::pointer_traits<Pointer>::element_type*
   to_raw_pointer(const Pointer &p)
{  return boost::container::container_detail::to_raw_pointer(p.operator->());  }

template <class T>
inline T* iterator_to_pointer(T* i)
{  return i; }

template <class Iterator>
inline typename std::iterator_traits<Iterator>::pointer
   iterator_to_pointer(const Iterator &i)
{  return i.operator->();  }

template <class Iterator>
inline 
   typename boost::intrusive::pointer_traits
      <typename std::iterator_traits<Iterator>::pointer>::element_type*
   iterator_to_raw_pointer(const Iterator &i)
{  return (to_raw_pointer)((iterator_to_pointer)(i));  }


template<class AllocatorType>
inline void swap_alloc(AllocatorType &, AllocatorType &, container_detail::false_type)
   BOOST_CONTAINER_NOEXCEPT
{}

template<class AllocatorType>
inline void swap_alloc(AllocatorType &l, AllocatorType &r, container_detail::true_type)
{  boost::container::swap_dispatch(l, r);   }

template<class AllocatorType>
inline void assign_alloc(AllocatorType &, const AllocatorType &, container_detail::false_type)
   BOOST_CONTAINER_NOEXCEPT
{}

template<class AllocatorType>
inline void assign_alloc(AllocatorType &l, const AllocatorType &r, container_detail::true_type)
{  l = r;   }

template<class AllocatorType>
inline void move_alloc(AllocatorType &, AllocatorType &, container_detail::false_type)
   BOOST_CONTAINER_NOEXCEPT
{}

template<class AllocatorType>
inline void move_alloc(AllocatorType &l, AllocatorType &r, container_detail::true_type)
{  l = ::boost::move(r);   }

//Rounds "orig_size" by excess to round_to bytes
template<class SizeType>
inline SizeType get_rounded_size(SizeType orig_size, SizeType round_to)
{
   return ((orig_size-1)/round_to+1)*round_to;
}

template <std::size_t OrigSize, std::size_t RoundTo>
struct ct_rounded_size
{
   enum { value = ((OrigSize-1)/RoundTo+1)*RoundTo };
};

template<class I>
struct are_elements_contiguous
{
   static const bool value = false;
};

/////////////////////////
//    raw pointers
/////////////////////////

template<class T>
struct are_elements_contiguous<T*>
{
   static const bool value = true;
};

/////////////////////////
//    predeclarations
/////////////////////////

#ifndef BOOST_CONTAINER_VECTOR_ITERATOR_IS_POINTER

template<class Pointer>
class vector_iterator;

template<class Pointer>
class vector_const_iterator;

#endif   //BOOST_CONTAINER_VECTOR_ITERATOR_IS_POINTER

}  //namespace container_detail {
}  //namespace container {

namespace interprocess {

template <class PointedType, class DifferenceType, class OffsetType, std::size_t OffsetAlignment>
class offset_ptr;

}  //namespace interprocess {

namespace container {

namespace container_detail {

/////////////////////////
//vector_[const_]iterator
/////////////////////////

#ifndef BOOST_CONTAINER_VECTOR_ITERATOR_IS_POINTER

template<class Pointer>
struct are_elements_contiguous<boost::container::container_detail::vector_iterator<Pointer> >
{
   static const bool value = true;
};

template<class Pointer>
struct are_elements_contiguous<boost::container::container_detail::vector_const_iterator<Pointer> >
{
   static const bool value = true;
};

#endif   //BOOST_CONTAINER_VECTOR_ITERATOR_IS_POINTER

/////////////////////////
//    offset_ptr
/////////////////////////

template <class PointedType, class DifferenceType, class OffsetType, std::size_t OffsetAlignment>
struct are_elements_contiguous< ::boost::interprocess::offset_ptr<PointedType, DifferenceType, OffsetType, OffsetAlignment> >
{
   static const bool value = true;
};

template <typename I, typename O>
struct are_contiguous_and_same
{
   static const bool is_same_io =
      is_same< typename remove_const< typename ::std::iterator_traits<I>::value_type >::type
             , typename ::std::iterator_traits<O>::value_type
             >::value;
   static const bool value = is_same_io &&
      are_elements_contiguous<I>::value &&
      are_elements_contiguous<O>::value;
};

template <typename I, typename O>
struct is_memtransfer_copy_assignable
{
   static const bool value = are_contiguous_and_same<I, O>::value &&
      boost::has_trivial_assign< typename ::std::iterator_traits<I>::value_type >::value;
};

template <typename I, typename O>
struct is_memtransfer_copy_constructible
{
   static const bool value = are_contiguous_and_same<I, O>::value &&
      boost::has_trivial_copy< typename ::std::iterator_traits<I>::value_type >::value;
};

template <typename I, typename O, typename R>
struct enable_if_memtransfer_copy_constructible
   : public enable_if_c<container_detail::is_memtransfer_copy_constructible<I, O>::value, R>
{};

template <typename I, typename O, typename R>
struct disable_if_memtransfer_copy_constructible
   : public enable_if_c<!container_detail::is_memtransfer_copy_constructible<I, O>::value, R>
{};

template <typename I, typename O, typename R>
struct enable_if_memtransfer_copy_assignable
   : public enable_if_c<container_detail::is_memtransfer_copy_assignable<I, O>::value, R>
{};

template <typename I, typename O, typename R>
struct disable_if_memtransfer_copy_assignable
   : public enable_if_c<!container_detail::is_memtransfer_copy_assignable<I, O>::value, R>
{};

template
   <typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline F memmove(I f, I l, F r) BOOST_CONTAINER_NOEXCEPT
{
   typedef typename std::iterator_traits<I>::value_type value_type;
   typename std::iterator_traits<I>::difference_type n = std::distance(f, l);
   ::memmove((iterator_to_raw_pointer)(r), (iterator_to_raw_pointer)(f), sizeof(value_type)*n);
   std::advance(r, n);
   return r;
}

template
   <typename I, // I models InputIterator
    typename F> // F models ForwardIterator
F memmove_n(I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{
   typedef typename std::iterator_traits<I>::value_type value_type;
   ::memmove((iterator_to_raw_pointer)(r), (iterator_to_raw_pointer)(f), sizeof(value_type)*n);
   std::advance(r, n);
   return r;
}

template
   <typename I, // I models InputIterator
    typename F> // F models ForwardIterator
I memmove_n_source(I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{
   typedef typename std::iterator_traits<I>::value_type value_type;
   ::memmove((iterator_to_raw_pointer)(r), (iterator_to_raw_pointer)(f), sizeof(value_type)*n);
   std::advance(f, n);
   return f;
}

template
   <typename I, // I models InputIterator
    typename F> // F models ForwardIterator
I memmove_n_source_dest(I f, typename std::iterator_traits<I>::difference_type n, F &r) BOOST_CONTAINER_NOEXCEPT
{
   typedef typename std::iterator_traits<I>::value_type value_type;
   ::memmove((iterator_to_raw_pointer)(r), (iterator_to_raw_pointer)(f), sizeof(value_type)*n);
   std::advance(f, n);
   std::advance(r, n);
   return f;
}

template <typename O>
struct is_memzero_initializable
{
   typedef typename ::std::iterator_traits<O>::value_type value_type;
   static const bool value = are_elements_contiguous<O>::value &&
      (  ::boost::is_integral<value_type>::value || ::boost::is_enum<value_type>::value
      #if defined(BOOST_CONTAINER_MEMZEROED_POINTER_IS_NULL)
      || ::boost::is_pointer<value_type>::value
      #endif
      #if defined(BOOST_CONTAINER_MEMZEROED_FLOATING_POINT_IS_ZERO)
      || ::boost::is_floating_point<value_type>::value
      #endif
      #if defined(BOOST_CONTAINER_MEMZEROED_FLOATING_POINT_IS_ZERO) && defined(BOOST_CONTAINER_MEMZEROED_POINTER_IS_NULL)
      || ::boost::is_pod<value_type>::value
      #endif
      );
};

template <typename O, typename R>
struct enable_if_memzero_initializable
   : public enable_if_c<container_detail::is_memzero_initializable<O>::value, R>
{};

template <typename O, typename R>
struct disable_if_memzero_initializable
   : public enable_if_c<!container_detail::is_memzero_initializable<O>::value, R>
{};

}  //namespace container_detail {


//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_move_alloc
//
//////////////////////////////////////////////////////////////////////////////


//! <b>Effects</b>:
//!   \code
//!   for (; f != l; ++r, ++f)
//!      allocator_traits::construct(a, &*r, boost::move(*f));
//!   \endcode
//!
//! <b>Returns</b>: r
template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_constructible<I, F, F>::type
   uninitialized_move_alloc(A &a, I f, I l, F r)
{
   F back = r;
   BOOST_TRY{
      while (f != l) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r), boost::move(*f));
         ++f; ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return r;
}

template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_constructible<I, F, F>::type
   uninitialized_move_alloc(A &, I f, I l, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove(f, l, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_move_alloc_n
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; n--; ++r, ++f)
//!      allocator_traits::construct(a, &*r, boost::move(*f));
//!   \endcode
//!
//! <b>Returns</b>: r
template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_constructible<I, F, F>::type
   uninitialized_move_alloc_n(A &a, I f, typename std::iterator_traits<I>::difference_type n, F r)
{
   F back = r;
   BOOST_TRY{
      while (n--) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r), boost::move(*f));
         ++f; ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return r;
}

template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_constructible<I, F, F>::type
   uninitialized_move_alloc_n(A &, I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_move_alloc_n_source
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; n--; ++r, ++f)
//!      allocator_traits::construct(a, &*r, boost::move(*f));
//!   \endcode
//!
//! <b>Returns</b>: f (after incremented)
template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_constructible<I, F, I>::type
   uninitialized_move_alloc_n_source(A &a, I f, typename std::iterator_traits<I>::difference_type n, F r)
{
   F back = r;
   BOOST_TRY{
      while (n--) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r), boost::move(*f));
         ++f; ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return f;
}

template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_constructible<I, F, I>::type
   uninitialized_move_alloc_n_source(A &, I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n_source(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_copy_alloc
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; f != l; ++r, ++f)
//!      allocator_traits::construct(a, &*r, *f);
//!   \endcode
//!
//! <b>Returns</b>: r
template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_constructible<I, F, F>::type
   uninitialized_copy_alloc(A &a, I f, I l, F r)
{
   F back = r;
   BOOST_TRY{
      while (f != l) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r), *f);
         ++f; ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return r;
}

template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_constructible<I, F, F>::type
   uninitialized_copy_alloc(A &, I f, I l, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove(f, l, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_copy_alloc_n
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; n--; ++r, ++f)
//!      allocator_traits::construct(a, &*r, *f);
//!   \endcode
//!
//! <b>Returns</b>: r
template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_constructible<I, F, F>::type
   uninitialized_copy_alloc_n(A &a, I f, typename std::iterator_traits<I>::difference_type n, F r)
{
   F back = r;
   BOOST_TRY{
      while (n--) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r), *f);
         ++f; ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return r;
}

template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_constructible<I, F, F>::type
   uninitialized_copy_alloc_n(A &, I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_copy_alloc_n_source
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; n--; ++r, ++f)
//!      allocator_traits::construct(a, &*r, *f);
//!   \endcode
//!
//! <b>Returns</b>: f (after incremented)
template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_constructible<I, F, I>::type
   uninitialized_copy_alloc_n_source(A &a, I f, typename std::iterator_traits<I>::difference_type n, F r)
{
   F back = r;
   BOOST_TRY{
      while (n--) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r), *f);
         ++f; ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return f;
}

template
   <typename A,
    typename I, // I models InputIterator
    typename F> // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_constructible<I, F, I>::type
   uninitialized_copy_alloc_n_source(A &, I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n_source(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_value_init_alloc_n
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; n--; ++r, ++f)
//!      allocator_traits::construct(a, &*r);
//!   \endcode
//!
//! <b>Returns</b>: r
template
   <typename A,
    typename F> // F models ForwardIterator
inline typename container_detail::disable_if_memzero_initializable<F, F>::type
   uninitialized_value_init_alloc_n(A &a, typename allocator_traits<A>::difference_type n, F r)
{
   F back = r;
   BOOST_TRY{
      while (n--) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r));
         ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return r;
}

template
   <typename A,
    typename F> // F models ForwardIterator
inline typename container_detail::enable_if_memzero_initializable<F, F>::type
   uninitialized_value_init_alloc_n(A &, typename allocator_traits<A>::difference_type n, F r)
{
   typedef typename std::iterator_traits<F>::value_type value_type;
   ::memset((void*)container_detail::iterator_to_raw_pointer(r), 0, sizeof(value_type)*n);
   std::advance(r, n);
   return r;
}

//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_default_init_alloc_n
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; n--; ++r, ++f)
//!      allocator_traits::construct(a, &*r);
//!   \endcode
//!
//! <b>Returns</b>: r
template
   <typename A,
    typename F> // F models ForwardIterator
inline F uninitialized_default_init_alloc_n(A &a, typename allocator_traits<A>::difference_type n, F r)
{
   F back = r;
   BOOST_TRY{
      while (n--) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r), default_init);
         ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return r;
}

//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_fill_alloc
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; f != l; ++r, ++f)
//!      allocator_traits::construct(a, &*r, *f);
//!   \endcode
//!
//! <b>Returns</b>: r
template
   <typename A,
    typename F, // F models ForwardIterator
    typename T>
inline void uninitialized_fill_alloc(A &a, F f, F l, const T &t)
{
   F back = f;
   BOOST_TRY{
      while (f != l) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(f), t);
         ++f;
      }
   }
   BOOST_CATCH(...){
      for (; back != l; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
}


//////////////////////////////////////////////////////////////////////////////
//
//                               uninitialized_fill_alloc_n
//
//////////////////////////////////////////////////////////////////////////////

//! <b>Effects</b>:
//!   \code
//!   for (; n--; ++r, ++f)
//!      allocator_traits::construct(a, &*r, v);
//!   \endcode
//!
//! <b>Returns</b>: r
template
   <typename A,
    typename T,
    typename F> // F models ForwardIterator
inline F uninitialized_fill_alloc_n(A &a, const T &v, typename allocator_traits<A>::difference_type n, F r)
{
   F back = r;
   BOOST_TRY{
      while (n--) {
         allocator_traits<A>::construct(a, container_detail::iterator_to_raw_pointer(r), v);
         ++r;
      }
   }
   BOOST_CATCH(...){
      for (; back != r; ++back){
         allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(back));
      }
      BOOST_RETHROW;
   }
   BOOST_CATCH_END
   return r;
}

//////////////////////////////////////////////////////////////////////////////
//
//                               copy
//
//////////////////////////////////////////////////////////////////////////////

template
<typename I,   // I models InputIterator
typename F>    // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_assignable<I, F, F>::type
   copy(I f, I l, F r)
{
   while (f != l) {
      *r = *f;
      ++f; ++r;
   }
   return r;
}

template
<typename I,   // I models InputIterator
typename F>    // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_assignable<I, F, F>::type
   copy(I f, I l, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove(f, l, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                               copy_n
//
//////////////////////////////////////////////////////////////////////////////

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_assignable<I, F, F>::type
   copy_n(I f, typename std::iterator_traits<I>::difference_type n, F r)
{
   while (n--) {
      *r = *f;
      ++f; ++r;
   }
   return r;
}

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_assignable<I, F, F>::type
   copy_n(I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                            copy_n_source
//
//////////////////////////////////////////////////////////////////////////////

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_assignable<I, F, I>::type
   copy_n_source(I f, typename std::iterator_traits<I>::difference_type n, F r)
{
   while (n--) {
      *r = *f;
      ++f; ++r;
   }
   return f;
}

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_assignable<I, F, I>::type
   copy_n_source(I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n_source(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                            copy_n_source_dest
//
//////////////////////////////////////////////////////////////////////////////

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_assignable<I, F, I>::type
   copy_n_source_dest(I f, typename std::iterator_traits<I>::difference_type n, F &r)
{
   while (n--) {
      *r = *f;
      ++f; ++r;
   }
   return f;
}

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_assignable<I, F, I>::type
   copy_n_source_dest(I f, typename std::iterator_traits<I>::difference_type n, F &r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n_source_dest(f, n, r);  }

//////////////////////////////////////////////////////////////////////////////
//
//                         move
//
//////////////////////////////////////////////////////////////////////////////

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_assignable<I, F, F>::type
   move(I f, I l, F r)
{
   while (f != l) {
      *r = ::boost::move(*f);
      ++f; ++r;
   }
   return r;
}

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_assignable<I, F, F>::type
   move(I f, I l, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove(f, l, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                         move_n
//
//////////////////////////////////////////////////////////////////////////////

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_assignable<I, F, F>::type
   move_n(I f, typename std::iterator_traits<I>::difference_type n, F r)
{
   while (n--) {
      *r = ::boost::move(*f);
      ++f; ++r;
   }
   return r;
}

template
<typename I,   // I models InputIterator
typename F>   // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_assignable<I, F, F>::type
   move_n(I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                         move_n_source
//
//////////////////////////////////////////////////////////////////////////////

template
<typename I    // I models InputIterator
,typename F>   // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_assignable<I, F, I>::type
   move_n_source(I f, typename std::iterator_traits<I>::difference_type n, F r)
{
   while (n--) {
      *r = ::boost::move(*f);
      ++f; ++r;
   }
   return f;
}

template
<typename I    // I models InputIterator
,typename F>   // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_assignable<I, F, I>::type
   move_n_source(I f, typename std::iterator_traits<I>::difference_type n, F r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n_source(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                         move_n_source_dest
//
//////////////////////////////////////////////////////////////////////////////

template
<typename I    // I models InputIterator
,typename F>   // F models ForwardIterator
inline typename container_detail::disable_if_memtransfer_copy_assignable<I, F, I>::type
   move_n_source_dest(I f, typename std::iterator_traits<I>::difference_type n, F &r)
{
   while (n--) {
      *r = ::boost::move(*f);
      ++f; ++r;
   }
   return f;
}

template
<typename I    // I models InputIterator
,typename F>   // F models ForwardIterator
inline typename container_detail::enable_if_memtransfer_copy_assignable<I, F, I>::type
   move_n_source_dest(I f, typename std::iterator_traits<I>::difference_type n, F &r) BOOST_CONTAINER_NOEXCEPT
{  return container_detail::memmove_n_source_dest(f, n, r); }

//////////////////////////////////////////////////////////////////////////////
//
//                               destroy_n
//
//////////////////////////////////////////////////////////////////////////////

template
   <typename A
   ,typename I>  // I models InputIterator
inline void destroy_alloc_n(A &a, I f, typename std::iterator_traits<I>::difference_type n
   ,typename boost::container::container_detail::enable_if_c
      < !boost::has_trivial_destructor<typename std::iterator_traits<I>::value_type>::value >::type* = 0)
{
   while(n--){
      allocator_traits<A>::destroy(a, container_detail::iterator_to_raw_pointer(f++));
   }
}

template
   <typename A
   ,typename I>  // I models InputIterator
inline void destroy_alloc_n(A &, I, typename std::iterator_traits<I>::difference_type
   ,typename boost::container::container_detail::enable_if_c
      < boost::has_trivial_destructor<typename std::iterator_traits<I>::value_type>::value >::type* = 0)
{}

//////////////////////////////////////////////////////////////////////////////
//
//                         deep_swap_alloc_n
//
//////////////////////////////////////////////////////////////////////////////

template
   <std::size_t MaxTmpBytes
   ,typename A
   ,typename F // F models ForwardIterator
   ,typename G // G models ForwardIterator
   >
inline typename container_detail::disable_if_memtransfer_copy_assignable<F, G, void>::type
   deep_swap_alloc_n( A &a, F short_range_f, typename allocator_traits<A>::size_type n_i
                    , G large_range_f, typename allocator_traits<A>::size_type n_j)
{
   typename allocator_traits<A>::size_type n = 0;
   for (; n != n_i ; ++short_range_f, ++large_range_f, ++n){
      boost::container::swap_dispatch(*short_range_f, *large_range_f);
   }
   boost::container::uninitialized_move_alloc_n(a, large_range_f, n_j - n_i, short_range_f);  // may throw
   boost::container::destroy_alloc_n(a, large_range_f, n_j - n_i);
}

static const std::size_t DeepSwapAllocNMaxStorage = std::size_t(1) << std::size_t(11); //2K bytes

template
   <std::size_t MaxTmpBytes
   ,typename A
   ,typename F // F models ForwardIterator
   ,typename G // G models ForwardIterator
   >
inline typename container_detail::enable_if_c
   < container_detail::is_memtransfer_copy_assignable<F, G>::value && (MaxTmpBytes <= DeepSwapAllocNMaxStorage) && false
   , void>::type
   deep_swap_alloc_n( A &a, F short_range_f, typename allocator_traits<A>::size_type n_i
                    , G large_range_f, typename allocator_traits<A>::size_type n_j)
{
   typedef typename allocator_traits<A>::value_type value_type;
   typedef typename boost::aligned_storage
      <MaxTmpBytes, container_detail::alignment_of<value_type>::value>::type storage_type;
   storage_type storage;

   const std::size_t n_i_bytes = sizeof(value_type)*n_i;
   void *const large_ptr = static_cast<void*>(container_detail::iterator_to_raw_pointer(large_range_f));
   void *const short_ptr = static_cast<void*>(container_detail::iterator_to_raw_pointer(short_range_f));
   void *const stora_ptr = static_cast<void*>(container_detail::iterator_to_raw_pointer(storage));
   ::memcpy(stora_ptr, large_ptr, n_i_bytes);
   ::memcpy(large_ptr, short_ptr, n_i_bytes);
   ::memcpy(short_ptr, stora_ptr, n_i_bytes);
   std::advance(large_range_f, n_i);
   std::advance(short_range_f, n_i);
   boost::container::uninitialized_move_alloc_n(a, large_range_f, n_j - n_i, short_range_f);  // may throw
   boost::container::destroy_alloc_n(a, large_range_f, n_j - n_i);
}

template
   <std::size_t MaxTmpBytes
   ,typename A
   ,typename F // F models ForwardIterator
   ,typename G // G models ForwardIterator
   >
inline typename container_detail::enable_if_c
   < container_detail::is_memtransfer_copy_assignable<F, G>::value && true//(MaxTmpBytes > DeepSwapAllocNMaxStorage)
   , void>::type
   deep_swap_alloc_n( A &a, F short_range_f, typename allocator_traits<A>::size_type n_i
                    , G large_range_f, typename allocator_traits<A>::size_type n_j)
{
   typedef typename allocator_traits<A>::value_type value_type;
   typedef typename boost::aligned_storage
      <DeepSwapAllocNMaxStorage, container_detail::alignment_of<value_type>::value>::type storage_type;
   storage_type storage;
   const std::size_t sizeof_storage = sizeof(storage);

   std::size_t n_i_bytes = sizeof(value_type)*n_i;
   char *large_ptr = static_cast<char*>(static_cast<void*>(container_detail::iterator_to_raw_pointer(large_range_f)));
   char *short_ptr = static_cast<char*>(static_cast<void*>(container_detail::iterator_to_raw_pointer(short_range_f)));
   char *stora_ptr = static_cast<char*>(static_cast<void*>(&storage));

   std::size_t szt_times = n_i_bytes/sizeof_storage;
   const std::size_t szt_rem = n_i_bytes%sizeof_storage;

   //Loop unrolling using Duff's device, as it seems it helps on some architectures
   const std::size_t Unroll = 4;
   std::size_t n = (szt_times + (Unroll-1))/Unroll;
   const std::size_t branch_number = (!szt_times)*Unroll + (szt_times % Unroll);
   switch(branch_number){
      case 4:
         break;
      case 0: do{
         ::memcpy(stora_ptr, large_ptr, sizeof_storage);
         ::memcpy(large_ptr, short_ptr, sizeof_storage);
         ::memcpy(short_ptr, stora_ptr, sizeof_storage);
         large_ptr += sizeof_storage;
         short_ptr += sizeof_storage;
         BOOST_CONTAINER_FALLTHOUGH
      case 3:
         ::memcpy(stora_ptr, large_ptr, sizeof_storage);
         ::memcpy(large_ptr, short_ptr, sizeof_storage);
         ::memcpy(short_ptr, stora_ptr, sizeof_storage);
         large_ptr += sizeof_storage;
         short_ptr += sizeof_storage;
         BOOST_CONTAINER_FALLTHOUGH
      case 2:
         ::memcpy(stora_ptr, large_ptr, sizeof_storage);
         ::memcpy(large_ptr, short_ptr, sizeof_storage);
         ::memcpy(short_ptr, stora_ptr, sizeof_storage);
         large_ptr += sizeof_storage;
         short_ptr += sizeof_storage;
         BOOST_CONTAINER_FALLTHOUGH
      case 1:
         ::memcpy(stora_ptr, large_ptr, sizeof_storage);
         ::memcpy(large_ptr, short_ptr, sizeof_storage);
         ::memcpy(short_ptr, stora_ptr, sizeof_storage);
         large_ptr += sizeof_storage;
         short_ptr += sizeof_storage;
         } while(--n);
   }
   ::memcpy(stora_ptr, large_ptr, szt_rem);
   ::memcpy(large_ptr, short_ptr, szt_rem);
   ::memcpy(short_ptr, stora_ptr, szt_rem);
   std::advance(large_range_f, n_i);
   std::advance(short_range_f, n_i);
   boost::container::uninitialized_move_alloc_n(a, large_range_f, n_j - n_i, short_range_f);  // may throw
   boost::container::destroy_alloc_n(a, large_range_f, n_j - n_i);
}


//////////////////////////////////////////////////////////////////////////////
//
//                         copy_assign_range_alloc_n
//
//////////////////////////////////////////////////////////////////////////////

template
   <typename A
   ,typename I // F models InputIterator
   ,typename O // G models OutputIterator
   >
void copy_assign_range_alloc_n( A &a, I inp_start, typename allocator_traits<A>::size_type n_i
                              , O out_start, typename allocator_traits<A>::size_type n_o )
{
   if (n_o < n_i){
      inp_start = boost::container::copy_n_source_dest(inp_start, n_o, out_start);     // may throw
      boost::container::uninitialized_copy_alloc_n(a, inp_start, n_i - n_o, out_start);// may throw
   }
   else{
      out_start = boost::container::copy_n(inp_start, n_i, out_start);  // may throw
      boost::container::destroy_alloc_n(a, out_start, n_o - n_i);
   }
}

//////////////////////////////////////////////////////////////////////////////
//
//                         move_assign_range_alloc_n
//
//////////////////////////////////////////////////////////////////////////////

template
   <typename A
   ,typename I // F models InputIterator
   ,typename O // G models OutputIterator
   >
void move_assign_range_alloc_n( A &a, I inp_start, typename allocator_traits<A>::size_type n_i
                              , O out_start, typename allocator_traits<A>::size_type n_o )
{
   if (n_o < n_i){
      inp_start = boost::container::move_n_source_dest(inp_start, n_o, out_start);  // may throw
      boost::container::uninitialized_move_alloc_n(a, inp_start, n_i - n_o, out_start);  // may throw
   }
   else{
      out_start = boost::container::move_n(inp_start, n_i, out_start);  // may throw
      boost::container::destroy_alloc_n(a, out_start, n_o - n_i);
   }
}

}  //namespace container {
}  //namespace boost {

#include <boost/container/detail/config_end.hpp>

#endif   //#ifndef BOOST_CONTAINER_DETAIL_UTILITIES_HPP
