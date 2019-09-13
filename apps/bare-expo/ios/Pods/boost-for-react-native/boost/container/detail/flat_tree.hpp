////////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2015. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/container for documentation.
//
////////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_CONTAINER_FLAT_TREE_HPP
#define BOOST_CONTAINER_FLAT_TREE_HPP

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif

#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

#include <boost/container/detail/config_begin.hpp>
#include <boost/container/detail/workaround.hpp>

#include <boost/container/container_fwd.hpp>

#include <boost/move/utility_core.hpp>

#include <boost/container/detail/pair.hpp>
#include <boost/container/vector.hpp>
#include <boost/container/detail/value_init.hpp>
#include <boost/container/detail/destroyers.hpp>
#include <boost/container/detail/algorithm.hpp> //algo_equal(), algo_lexicographical_compare
#include <boost/container/detail/iterator.hpp>
#include <boost/container/detail/is_sorted.hpp>
#include <boost/container/allocator_traits.hpp>
#ifdef BOOST_CONTAINER_VECTOR_ITERATOR_IS_POINTER
#include <boost/intrusive/pointer_traits.hpp>
#endif
#include <boost/container/detail/type_traits.hpp>
#include <boost/container/detail/iterators.hpp>
#include <boost/move/make_unique.hpp>
#include <boost/move/adl_move_swap.hpp>
#if defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)
#include <boost/move/detail/fwd_macros.hpp>
#endif

#include <boost/intrusive/detail/minimal_pair_header.hpp>      //pair
#include <boost/move/iterator.hpp>

namespace boost {
namespace container {
namespace container_detail {

template<class Compare, class Value, class KeyOfValue>
class flat_tree_value_compare
   : private Compare
{
   typedef Value              first_argument_type;
   typedef Value              second_argument_type;
   typedef bool               return_type;
   public:
   flat_tree_value_compare()
      : Compare()
   {}

   flat_tree_value_compare(const Compare &pred)
      : Compare(pred)
   {}

   bool operator()(const Value& lhs, const Value& rhs) const
   {
      KeyOfValue key_extract;
      return Compare::operator()(key_extract(lhs), key_extract(rhs));
   }

   const Compare &get_comp() const
      {  return *this;  }

   Compare &get_comp()
      {  return *this;  }
};

template<class Pointer>
struct get_flat_tree_iterators
{
   #ifdef BOOST_CONTAINER_VECTOR_ITERATOR_IS_POINTER
   typedef Pointer                                             iterator;
   typedef typename boost::intrusive::
      pointer_traits<Pointer>::element_type                    iterator_element_type;
   typedef typename boost::intrusive::
      pointer_traits<Pointer>:: template
         rebind_pointer<const iterator_element_type>::type     const_iterator;
   #else //BOOST_CONTAINER_VECTOR_ITERATOR_IS_POINTER
   typedef typename boost::container::container_detail::
      vec_iterator<Pointer, false>                             iterator;
   typedef typename boost::container::container_detail::
      vec_iterator<Pointer, true >                             const_iterator;
   #endif   //BOOST_CONTAINER_VECTOR_ITERATOR_IS_POINTER
   typedef boost::container::reverse_iterator<iterator>        reverse_iterator;
   typedef boost::container::reverse_iterator<const_iterator>  const_reverse_iterator;
};

template <class Value, class KeyOfValue,
          class Compare, class Allocator>
class flat_tree
{
   typedef boost::container::vector<Value, Allocator>    vector_t;
   typedef Allocator                                     allocator_t;
   typedef allocator_traits<Allocator>                   allocator_traits_type;

   public:
   typedef flat_tree_value_compare<Compare, Value, KeyOfValue> value_compare;

 private:
   struct Data
      //Inherit from value_compare to do EBO
      : public value_compare
   {
      BOOST_COPYABLE_AND_MOVABLE(Data)

      public:
      Data()
         : value_compare(), m_vect()
      {}

      explicit Data(const Data &d)
         : value_compare(static_cast<const value_compare&>(d)), m_vect(d.m_vect)
      {}

      Data(BOOST_RV_REF(Data) d)
         : value_compare(boost::move(static_cast<value_compare&>(d))), m_vect(boost::move(d.m_vect))
      {}

      Data(const Data &d, const Allocator &a)
         : value_compare(static_cast<const value_compare&>(d)), m_vect(d.m_vect, a)
      {}

      Data(BOOST_RV_REF(Data) d, const Allocator &a)
         : value_compare(boost::move(static_cast<value_compare&>(d))), m_vect(boost::move(d.m_vect), a)
      {}

      explicit Data(const Compare &comp)
         : value_compare(comp), m_vect()
      {}

      Data(const Compare &comp, const allocator_t &alloc)
         : value_compare(comp), m_vect(alloc)
      {}

      explicit Data(const allocator_t &alloc)
         : value_compare(), m_vect(alloc)
      {}

      Data& operator=(BOOST_COPY_ASSIGN_REF(Data) d)
      {
         this->value_compare::operator=(d);
         m_vect = d.m_vect;
         return *this;
      }

      Data& operator=(BOOST_RV_REF(Data) d)
      {
         this->value_compare::operator=(boost::move(static_cast<value_compare &>(d)));
         m_vect = boost::move(d.m_vect);
         return *this;
      }

      void swap(Data &d)
      {
         value_compare& mycomp    = *this, & othercomp = d;
         boost::adl_move_swap(mycomp, othercomp);
         this->m_vect.swap(d.m_vect);
      }

      vector_t m_vect;
   };

   Data m_data;
   BOOST_COPYABLE_AND_MOVABLE(flat_tree)

   public:

   typedef typename vector_t::value_type              value_type;
   typedef typename vector_t::pointer                 pointer;
   typedef typename vector_t::const_pointer           const_pointer;
   typedef typename vector_t::reference               reference;
   typedef typename vector_t::const_reference         const_reference;
   typedef typename KeyOfValue::type                  key_type;
   typedef Compare                                    key_compare;
   typedef typename vector_t::allocator_type          allocator_type;
   typedef typename vector_t::size_type               size_type;
   typedef typename vector_t::difference_type         difference_type;
   typedef typename vector_t::iterator                iterator;
   typedef typename vector_t::const_iterator          const_iterator;
   typedef typename vector_t::reverse_iterator        reverse_iterator;
   typedef typename vector_t::const_reverse_iterator  const_reverse_iterator;

   //!Standard extension
   typedef allocator_type                             stored_allocator_type;

   private:
   typedef allocator_traits<stored_allocator_type> stored_allocator_traits;

   public:
   BOOST_CONTAINER_FORCEINLINE flat_tree()
      : m_data()
   { }

   BOOST_CONTAINER_FORCEINLINE explicit flat_tree(const Compare& comp)
      : m_data(comp)
   { }

   BOOST_CONTAINER_FORCEINLINE flat_tree(const Compare& comp, const allocator_type& a)
      : m_data(comp, a)
   { }

   BOOST_CONTAINER_FORCEINLINE explicit flat_tree(const allocator_type& a)
      : m_data(a)
   { }

   BOOST_CONTAINER_FORCEINLINE flat_tree(const flat_tree& x)
      :  m_data(x.m_data)
   { }

   BOOST_CONTAINER_FORCEINLINE flat_tree(BOOST_RV_REF(flat_tree) x)
      BOOST_NOEXCEPT_IF(boost::container::container_detail::is_nothrow_move_constructible<Compare>::value)
      :  m_data(boost::move(x.m_data))
   { }

   BOOST_CONTAINER_FORCEINLINE flat_tree(const flat_tree& x, const allocator_type &a)
      :  m_data(x.m_data, a)
   { }

   BOOST_CONTAINER_FORCEINLINE flat_tree(BOOST_RV_REF(flat_tree) x, const allocator_type &a)
      :  m_data(boost::move(x.m_data), a)
   { }

   template <class InputIterator>
   flat_tree( ordered_range_t, InputIterator first, InputIterator last
            , const Compare& comp     = Compare()
            , const allocator_type& a = allocator_type())
      : m_data(comp, a)
   {
      this->m_data.m_vect.insert(this->m_data.m_vect.end(), first, last);
      BOOST_ASSERT((is_sorted)(this->m_data.m_vect.cbegin(), this->m_data.m_vect.cend(), this->priv_value_comp()));
   }

   template <class InputIterator>
   flat_tree( ordered_unique_range_t, InputIterator first, InputIterator last
            , const Compare& comp     = Compare()
            , const allocator_type& a = allocator_type())
      : m_data(comp, a)
   {
      this->m_data.m_vect.insert(this->m_data.m_vect.end(), first, last);
      BOOST_ASSERT((is_sorted_and_unique)(this->m_data.m_vect.cbegin(), this->m_data.m_vect.cend(), this->priv_value_comp()));
   }

   template <class InputIterator>
   flat_tree( bool unique_insertion
            , InputIterator first, InputIterator last
            , const Compare& comp     = Compare()
            , const allocator_type& a = allocator_type())
      : m_data(comp, a)
   {
      //Use cend() as hint to achieve linear time for
      //ordered ranges as required by the standard
      //for the constructor
      //Call end() every iteration as reallocation might have invalidated iterators
      if(unique_insertion){
         for ( ; first != last; ++first){
            this->insert_unique(this->cend(), *first);
         }
      }
      else{
         for ( ; first != last; ++first){
            this->insert_equal(this->cend(), *first);
         }
      }
   }

   BOOST_CONTAINER_FORCEINLINE ~flat_tree()
   {}

   BOOST_CONTAINER_FORCEINLINE flat_tree&  operator=(BOOST_COPY_ASSIGN_REF(flat_tree) x)
   {  m_data = x.m_data;   return *this;  }

   BOOST_CONTAINER_FORCEINLINE flat_tree&  operator=(BOOST_RV_REF(flat_tree) x)
      BOOST_NOEXCEPT_IF( (allocator_traits_type::propagate_on_container_move_assignment::value ||
                          allocator_traits_type::is_always_equal::value) &&
                           boost::container::container_detail::is_nothrow_move_assignable<Compare>::value)
   {  m_data = boost::move(x.m_data); return *this;  }

   BOOST_CONTAINER_FORCEINLINE const value_compare &priv_value_comp() const
   { return static_cast<const value_compare &>(this->m_data); }

   BOOST_CONTAINER_FORCEINLINE value_compare &priv_value_comp()
   { return static_cast<value_compare &>(this->m_data); }

   BOOST_CONTAINER_FORCEINLINE const key_compare &priv_key_comp() const
   { return this->priv_value_comp().get_comp(); }

   BOOST_CONTAINER_FORCEINLINE key_compare &priv_key_comp()
   { return this->priv_value_comp().get_comp(); }

   public:
   // accessors:
   BOOST_CONTAINER_FORCEINLINE Compare key_comp() const
   { return this->m_data.get_comp(); }

   BOOST_CONTAINER_FORCEINLINE value_compare value_comp() const
   { return this->m_data; }

   BOOST_CONTAINER_FORCEINLINE allocator_type get_allocator() const
   { return this->m_data.m_vect.get_allocator(); }

   BOOST_CONTAINER_FORCEINLINE const stored_allocator_type &get_stored_allocator() const
   {  return this->m_data.m_vect.get_stored_allocator(); }

   BOOST_CONTAINER_FORCEINLINE stored_allocator_type &get_stored_allocator()
   {  return this->m_data.m_vect.get_stored_allocator(); }

   BOOST_CONTAINER_FORCEINLINE iterator begin()
   { return this->m_data.m_vect.begin(); }

   BOOST_CONTAINER_FORCEINLINE const_iterator begin() const
   { return this->cbegin(); }

   BOOST_CONTAINER_FORCEINLINE const_iterator cbegin() const
   { return this->m_data.m_vect.begin(); }

   BOOST_CONTAINER_FORCEINLINE iterator end()
   { return this->m_data.m_vect.end(); }

   BOOST_CONTAINER_FORCEINLINE const_iterator end() const
   { return this->cend(); }

   BOOST_CONTAINER_FORCEINLINE const_iterator cend() const
   { return this->m_data.m_vect.end(); }

   BOOST_CONTAINER_FORCEINLINE reverse_iterator rbegin()
   { return reverse_iterator(this->end()); }

   BOOST_CONTAINER_FORCEINLINE const_reverse_iterator rbegin() const
   {  return this->crbegin();  }

   BOOST_CONTAINER_FORCEINLINE const_reverse_iterator crbegin() const
   {  return const_reverse_iterator(this->cend());  }

   BOOST_CONTAINER_FORCEINLINE reverse_iterator rend()
   { return reverse_iterator(this->begin()); }

   BOOST_CONTAINER_FORCEINLINE const_reverse_iterator rend() const
   { return this->crend(); }

   BOOST_CONTAINER_FORCEINLINE const_reverse_iterator crend() const
   { return const_reverse_iterator(this->cbegin()); }

   BOOST_CONTAINER_FORCEINLINE bool empty() const
   { return this->m_data.m_vect.empty(); }

   BOOST_CONTAINER_FORCEINLINE size_type size() const
   { return this->m_data.m_vect.size(); }

   BOOST_CONTAINER_FORCEINLINE size_type max_size() const
   { return this->m_data.m_vect.max_size(); }

   BOOST_CONTAINER_FORCEINLINE void swap(flat_tree& other)
      BOOST_NOEXCEPT_IF(  allocator_traits_type::is_always_equal::value
                                 && boost::container::container_detail::is_nothrow_swappable<Compare>::value )
   {  this->m_data.swap(other.m_data);  }

   public:
   // insert/erase
   std::pair<iterator,bool> insert_unique(const value_type& val)
   {
      std::pair<iterator,bool> ret;
      insert_commit_data data;
      ret.second = this->priv_insert_unique_prepare(KeyOfValue()(val), data);
      ret.first = ret.second ? this->priv_insert_commit(data, val)
                             : iterator(vector_iterator_get_ptr(data.position));
      return ret;
   }

   std::pair<iterator,bool> insert_unique(BOOST_RV_REF(value_type) val)
   {
      std::pair<iterator,bool> ret;
      insert_commit_data data;
      ret.second = this->priv_insert_unique_prepare(KeyOfValue()(val), data);
      ret.first = ret.second ? this->priv_insert_commit(data, boost::move(val))
                             : iterator(vector_iterator_get_ptr(data.position));
      return ret;
   }

   iterator insert_equal(const value_type& val)
   {
      iterator i = this->upper_bound(KeyOfValue()(val));
      i = this->m_data.m_vect.insert(i, val);
      return i;
   }

   iterator insert_equal(BOOST_RV_REF(value_type) mval)
   {
      iterator i = this->upper_bound(KeyOfValue()(mval));
      i = this->m_data.m_vect.insert(i, boost::move(mval));
      return i;
   }

   iterator insert_unique(const_iterator hint, const value_type& val)
   {
      BOOST_ASSERT(this->priv_in_range_or_end(hint));
      insert_commit_data data;
      return this->priv_insert_unique_prepare(hint, KeyOfValue()(val), data)
            ? this->priv_insert_commit(data, val)
            : iterator(vector_iterator_get_ptr(data.position));
   }

   iterator insert_unique(const_iterator hint, BOOST_RV_REF(value_type) val)
   {
      BOOST_ASSERT(this->priv_in_range_or_end(hint));
      insert_commit_data data;
      return this->priv_insert_unique_prepare(hint, KeyOfValue()(val), data)
         ? this->priv_insert_commit(data, boost::move(val))
         : iterator(vector_iterator_get_ptr(data.position));
   }

   iterator insert_equal(const_iterator hint, const value_type& val)
   {
      BOOST_ASSERT(this->priv_in_range_or_end(hint));
      insert_commit_data data;
      this->priv_insert_equal_prepare(hint, val, data);
      return this->priv_insert_commit(data, val);
   }

   iterator insert_equal(const_iterator hint, BOOST_RV_REF(value_type) mval)
   {
      BOOST_ASSERT(this->priv_in_range_or_end(hint));
      insert_commit_data data;
      this->priv_insert_equal_prepare(hint, mval, data);
      return this->priv_insert_commit(data, boost::move(mval));
   }

   template <class InIt>
   void insert_unique(InIt first, InIt last)
   {
      for ( ; first != last; ++first){
         this->insert_unique(*first);
      }
   }

   template <class InIt>
   void insert_equal(InIt first, InIt last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename container_detail::enable_if_c
         < container_detail::is_input_iterator<InIt>::value
         >::type * = 0
      #endif
      )
   {  this->priv_insert_equal_loop(first, last);  }

   template <class InIt>
   void insert_equal(InIt first, InIt last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename container_detail::enable_if_c
         < !container_detail::is_input_iterator<InIt>::value
         >::type * = 0
      #endif
      )
   {
      const size_type len = static_cast<size_type>(boost::container::iterator_distance(first, last));
      this->reserve(this->size()+len);
      this->priv_insert_equal_loop(first, last);
   }

   //Ordered

   template <class InIt>
   void insert_equal(ordered_range_t, InIt first, InIt last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename container_detail::enable_if_c
         < container_detail::is_input_iterator<InIt>::value
         >::type * = 0
      #endif
      )
   {  this->priv_insert_equal_loop_ordered(first, last); }

   template <class FwdIt>
   void insert_equal(ordered_range_t, FwdIt first, FwdIt last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename container_detail::enable_if_c
         < !container_detail::is_input_iterator<FwdIt>::value &&
         container_detail::is_forward_iterator<FwdIt>::value
         >::type * = 0
      #endif
      )
   {
      const size_type len = static_cast<size_type>(boost::container::iterator_distance(first, last));
      this->reserve(this->size()+len);
      this->priv_insert_equal_loop_ordered(first, last);
   }

   template <class BidirIt>
   void insert_equal(ordered_range_t, BidirIt first, BidirIt last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename container_detail::disable_if_or
         < void
         , container_detail::is_input_iterator<BidirIt>
         , container_detail::is_forward_iterator<BidirIt>
         >::type * = 0
      #endif
      )
   {   this->m_data.m_vect.merge(first, last, static_cast<const value_compare &>(this->m_data));   }

   template <class InIt>
   void insert_unique(ordered_unique_range_t, InIt first, InIt last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename container_detail::enable_if_or
         < void
         , container_detail::is_input_iterator<InIt>
         , container_detail::is_forward_iterator<InIt>
         >::type * = 0
      #endif
      )
   {
      const_iterator pos(this->cend());
      for ( ; first != last; ++first){
         pos = this->insert_unique(pos, *first);
         ++pos;
      }
   }

   template <class BidirIt>
   void insert_unique(ordered_unique_range_t, BidirIt first, BidirIt last
      #if !defined(BOOST_CONTAINER_DOXYGEN_INVOKED)
      , typename container_detail::enable_if_c
         < !(container_detail::is_input_iterator<BidirIt>::value ||
             container_detail::is_forward_iterator<BidirIt>::value)
         >::type * = 0
      #endif
      )
   {   this->m_data.m_vect.merge_unique(first, last, static_cast<const value_compare &>(this->m_data));   }

   #if !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

   template <class... Args>
   std::pair<iterator, bool> emplace_unique(BOOST_FWD_REF(Args)... args)
   {
      typename aligned_storage<sizeof(value_type), alignment_of<value_type>::value>::type v;
      value_type &val = *static_cast<value_type *>(static_cast<void *>(&v));
      stored_allocator_type &a = this->get_stored_allocator();
      stored_allocator_traits::construct(a, &val, ::boost::forward<Args>(args)... );
      value_destructor<stored_allocator_type> d(a, val);
      return this->insert_unique(::boost::move(val));
   }

   template <class... Args>
   iterator emplace_hint_unique(const_iterator hint, BOOST_FWD_REF(Args)... args)
   {
      //hint checked in insert_unique
      typename aligned_storage<sizeof(value_type), alignment_of<value_type>::value>::type v;
      value_type &val = *static_cast<value_type *>(static_cast<void *>(&v));
      stored_allocator_type &a = this->get_stored_allocator();
      stored_allocator_traits::construct(a, &val, ::boost::forward<Args>(args)... );
      value_destructor<stored_allocator_type> d(a, val);
      return this->insert_unique(hint, ::boost::move(val));
   }

   template <class... Args>
   iterator emplace_equal(BOOST_FWD_REF(Args)... args)
   {
      typename aligned_storage<sizeof(value_type), alignment_of<value_type>::value>::type v;
      value_type &val = *static_cast<value_type *>(static_cast<void *>(&v));
      stored_allocator_type &a = this->get_stored_allocator();
      stored_allocator_traits::construct(a, &val, ::boost::forward<Args>(args)... );
      value_destructor<stored_allocator_type> d(a, val);
      return this->insert_equal(::boost::move(val));
   }

   template <class... Args>
   iterator emplace_hint_equal(const_iterator hint, BOOST_FWD_REF(Args)... args)
   {
      //hint checked in insert_equal
      typename aligned_storage<sizeof(value_type), alignment_of<value_type>::value>::type v;
      value_type &val = *static_cast<value_type *>(static_cast<void *>(&v));
      stored_allocator_type &a = this->get_stored_allocator();
      stored_allocator_traits::construct(a, &val, ::boost::forward<Args>(args)... );
      value_destructor<stored_allocator_type> d(a, val);
      return this->insert_equal(hint, ::boost::move(val));
   }

   template <class KeyType, class... Args>
   BOOST_CONTAINER_FORCEINLINE std::pair<iterator, bool> try_emplace
      (const_iterator hint, BOOST_FWD_REF(KeyType) key, BOOST_FWD_REF(Args)... args)
   {
      std::pair<iterator,bool> ret;
      insert_commit_data data;
      const key_type & k = key;
      ret.second = hint == const_iterator()
         ? this->priv_insert_unique_prepare(k, data)
         : this->priv_insert_unique_prepare(hint, k, data);

      if(!ret.second){
         ret.first  = this->nth(data.position - this->cbegin());
      }
      else{
         typedef typename emplace_functor_type<try_emplace_t, KeyType, Args...>::type func_t;
         typedef emplace_iterator<value_type, func_t, difference_type> it_t;
         func_t func(try_emplace_t(), ::boost::forward<KeyType>(key), ::boost::forward<Args>(args)...);
         ret.first = this->m_data.m_vect.insert(data.position, it_t(func), it_t());
      }
      return ret;
   }

   #else // !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

   #define BOOST_CONTAINER_FLAT_TREE_EMPLACE_CODE(N) \
   BOOST_MOVE_TMPL_LT##N BOOST_MOVE_CLASS##N BOOST_MOVE_GT##N \
   std::pair<iterator, bool> emplace_unique(BOOST_MOVE_UREF##N)\
   {\
      typename aligned_storage<sizeof(value_type), alignment_of<value_type>::value>::type v;\
      value_type &val = *static_cast<value_type *>(static_cast<void *>(&v));\
      stored_allocator_type &a = this->get_stored_allocator();\
      stored_allocator_traits::construct(a, &val BOOST_MOVE_I##N BOOST_MOVE_FWD##N);\
      value_destructor<stored_allocator_type> d(a, val);\
      return this->insert_unique(::boost::move(val));\
   }\
   \
   BOOST_MOVE_TMPL_LT##N BOOST_MOVE_CLASS##N BOOST_MOVE_GT##N \
   iterator emplace_hint_unique(const_iterator hint BOOST_MOVE_I##N BOOST_MOVE_UREF##N)\
   {\
      typename aligned_storage<sizeof(value_type), alignment_of<value_type>::value>::type v;\
      value_type &val = *static_cast<value_type *>(static_cast<void *>(&v));\
      stored_allocator_type &a = this->get_stored_allocator();\
      stored_allocator_traits::construct(a, &val BOOST_MOVE_I##N BOOST_MOVE_FWD##N);\
      value_destructor<stored_allocator_type> d(a, val);\
      return this->insert_unique(hint, ::boost::move(val));\
   }\
   \
   BOOST_MOVE_TMPL_LT##N BOOST_MOVE_CLASS##N BOOST_MOVE_GT##N \
   iterator emplace_equal(BOOST_MOVE_UREF##N)\
   {\
      typename aligned_storage<sizeof(value_type), alignment_of<value_type>::value>::type v;\
      value_type &val = *static_cast<value_type *>(static_cast<void *>(&v));\
      stored_allocator_type &a = this->get_stored_allocator();\
      stored_allocator_traits::construct(a, &val BOOST_MOVE_I##N BOOST_MOVE_FWD##N);\
      value_destructor<stored_allocator_type> d(a, val);\
      return this->insert_equal(::boost::move(val));\
   }\
   \
   BOOST_MOVE_TMPL_LT##N BOOST_MOVE_CLASS##N BOOST_MOVE_GT##N \
   iterator emplace_hint_equal(const_iterator hint BOOST_MOVE_I##N BOOST_MOVE_UREF##N)\
   {\
      typename aligned_storage <sizeof(value_type), alignment_of<value_type>::value>::type v;\
      value_type &val = *static_cast<value_type *>(static_cast<void *>(&v));\
      stored_allocator_type &a = this->get_stored_allocator();\
      stored_allocator_traits::construct(a, &val BOOST_MOVE_I##N BOOST_MOVE_FWD##N);\
      value_destructor<stored_allocator_type> d(a, val);\
      return this->insert_equal(hint, ::boost::move(val));\
   }\
   template <class KeyType BOOST_MOVE_I##N BOOST_MOVE_CLASS##N>\
   BOOST_CONTAINER_FORCEINLINE std::pair<iterator, bool>\
      try_emplace(const_iterator hint, BOOST_FWD_REF(KeyType) key BOOST_MOVE_I##N BOOST_MOVE_UREF##N)\
   {\
      std::pair<iterator,bool> ret;\
      insert_commit_data data;\
      const key_type & k = key;\
      ret.second = hint == const_iterator()\
         ? this->priv_insert_unique_prepare(k, data)\
         : this->priv_insert_unique_prepare(hint, k, data);\
      \
      if(!ret.second){\
         ret.first  = this->nth(data.position - this->cbegin());\
      }\
      else{\
         typedef typename emplace_functor_type<try_emplace_t, KeyType BOOST_MOVE_I##N BOOST_MOVE_TARG##N>::type func_t;\
         typedef emplace_iterator<value_type, func_t, difference_type> it_t;\
         func_t func(try_emplace_t(), ::boost::forward<KeyType>(key) BOOST_MOVE_I##N BOOST_MOVE_FWD##N);\
         ret.first = this->m_data.m_vect.insert(data.position, it_t(func), it_t());\
      }\
      return ret;\
   }\
   //
   BOOST_MOVE_ITERATE_0TO7(BOOST_CONTAINER_FLAT_TREE_EMPLACE_CODE)
   #undef BOOST_CONTAINER_FLAT_TREE_EMPLACE_CODE

   #endif   // !defined(BOOST_NO_CXX11_VARIADIC_TEMPLATES)

   template<class KeyType, class M>
   std::pair<iterator, bool> insert_or_assign(const_iterator hint, BOOST_FWD_REF(KeyType) key, BOOST_FWD_REF(M) obj)
   {
      const key_type& k = key;
      std::pair<iterator,bool> ret;
      insert_commit_data data;
      ret.second = hint == const_iterator()
         ? this->priv_insert_unique_prepare(k, data)
         : this->priv_insert_unique_prepare(hint, k, data);
      if(!ret.second){
         ret.first  = this->nth(data.position - this->cbegin());
         ret.first->second = boost::forward<M>(obj);
      }
      else{
         typedef typename emplace_functor_type<KeyType, M>::type func_t;
         typedef emplace_iterator<value_type, func_t, difference_type> it_t;
         func_t func(boost::forward<KeyType>(key), boost::forward<M>(obj));
         ret.first = this->m_data.m_vect.insert(data.position, it_t(func), it_t());
      }
      return ret;
   }

   BOOST_CONTAINER_FORCEINLINE iterator erase(const_iterator position)
   {  return this->m_data.m_vect.erase(position);  }

   size_type erase(const key_type& k)
   {
      std::pair<iterator,iterator > itp = this->equal_range(k);
      size_type ret = static_cast<size_type>(itp.second-itp.first);
      if (ret){
         this->m_data.m_vect.erase(itp.first, itp.second);
      }
      return ret;
   }

   BOOST_CONTAINER_FORCEINLINE iterator erase(const_iterator first, const_iterator last)
   {  return this->m_data.m_vect.erase(first, last);  }

   BOOST_CONTAINER_FORCEINLINE void clear()
   {  this->m_data.m_vect.clear();  }

   //! <b>Effects</b>: Tries to deallocate the excess of memory created
   //    with previous allocations. The size of the vector is unchanged
   //!
   //! <b>Throws</b>: If memory allocation throws, or T's copy constructor throws.
   //!
   //! <b>Complexity</b>: Linear to size().
   BOOST_CONTAINER_FORCEINLINE void shrink_to_fit()
   {  this->m_data.m_vect.shrink_to_fit();  }

   BOOST_CONTAINER_FORCEINLINE iterator nth(size_type n) BOOST_NOEXCEPT_OR_NOTHROW
   {  return this->m_data.m_vect.nth(n);   }

   BOOST_CONTAINER_FORCEINLINE const_iterator nth(size_type n) const BOOST_NOEXCEPT_OR_NOTHROW
   {  return this->m_data.m_vect.nth(n);   }

   BOOST_CONTAINER_FORCEINLINE size_type index_of(iterator p) BOOST_NOEXCEPT_OR_NOTHROW
   {  return this->m_data.m_vect.index_of(p);   }

   BOOST_CONTAINER_FORCEINLINE size_type index_of(const_iterator p) const BOOST_NOEXCEPT_OR_NOTHROW
   {  return this->m_data.m_vect.index_of(p);   }

   // set operations:
   iterator find(const key_type& k)
   {
      iterator i = this->lower_bound(k);
      iterator end_it = this->end();
      if (i != end_it && this->m_data.get_comp()(k, KeyOfValue()(*i))){
         i = end_it;
      }
      return i;
   }

   const_iterator find(const key_type& k) const
   {
      const_iterator i = this->lower_bound(k);

      const_iterator end_it = this->cend();
      if (i != end_it && this->m_data.get_comp()(k, KeyOfValue()(*i))){
         i = end_it;
      }
      return i;
   }

   // set operations:
   size_type count(const key_type& k) const
   {
      std::pair<const_iterator, const_iterator> p = this->equal_range(k);
      size_type n = p.second - p.first;
      return n;
   }

   template<class C2>
   void merge_unique(flat_tree<Value, KeyOfValue, C2, Allocator>& source)
   {
      this->insert( boost::make_move_iterator(source.begin())
                  , boost::make_move_iterator(source.end()));
   }

   template<class C2>
   void merge_equal(flat_tree<Value, KeyOfValue, C2, Allocator>& source)
   {
      this->insert( boost::make_move_iterator(source.begin())
                  , boost::make_move_iterator(source.end()));
   }

   void merge_unique(flat_tree& source)
   {
      this->m_data.m_vect.merge_unique
         ( boost::make_move_iterator(source.begin())
         , boost::make_move_iterator(source.end())
         , static_cast<const value_compare &>(this->m_data));
   }

   void merge_equal(flat_tree& source)
   {
      this->m_data.m_vect.merge
         ( boost::make_move_iterator(source.begin())
         , boost::make_move_iterator(source.end())
         , static_cast<const value_compare &>(this->m_data));
   }

   BOOST_CONTAINER_FORCEINLINE iterator lower_bound(const key_type& k)
   {  return this->priv_lower_bound(this->begin(), this->end(), k);  }

   BOOST_CONTAINER_FORCEINLINE const_iterator lower_bound(const key_type& k) const
   {  return this->priv_lower_bound(this->cbegin(), this->cend(), k);  }

   BOOST_CONTAINER_FORCEINLINE iterator upper_bound(const key_type& k)
   {  return this->priv_upper_bound(this->begin(), this->end(), k);  }

   BOOST_CONTAINER_FORCEINLINE const_iterator upper_bound(const key_type& k) const
   {  return this->priv_upper_bound(this->cbegin(), this->cend(), k);  }

   BOOST_CONTAINER_FORCEINLINE std::pair<iterator,iterator> equal_range(const key_type& k)
   {  return this->priv_equal_range(this->begin(), this->end(), k);  }

   BOOST_CONTAINER_FORCEINLINE std::pair<const_iterator, const_iterator> equal_range(const key_type& k) const
   {  return this->priv_equal_range(this->cbegin(), this->cend(), k);  }

   BOOST_CONTAINER_FORCEINLINE std::pair<iterator, iterator> lower_bound_range(const key_type& k)
   {  return this->priv_lower_bound_range(this->begin(), this->end(), k);  }

   BOOST_CONTAINER_FORCEINLINE std::pair<const_iterator, const_iterator> lower_bound_range(const key_type& k) const
   {  return this->priv_lower_bound_range(this->cbegin(), this->cend(), k);  }

   BOOST_CONTAINER_FORCEINLINE size_type capacity() const
   { return this->m_data.m_vect.capacity(); }

   BOOST_CONTAINER_FORCEINLINE void reserve(size_type cnt)
   { this->m_data.m_vect.reserve(cnt);   }

   BOOST_CONTAINER_FORCEINLINE friend bool operator==(const flat_tree& x, const flat_tree& y)
   {
      return x.size() == y.size() && ::boost::container::algo_equal(x.begin(), x.end(), y.begin());
   }

   BOOST_CONTAINER_FORCEINLINE friend bool operator<(const flat_tree& x, const flat_tree& y)
   {
      return ::boost::container::algo_lexicographical_compare(x.begin(), x.end(), y.begin(), y.end());
   }

   BOOST_CONTAINER_FORCEINLINE friend bool operator!=(const flat_tree& x, const flat_tree& y)
      {  return !(x == y); }

   BOOST_CONTAINER_FORCEINLINE friend bool operator>(const flat_tree& x, const flat_tree& y)
      {  return y < x;  }

   BOOST_CONTAINER_FORCEINLINE friend bool operator<=(const flat_tree& x, const flat_tree& y)
      {  return !(y < x);  }

   BOOST_CONTAINER_FORCEINLINE friend bool operator>=(const flat_tree& x, const flat_tree& y)
      {  return !(x < y);  }

   BOOST_CONTAINER_FORCEINLINE friend void swap(flat_tree& x, flat_tree& y)
      {  x.swap(y);  }

   private:

   BOOST_CONTAINER_FORCEINLINE bool priv_in_range_or_end(const_iterator pos) const
   {
      return (this->begin() <= pos) && (pos <= this->end());
   }

   struct insert_commit_data
   {
      const_iterator position;
   };

   // insert/erase
   void priv_insert_equal_prepare
      (const_iterator pos, const value_type& val, insert_commit_data &data)
   {
      // N1780
      //   To insert val at pos:
      //   if pos == end || val <= *pos
      //      if pos == begin || val >= *(pos-1)
      //         insert val before pos
      //      else
      //         insert val before upper_bound(val)
      //   else
      //      insert val before lower_bound(val)
      const value_compare &val_cmp = this->m_data;

      if(pos == this->cend() || !val_cmp(*pos, val)){
         if (pos == this->cbegin() || !val_cmp(val, pos[-1])){
            data.position = pos;
         }
         else{
            data.position =
               this->priv_upper_bound(this->cbegin(), pos, KeyOfValue()(val));
         }
      }
      else{
         data.position =
            this->priv_lower_bound(pos, this->cend(), KeyOfValue()(val));
      }
   }

   bool priv_insert_unique_prepare
      (const_iterator b, const_iterator e, const key_type& k, insert_commit_data &commit_data)
   {
      const key_compare &key_cmp  = this->priv_key_comp();
      commit_data.position = this->priv_lower_bound(b, e, k);
      return commit_data.position == e || key_cmp(k, KeyOfValue()(*commit_data.position));
   }

   BOOST_CONTAINER_FORCEINLINE bool priv_insert_unique_prepare
      (const key_type& k, insert_commit_data &commit_data)
   {  return this->priv_insert_unique_prepare(this->cbegin(), this->cend(), k, commit_data);   }

   bool priv_insert_unique_prepare
      (const_iterator pos, const key_type& k, insert_commit_data &commit_data)
   {
      //N1780. Props to Howard Hinnant!
      //To insert k at pos:
      //if pos == end || k <= *pos
      //   if pos == begin || k >= *(pos-1)
      //      insert k before pos
      //   else
      //      insert k before upper_bound(k)
      //else if pos+1 == end || k <= *(pos+1)
      //   insert k after pos
      //else
      //   insert k before lower_bound(k)
      const key_compare &key_cmp = this->priv_key_comp();
      const const_iterator cend_it = this->cend();
      if(pos == cend_it || key_cmp(k, KeyOfValue()(*pos))){ //Check if k should go before end
         const const_iterator cbeg = this->cbegin();
         commit_data.position = pos;
         if(pos == cbeg){  //If container is empty then insert it in the beginning
            return true;
         }
         const_iterator prev(pos);
         --prev;
         if(key_cmp(KeyOfValue()(*prev), k)){   //If previous element was less, then it should go between prev and pos
            return true;
         }
         else if(!key_cmp(k, KeyOfValue()(*prev))){   //If previous was equal then insertion should fail
            commit_data.position = prev;
            return false;
         }
         else{ //Previous was bigger so insertion hint was pointless, dispatch to hintless insertion
               //but reduce the search between beg and prev as prev is bigger than k
            return this->priv_insert_unique_prepare(cbeg, prev, k, commit_data);
         }
      }
      else{
         //The hint is before the insertion position, so insert it
         //in the remaining range [pos, end)
         return this->priv_insert_unique_prepare(pos, cend_it, k, commit_data);
      }
   }

   template<class Convertible>
   BOOST_CONTAINER_FORCEINLINE iterator priv_insert_commit
      (insert_commit_data &commit_data, BOOST_FWD_REF(Convertible) convertible)
   {
      return this->m_data.m_vect.insert
         ( commit_data.position
         , boost::forward<Convertible>(convertible));
   }

   template <class RanIt>
   RanIt priv_lower_bound(RanIt first, const RanIt last,
                          const key_type & key) const
   {
      const Compare &key_cmp = this->m_data.get_comp();
      KeyOfValue key_extract;
      size_type len = static_cast<size_type>(last - first);
      RanIt middle;

      while (len) {
         size_type step = len >> 1;
         middle = first;
         middle += step;

         if (key_cmp(key_extract(*middle), key)) {
            first = ++middle;
            len -= step + 1;
         }
         else{
            len = step;
         }
      }
      return first;
   }

   template <class RanIt>
   RanIt priv_upper_bound
      (RanIt first, const RanIt last,const key_type & key) const
   {
      const Compare &key_cmp = this->m_data.get_comp();
      KeyOfValue key_extract;
      size_type len = static_cast<size_type>(last - first);
      RanIt middle;

      while (len) {
         size_type step = len >> 1;
         middle = first;
         middle += step;

         if (key_cmp(key, key_extract(*middle))) {
            len = step;
         }
         else{
            first = ++middle;
            len -= step + 1;
         }
      }
      return first;
   }

   template <class RanIt>
   std::pair<RanIt, RanIt>
      priv_equal_range(RanIt first, RanIt last, const key_type& key) const
   {
      const Compare &key_cmp = this->m_data.get_comp();
      KeyOfValue key_extract;
      size_type len = static_cast<size_type>(last - first);
      RanIt middle;

      while (len) {
         size_type step = len >> 1;
         middle = first;
         middle += step;

         if (key_cmp(key_extract(*middle), key)){
            first = ++middle;
            len -= step + 1;
         }
         else if (key_cmp(key, key_extract(*middle))){
            len = step;
         }
         else {
            //Middle is equal to key
            last = first;
            last += len;
            RanIt const first_ret = this->priv_lower_bound(first, middle, key);
            return std::pair<RanIt, RanIt>
               ( first_ret, this->priv_upper_bound(++middle, last, key));
         }
      }
      return std::pair<RanIt, RanIt>(first, first);
   }

   template<class RanIt>
   std::pair<RanIt, RanIt> priv_lower_bound_range(RanIt first, RanIt last, const key_type& k) const
   {
      const Compare &key_cmp = this->m_data.get_comp();
      KeyOfValue key_extract;
      RanIt lb(this->priv_lower_bound(first, last, k)), ub(lb);
      if(lb != last && static_cast<difference_type>(!key_cmp(k, key_extract(*lb)))){
         ++ub;
      }
      return std::pair<RanIt, RanIt>(lb, ub);
   }

   template<class InIt>
   void priv_insert_equal_loop(InIt first, InIt last)
   {
      for ( ; first != last; ++first){
         this->insert_equal(*first);
      }
   }

   template<class InIt>
   void priv_insert_equal_loop_ordered(InIt first, InIt last)
   {
      const_iterator pos(this->cend());
      for ( ; first != last; ++first){
         //If ordered, then try hint version
         //to achieve constant-time complexity per insertion
         //in some cases
         pos = this->insert_equal(pos, *first);
         ++pos;
      }
   }
};

}  //namespace container_detail {

}  //namespace container {

//!has_trivial_destructor_after_move<> == true_type
//!specialization for optimizations
template <class T, class KeyOfValue,
class Compare, class Allocator>
struct has_trivial_destructor_after_move<boost::container::container_detail::flat_tree<T, KeyOfValue, Compare, Allocator> >
{
   typedef typename ::boost::container::allocator_traits<Allocator>::pointer pointer;
   static const bool value = ::boost::has_trivial_destructor_after_move<Allocator>::value &&
                             ::boost::has_trivial_destructor_after_move<pointer>::value;
};

}  //namespace boost {

#include <boost/container/detail/config_end.hpp>

#endif // BOOST_CONTAINER_FLAT_TREE_HPP
