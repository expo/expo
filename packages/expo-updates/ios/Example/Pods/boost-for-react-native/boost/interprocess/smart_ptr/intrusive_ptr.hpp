//////////////////////////////////////////////////////////////////////////////
//
// This file is the adaptation for Interprocess of boost/intrusive_ptr.hpp
//
// (C) Copyright Peter Dimov 2001, 2002
// (C) Copyright Ion Gaztanaga 2006-2012. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/interprocess for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_INTERPROCESS_INTRUSIVE_PTR_HPP_INCLUDED
#define BOOST_INTERPROCESS_INTRUSIVE_PTR_HPP_INCLUDED

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif
#
#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

//!\file
//!Describes an intrusive ownership pointer.

#include <boost/interprocess/detail/config_begin.hpp>
#include <boost/interprocess/detail/workaround.hpp>

#include <boost/assert.hpp>
#include <boost/interprocess/detail/utilities.hpp>
#include <boost/intrusive/pointer_traits.hpp>
#include <boost/move/adl_move_swap.hpp>

#include <iosfwd>               // for std::basic_ostream

#include <boost/intrusive/detail/minimal_less_equal_header.hpp>   //std::less

namespace boost {
namespace interprocess {

//!The intrusive_ptr class template stores a pointer to an object
//!with an embedded reference count. intrusive_ptr is parameterized on
//!T (the type of the object pointed to) and VoidPointer(a void pointer type
//!that defines the type of pointer that intrusive_ptr will store).
//!intrusive_ptr<T, void *> defines a class with a T* member whereas
//!intrusive_ptr<T, offset_ptr<void> > defines a class with a offset_ptr<T> member.
//!Relies on unqualified calls to:
//!
//!  void intrusive_ptr_add_ref(T * p);
//!  void intrusive_ptr_release(T * p);
//!
//!  with (p != 0)
//!
//!The object is responsible for destroying itself.
template<class T, class VoidPointer>
class intrusive_ptr
{
   public:
   //!Provides the type of the internal stored pointer.
   typedef typename boost::intrusive::
      pointer_traits<VoidPointer>::template
         rebind_pointer<T>::type                pointer;
   //!Provides the type of the stored pointer.
   typedef T element_type;

   #if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)
   private:
   typedef VoidPointer VP;
   typedef intrusive_ptr this_type;
   typedef pointer this_type::*unspecified_bool_type;
   #endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED

   public:
   //!Constructor. Initializes internal pointer to 0.
   //!Does not throw
   intrusive_ptr(): m_ptr(0)
   {}

   //!Constructor. Copies pointer and if "p" is not zero and
   //!"add_ref" is true calls intrusive_ptr_add_ref(to_raw_pointer(p)).
   //!Does not throw
   intrusive_ptr(const pointer &p, bool add_ref = true): m_ptr(p)
   {
      if(m_ptr != 0 && add_ref) intrusive_ptr_add_ref(ipcdetail::to_raw_pointer(m_ptr));
   }

   //!Copy constructor. Copies the internal pointer and if "p" is not
   //!zero calls intrusive_ptr_add_ref(to_raw_pointer(p)). Does not throw
   intrusive_ptr(intrusive_ptr const & rhs)
      :  m_ptr(rhs.m_ptr)
   {
      if(m_ptr != 0) intrusive_ptr_add_ref(ipcdetail::to_raw_pointer(m_ptr));
   }

   //!Constructor from related. Copies the internal pointer and if "p" is not
   //!zero calls intrusive_ptr_add_ref(to_raw_pointer(p)). Does not throw
   template<class U> intrusive_ptr
      (intrusive_ptr<U, VP> const & rhs)
      :  m_ptr(rhs.get())
   {
      if(m_ptr != 0) intrusive_ptr_add_ref(ipcdetail::to_raw_pointer(m_ptr));
   }

   //!Destructor. If internal pointer is not 0, calls
   //!intrusive_ptr_release(to_raw_pointer(m_ptr)). Does not throw
   ~intrusive_ptr()
   {
      if(m_ptr != 0) intrusive_ptr_release(ipcdetail::to_raw_pointer(m_ptr));
   }

   //!Assignment operator. Equivalent to intrusive_ptr(r).swap(*this).
   //!Does not throw
   intrusive_ptr & operator=(intrusive_ptr const & rhs)
   {
      this_type(rhs).swap(*this);
      return *this;
   }

   //!Assignment from related. Equivalent to intrusive_ptr(r).swap(*this).
   //!Does not throw
   template<class U> intrusive_ptr & operator=
      (intrusive_ptr<U, VP> const & rhs)
   {
      this_type(rhs).swap(*this);
      return *this;
   }

   //!Assignment from pointer. Equivalent to intrusive_ptr(r).swap(*this).
   //!Does not throw
   intrusive_ptr & operator=(pointer rhs)
   {
      this_type(rhs).swap(*this);
      return *this;
   }

   //!Returns a reference to the internal pointer.
   //!Does not throw
   pointer &get()
   {  return m_ptr;  }

   //!Returns a reference to the internal pointer.
   //!Does not throw
   const pointer &get() const
   {  return m_ptr;  }

   //!Returns *get().
   //!Does not throw
   T & operator*() const
   {  return *m_ptr; }

   //!Returns *get().
   //!Does not throw
   const pointer &operator->() const
   {  return m_ptr;  }

   //!Returns get().
   //!Does not throw
   pointer &operator->()
   {  return m_ptr;  }

   //!Conversion to boolean.
   //!Does not throw
   operator unspecified_bool_type () const
   {  return m_ptr == 0? 0: &this_type::m_ptr;  }

   //!Not operator.
   //!Does not throw
   bool operator! () const
   {  return m_ptr == 0;   }

   //!Exchanges the contents of the two smart pointers.
   //!Does not throw
   void swap(intrusive_ptr & rhs)
   {  ::boost::adl_move_swap(m_ptr, rhs.m_ptr);  }

   #if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)
   private:
   pointer m_ptr;
   #endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED
};

//!Returns a.get() == b.get().
//!Does not throw
template<class T, class U, class VP> inline
bool operator==(intrusive_ptr<T, VP> const & a,
                intrusive_ptr<U, VP> const & b)
{  return a.get() == b.get(); }

//!Returns a.get() != b.get().
//!Does not throw
template<class T, class U, class VP> inline
bool operator!=(intrusive_ptr<T, VP> const & a,
                intrusive_ptr<U, VP> const & b)
{  return a.get() != b.get(); }

//!Returns a.get() == b.
//!Does not throw
template<class T, class VP> inline
bool operator==(intrusive_ptr<T, VP> const & a,
                       const typename intrusive_ptr<T, VP>::pointer &b)
{  return a.get() == b; }

//!Returns a.get() != b.
//!Does not throw
template<class T, class VP> inline
bool operator!=(intrusive_ptr<T, VP> const & a,
                const typename intrusive_ptr<T, VP>::pointer &b)
{  return a.get() != b; }

//!Returns a == b.get().
//!Does not throw
template<class T, class VP> inline
bool operator==(const typename intrusive_ptr<T, VP>::pointer &a,
                intrusive_ptr<T, VP> const & b)
{  return a == b.get(); }

//!Returns a != b.get().
//!Does not throw
template<class T, class VP> inline
bool operator!=(const typename intrusive_ptr<T, VP>::pointer &a,
                       intrusive_ptr<T, VP> const & b)
{  return a != b.get(); }

//!Returns a.get() < b.get().
//!Does not throw
template<class T, class VP> inline
bool operator<(intrusive_ptr<T, VP> const & a,
               intrusive_ptr<T, VP> const & b)
{
   return std::less<typename intrusive_ptr<T, VP>::pointer>()
      (a.get(), b.get());
}

//!Exchanges the contents of the two intrusive_ptrs.
//!Does not throw
template<class T, class VP> inline
void swap(intrusive_ptr<T, VP> & lhs,
          intrusive_ptr<T, VP> & rhs)
{  lhs.swap(rhs); }

// operator<<
template<class E, class T, class Y, class VP>
inline std::basic_ostream<E, T> & operator<<
   (std::basic_ostream<E, T> & os, intrusive_ptr<Y, VP> const & p)
{  os << p.get(); return os;  }

//!Returns p.get().
//!Does not throw
template<class T, class VP>
inline typename boost::interprocess::intrusive_ptr<T, VP>::pointer
   to_raw_pointer(intrusive_ptr<T, VP> p)
{  return p.get();   }

/*Emulates static cast operator. Does not throw*/
/*
template<class T, class U, class VP>
inline boost::interprocess::intrusive_ptr<T, VP> static_pointer_cast
   (boost::interprocess::intrusive_ptr<U, VP> const & p)
{  return do_static_cast<U>(p.get());  }
*/
/*Emulates const cast operator. Does not throw*/
/*
template<class T, class U, class VP>
inline boost::interprocess::intrusive_ptr<T, VP> const_pointer_cast
   (boost::interprocess::intrusive_ptr<U, VP> const & p)
{  return do_const_cast<U>(p.get());   }
*/

/*Emulates dynamic cast operator. Does not throw*/
/*
template<class T, class U, class VP>
inline boost::interprocess::intrusive_ptr<T, VP> dynamic_pointer_cast
   (boost::interprocess::intrusive_ptr<U, VP> const & p)
{  return do_dynamic_cast<U>(p.get()); }
*/

/*Emulates reinterpret cast operator. Does not throw*/
/*
template<class T, class U, class VP>
inline boost::interprocess::intrusive_ptr<T, VP>reinterpret_pointer_cast
   (boost::interprocess::intrusive_ptr<U, VP> const & p)
{  return do_reinterpret_cast<U>(p.get());   }
*/

} // namespace interprocess

#if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)

#if defined(_MSC_VER) && (_MSC_VER < 1400)
//!Returns p.get().
//!Does not throw
template<class T, class VP>
inline T *to_raw_pointer(boost::interprocess::intrusive_ptr<T, VP> p)
{  return p.get();   }
#endif

#endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED

} // namespace boost

#include <boost/interprocess/detail/config_end.hpp>

#endif  // #ifndef BOOST_INTERPROCESS_INTRUSIVE_PTR_HPP_INCLUDED
