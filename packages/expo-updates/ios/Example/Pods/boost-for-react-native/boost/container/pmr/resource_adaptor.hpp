//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2015-2015. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/container for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_CONTAINER_PMR_RESOURCE_ADAPTOR_HPP
#define BOOST_CONTAINER_PMR_RESOURCE_ADAPTOR_HPP

#if defined (_MSC_VER)
#  pragma once 
#endif

#include <boost/config.hpp>
#include <boost/container/pmr/memory_resource.hpp>
#include <boost/container/allocator_traits.hpp>
#include <boost/intrusive/detail/ebo_functor_holder.hpp>
#include <boost/move/utility_core.hpp>

namespace boost {
namespace container {
namespace pmr {

//! An instance of resource_adaptor<Allocator> is an adaptor that wraps a memory_resource interface
//! around Allocator. In order that resource_adaptor<X<T>> and resource_adaptor<X<U>> are the same
//! type for any allocator template X and types T and U, resource_adaptor<Allocator> is rendered as
//! an alias to this class template such that Allocator is rebound to a char value type in every
//! specialization of the class template. The requirements on this class template are defined below.
//! In addition to the Allocator requirements, the parameter to resource_adaptor shall meet
//! the following additional requirements:
//!
//! - `typename allocator_traits<Allocator>:: pointer` shall be identical to
//!   `typename allocator_traits<Allocator>:: value_type*`.
//!
//! - `typename allocator_traits<Allocator>:: const_pointer` shall be identical to
//!   `typename allocator_traits<Allocator>:: value_type const*`.
//!
//! - `typename allocator_traits<Allocator>:: void_pointer` shall be identical to `void*`.
//!
//! - `typename allocator_traits<Allocator>:: const_void_pointer` shall be identical to `void const*`.
template <class Allocator>
class resource_adaptor_imp
   : public  memory_resource
   #ifndef BOOST_CONTAINER_DOXYGEN_INVOKED
   , private ::boost::intrusive::detail::ebo_functor_holder<Allocator>
   #endif
{
   #ifdef BOOST_CONTAINER_DOXYGEN_INVOKED
   Allocator m_alloc;
   #else
   BOOST_COPYABLE_AND_MOVABLE(resource_adaptor_imp)
   typedef ::boost::intrusive::detail::ebo_functor_holder<Allocator> ebo_alloc_t;
   void static_assert_if_not_char_allocator() const
   {
      //This class can only be used with allocators type char
      BOOST_STATIC_ASSERT((container_detail::is_same<typename Allocator::value_type, char>::value));
   }
   #endif

   public:
   typedef Allocator allocator_type;

   //! <b>Effects</b>: Default constructs
   //!   m_alloc.
   resource_adaptor_imp()
   {  this->static_assert_if_not_char_allocator(); }

   //! <b>Effects</b>: Copy constructs
   //!   m_alloc.
   resource_adaptor_imp(const resource_adaptor_imp &other)
      : ebo_alloc_t(other.ebo_alloc_t::get())
   {}

   //! <b>Effects</b>: Move constructs
   //!   m_alloc.
   resource_adaptor_imp(BOOST_RV_REF(resource_adaptor_imp) other)
      : ebo_alloc_t(::boost::move(other.get()))
   {}

   //! <b>Effects</b>: Initializes m_alloc with
   //!   a2.
   explicit resource_adaptor_imp(const Allocator& a2)
      : ebo_alloc_t(a2)
   {  this->static_assert_if_not_char_allocator(); }

   //! <b>Effects</b>: Initializes m_alloc with
   //!   a2.
   explicit resource_adaptor_imp(BOOST_RV_REF(Allocator) a2)
      : ebo_alloc_t(::boost::move(a2))
   {  this->static_assert_if_not_char_allocator(); }

   //! <b>Effects</b>: Copy assigns
   //!   m_alloc.
   resource_adaptor_imp& operator=(BOOST_COPY_ASSIGN_REF(resource_adaptor_imp) other)
   {  this->ebo_alloc_t::get() = other.ebo_alloc_t::get(); return *this;  }

   //! <b>Effects</b>: Move assigns
   //!   m_alloc.
   resource_adaptor_imp& operator=(BOOST_RV_REF(resource_adaptor_imp) other)
   {  this->ebo_alloc_t::get() = ::boost::move(other.ebo_alloc_t::get()); return *this;  }

   //! <b>Effects</b>: Returns m_alloc.
   allocator_type &get_allocator()
   {  return this->ebo_alloc_t::get(); }

   //! <b>Effects</b>: Returns m_alloc.
   const allocator_type &get_allocator() const
   {  return this->ebo_alloc_t::get(); }

   protected:
   //! <b>Returns</b>: Allocated memory obtained by calling m_alloc.allocate. The size and alignment
   //!   of the allocated memory shall meet the requirements for a class derived from memory_resource.
   virtual void* do_allocate(size_t bytes, size_t alignment)
   {  (void)alignment;  return this->ebo_alloc_t::get().allocate(bytes);  }

   //! <b>Requires</b>: p was previously allocated using A.allocate, where A == m_alloc, and not
   //!   subsequently deallocated. 
   //!
   //! <b>Effects</b>: Returns memory to the allocator using m_alloc.deallocate().
   virtual void do_deallocate(void* p, size_t bytes, size_t alignment)
   {  (void)alignment; this->ebo_alloc_t::get().deallocate((char*)p, bytes);   }

   //! Let p be dynamic_cast<const resource_adaptor_imp*>(&other).
   //!
   //! <b>Returns</b>: false if p is null, otherwise the value of m_alloc == p->m_alloc.
   virtual bool do_is_equal(const memory_resource& other) const BOOST_NOEXCEPT
   {
      const resource_adaptor_imp* p = dynamic_cast<const resource_adaptor_imp*>(&other);
      return p && p->ebo_alloc_t::get() == this->ebo_alloc_t::get();
   }
};

#if !defined(BOOST_NO_CXX11_TEMPLATE_ALIASES) || defined(BOOST_CONTAINER_DOXYGEN_INVOKED)

//! `resource_adaptor<Allocator>` is rendered as an alias to resource_adaptor_imp class template
//! such that Allocator is rebound to a char value type.
template <class Allocator>
using resource_adaptor = resource_adaptor_imp
   <typename allocator_traits<Allocator>::template rebind_alloc<char> >;

#else

template <class Allocator>
class resource_adaptor
   : public resource_adaptor_imp
      <typename allocator_traits<Allocator>::template portable_rebind_alloc<char>::type>
{
   typedef resource_adaptor_imp
      <typename allocator_traits<Allocator>::template portable_rebind_alloc<char>::type> base_t;

   BOOST_COPYABLE_AND_MOVABLE(resource_adaptor)

   public:
   resource_adaptor()
      : base_t()
   {}

   resource_adaptor(const resource_adaptor &other)
      : base_t(other)
   {}

   resource_adaptor(BOOST_RV_REF(resource_adaptor) other)
      : base_t(BOOST_MOVE_BASE(base_t, other))
   {}

   explicit resource_adaptor(const Allocator& a2)
      : base_t(a2)
   {}

   explicit resource_adaptor(BOOST_RV_REF(Allocator) a2)
      : base_t(BOOST_MOVE_BASE(base_t, a2))
   {}

   resource_adaptor& operator=(BOOST_COPY_ASSIGN_REF(resource_adaptor) other)
   {  return static_cast<resource_adaptor&>(this->base_t::operator=(other));  }

   resource_adaptor& operator=(BOOST_RV_REF(resource_adaptor) other)
   {  return static_cast<resource_adaptor&>(this->base_t::operator=(BOOST_MOVE_BASE(base_t, other)));  }

   //get_allocator and protected functions are properly inherited
};

#endif

}  //namespace pmr {
}  //namespace container {
}  //namespace boost {

#endif   //BOOST_CONTAINER_PMR_RESOURCE_ADAPTOR_HPP
