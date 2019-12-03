/* Copyright 2003-2015 Joaquin M Lopez Munoz.
 * Distributed under the Boost Software License, Version 1.0.
 * (See accompanying file LICENSE_1_0.txt or copy at
 * http://www.boost.org/LICENSE_1_0.txt)
 *
 * See http://www.boost.org/libs/multi_index for library home page.
 */

#ifndef BOOST_MULTI_INDEX_DETAIL_COPY_MAP_HPP
#define BOOST_MULTI_INDEX_DETAIL_COPY_MAP_HPP

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/config.hpp> /* keep it first to prevent nasty warns in MSVC */
#include <algorithm>
#include <boost/detail/no_exceptions_support.hpp>
#include <boost/multi_index/detail/auto_space.hpp>
#include <boost/multi_index/detail/raw_ptr.hpp>
#include <boost/noncopyable.hpp>
#include <cstddef>
#include <functional>

namespace boost{

namespace multi_index{

namespace detail{

/* copy_map is used as an auxiliary structure during copy_() operations.
 * When a container with n nodes is replicated, node_map holds the pairings
 * between original and copied nodes, and provides a fast way to find a
 * copied node from an original one.
 * The semantics of the class are not simple, and no attempt has been made
 * to enforce it: multi_index_container handles it right. On the other hand,
 * the const interface, which is the one provided to index implementations,
 * only allows for:
 *   - Enumeration of pairs of (original,copied) nodes (excluding the headers),
 *   - fast retrieval of copied nodes (including the headers.)
 */

template <typename Node>
struct copy_map_entry
{
  copy_map_entry(Node* f,Node* s):first(f),second(s){}

  Node* first;
  Node* second;

  bool operator<(const copy_map_entry<Node>& x)const
  {
    return std::less<Node*>()(first,x.first);
  }
};

template <typename Node,typename Allocator>
class copy_map:private noncopyable
{
public:
  typedef const copy_map_entry<Node>* const_iterator;

  copy_map(
    const Allocator& al,std::size_t size,Node* header_org,Node* header_cpy):
    al_(al),size_(size),spc(al_,size_),n(0),
    header_org_(header_org),header_cpy_(header_cpy),released(false)
  {}

  ~copy_map()
  {
    if(!released){
      for(std::size_t i=0;i<n;++i){
        boost::detail::allocator::destroy(&(spc.data()+i)->second->value());
        deallocate((spc.data()+i)->second);
      }
    }
  }

  const_iterator begin()const{return raw_ptr<const_iterator>(spc.data());}
  const_iterator end()const{return raw_ptr<const_iterator>(spc.data()+n);}

  void clone(Node* node)
  {
    (spc.data()+n)->first=node;
    (spc.data()+n)->second=raw_ptr<Node*>(al_.allocate(1));
    BOOST_TRY{
      boost::detail::allocator::construct(
        &(spc.data()+n)->second->value(),node->value());
    }
    BOOST_CATCH(...){
      deallocate((spc.data()+n)->second);
      BOOST_RETHROW;
    }
    BOOST_CATCH_END
    ++n;

    if(n==size_){
      std::sort(
        raw_ptr<copy_map_entry<Node>*>(spc.data()),
        raw_ptr<copy_map_entry<Node>*>(spc.data())+size_);
    }
  }

  Node* find(Node* node)const
  {
    if(node==header_org_)return header_cpy_;
    return std::lower_bound(
      begin(),end(),copy_map_entry<Node>(node,0))->second;
  }

  void release()
  {
    released=true;
  }

private:
  typedef typename boost::detail::allocator::rebind_to<
    Allocator,Node
  >::type                                               allocator_type;
  typedef typename allocator_type::pointer              allocator_pointer;

  allocator_type                                        al_;
  std::size_t                                           size_;
  auto_space<copy_map_entry<Node>,Allocator>            spc;
  std::size_t                                           n;
  Node*                                                 header_org_;
  Node*                                                 header_cpy_;
  bool                                                  released;

  void deallocate(Node* node)
  {
    al_.deallocate(static_cast<allocator_pointer>(node),1);
  }
};

} /* namespace multi_index::detail */

} /* namespace multi_index */

} /* namespace boost */

#endif
