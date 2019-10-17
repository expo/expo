/* Copyright 2003-2015 Joaquin M Lopez Munoz.
 * Distributed under the Boost Software License, Version 1.0.
 * (See accompanying file LICENSE_1_0.txt or copy at
 * http://www.boost.org/LICENSE_1_0.txt)
 *
 * See http://www.boost.org/libs/multi_index for library home page.
 */

#ifndef BOOST_MULTI_INDEX_RANKED_INDEX_HPP
#define BOOST_MULTI_INDEX_RANKED_INDEX_HPP

#if defined(_MSC_VER)
#pragma once
#endif

#include <boost/config.hpp> /* keep it first to prevent nasty warns in MSVC */
#include <boost/multi_index/detail/ord_index_impl.hpp>
#include <boost/multi_index/detail/rnk_index_ops.hpp>
#include <boost/multi_index/ranked_index_fwd.hpp>

namespace boost{

namespace multi_index{

namespace detail{

/* ranked_index augments a given ordered index to provide rank operations */

template<typename OrderedIndexNodeImpl>
struct ranked_node:OrderedIndexNodeImpl
{
  std::size_t size;
};

template<typename OrderedIndexImpl>
class ranked_index:public OrderedIndexImpl
{
  typedef          OrderedIndexImpl         super;

protected:
  typedef typename super::node_type         node_type;
  typedef typename super::node_impl_pointer node_impl_pointer;

public:
  typedef typename super::ctor_args_list ctor_args_list;
  typedef typename super::allocator_type allocator_type;
  typedef typename super::iterator       iterator;

  /* rank operations */

  iterator nth(std::size_t n)const
  {
    return this->make_iterator(node_type::from_impl(
      ranked_index_nth(n,this->header()->impl())));
  }

  std::size_t rank(iterator position)const
  {
    BOOST_MULTI_INDEX_CHECK_VALID_ITERATOR(position);
    BOOST_MULTI_INDEX_CHECK_IS_OWNER(position,*this);

    return ranked_index_rank(
      position.get_node()->impl(),this->header()->impl());
  }

  template<typename CompatibleKey>
  std::size_t find_rank(const CompatibleKey& x)const
  {
    return ranked_index_find_rank(
      this->root(),this->header(),this->key,x,this->comp_);
  }

  template<typename CompatibleKey,typename CompatibleCompare>
  std::size_t find_rank(
    const CompatibleKey& x,const CompatibleCompare& comp)const
  {
    return ranked_index_find_rank(
      this->root(),this->header(),this->key,x,comp);
  }

  template<typename CompatibleKey>
  std::size_t lower_bound_rank(const CompatibleKey& x)const
  {
    return ranked_index_lower_bound_rank(
      this->root(),this->header(),this->key,x,this->comp_);
  }

  template<typename CompatibleKey,typename CompatibleCompare>
  std::size_t lower_bound_rank(
    const CompatibleKey& x,const CompatibleCompare& comp)const
  {
    return ranked_index_lower_bound_rank(
      this->root(),this->header(),this->key,x,comp);
  }

  template<typename CompatibleKey>
  std::size_t upper_bound_rank(const CompatibleKey& x)const
  {
    return ranked_index_upper_bound_rank(
      this->root(),this->header(),this->key,x,this->comp_);
  }

  template<typename CompatibleKey,typename CompatibleCompare>
  std::size_t upper_bound_rank(
    const CompatibleKey& x,const CompatibleCompare& comp)const
  {
    return ranked_index_upper_bound_rank(
      this->root(),this->header(),this->key,x,comp);
  }

  template<typename CompatibleKey>
  std::pair<std::size_t,std::size_t> equal_range_rank(
    const CompatibleKey& x)const
  {
    return ranked_index_equal_range_rank(
      this->root(),this->header(),this->key,x,this->comp_);
  }

  template<typename CompatibleKey,typename CompatibleCompare>
  std::pair<std::size_t,std::size_t> equal_range_rank(
    const CompatibleKey& x,const CompatibleCompare& comp)const
  {
    return ranked_index_equal_range_rank(
      this->root(),this->header(),this->key,x,comp);
  }

  template<typename LowerBounder,typename UpperBounder>
  std::pair<std::size_t,std::size_t>
  range_rank(LowerBounder lower,UpperBounder upper)const
  {
    typedef typename mpl::if_<
      is_same<LowerBounder,unbounded_type>,
      BOOST_DEDUCED_TYPENAME mpl::if_<
        is_same<UpperBounder,unbounded_type>,
        both_unbounded_tag,
        lower_unbounded_tag
      >::type,
      BOOST_DEDUCED_TYPENAME mpl::if_<
        is_same<UpperBounder,unbounded_type>,
        upper_unbounded_tag,
        none_unbounded_tag
      >::type
    >::type dispatch;

    return range_rank(lower,upper,dispatch());
  }

protected:
  ranked_index(const ranked_index& x):super(x){};

  ranked_index(const ranked_index& x,do_not_copy_elements_tag):
    super(x,do_not_copy_elements_tag()){};

  ranked_index(
    const ctor_args_list& args_list,const allocator_type& al):
    super(args_list,al){}

private:
  template<typename LowerBounder,typename UpperBounder>
  std::pair<std::size_t,std::size_t>
  range_rank(LowerBounder lower,UpperBounder upper,none_unbounded_tag)const
  {
    node_type* y=this->header();
    node_type* z=this->root();

    if(!z)return std::pair<std::size_t,std::size_t>(0,0);

    std::size_t s=z->size;

    do{
      if(!lower(this->key(z->value()))){
        z=node_type::from_impl(z->right());
      }
      else if(!upper(this->key(z->value()))){
        y=z;
        s-=ranked_node_size(y->right())+1;
        z=node_type::from_impl(z->left());
      }
      else{
        return std::pair<std::size_t,std::size_t>(
          s-z->size+
            lower_range_rank(node_type::from_impl(z->left()),z,lower),
          s-ranked_node_size(z->right())+
            upper_range_rank(node_type::from_impl(z->right()),y,upper));
      }
    }while(z);

    return std::pair<std::size_t,std::size_t>(s,s);
  }

  template<typename LowerBounder,typename UpperBounder>
  std::pair<std::size_t,std::size_t>
  range_rank(LowerBounder,UpperBounder upper,lower_unbounded_tag)const
  {
    return std::pair<std::size_t,std::size_t>(
      0,
      upper_range_rank(this->root(),this->header(),upper));
  }

  template<typename LowerBounder,typename UpperBounder>
  std::pair<std::size_t,std::size_t>
  range_rank(LowerBounder lower,UpperBounder,upper_unbounded_tag)const
  {
    return std::pair<std::size_t,std::size_t>(
      lower_range_rank(this->root(),this->header(),lower),
      this->size());
  }

  template<typename LowerBounder,typename UpperBounder>
  std::pair<std::size_t,std::size_t>
  range_rank(LowerBounder,UpperBounder,both_unbounded_tag)const
  {
    return std::pair<std::size_t,std::size_t>(0,this->size());
  }

  template<typename LowerBounder>
  std::size_t
  lower_range_rank(node_type* top,node_type* y,LowerBounder lower)const
  {
    if(!top)return 0;

    std::size_t s=top->size;

    do{
      if(lower(this->key(top->value()))){
        y=top;
        s-=ranked_node_size(y->right())+1;
        top=node_type::from_impl(top->left());
      }
      else top=node_type::from_impl(top->right());
    }while(top);

    return s;
  }

  template<typename UpperBounder>
  std::size_t
  upper_range_rank(node_type* top,node_type* y,UpperBounder upper)const
  {
    if(!top)return 0;

    std::size_t s=top->size;

    do{
      if(!upper(this->key(top->value()))){
        y=top;
        s-=ranked_node_size(y->right())+1;
        top=node_type::from_impl(top->left());
      }
      else top=node_type::from_impl(top->right());
    }while(top);

    return s;
  }
};

/* augmenting policy for ordered_index */

struct rank_policy
{
  template<typename OrderedIndexNodeImpl>
  struct augmented_node
  {
    typedef ranked_node<OrderedIndexNodeImpl> type;
  };

  template<typename OrderedIndexImpl>
  struct augmented_interface
  {
    typedef ranked_index<OrderedIndexImpl> type;
  };

  /* algorithmic stuff */

  template<typename Pointer>
  static void add(Pointer x,Pointer root)
  {
    x->size=1;
    while(x!=root){
      x=x->parent();
      ++(x->size);
    }
  }

  template<typename Pointer>
  static void remove(Pointer x,Pointer root)
  {
    while(x!=root){
      x=x->parent();
      --(x->size);
    }
  }

  template<typename Pointer>
  static void copy(Pointer x,Pointer y)
  {
    y->size=x->size;
  }

  template<typename Pointer>
  static void rotate_left(Pointer x,Pointer y) /* in: x==y->left() */
  {
    y->size=x->size;
    x->size=ranked_node_size(x->left())+ranked_node_size(x->right())+1;
  }

  template<typename Pointer>
  static void rotate_right(Pointer x,Pointer y) /* in: x==y->right() */
  {
    rotate_left(x,y);
  }

#if defined(BOOST_MULTI_INDEX_ENABLE_INVARIANT_CHECKING)
  /* invariant stuff */

  template<typename Pointer>
  static bool invariant(Pointer x)
  {
    return x->size==ranked_node_size(x->left())+ranked_node_size(x->right())+1;
  }
#endif
};

} /* namespace multi_index::detail */

/* ranked_index specifiers */

template<typename Arg1,typename Arg2,typename Arg3>
struct ranked_unique
{
  typedef typename detail::ordered_index_args<
    Arg1,Arg2,Arg3>                                index_args;
  typedef typename index_args::tag_list_type::type tag_list_type;
  typedef typename index_args::key_from_value_type key_from_value_type;
  typedef typename index_args::compare_type        compare_type;

  template<typename Super>
  struct node_class
  {
    typedef detail::ordered_index_node<detail::rank_policy,Super> type;
  };

  template<typename SuperMeta>
  struct index_class
  {
    typedef detail::ordered_index<
      key_from_value_type,compare_type,
      SuperMeta,tag_list_type,detail::ordered_unique_tag,
      detail::rank_policy>                                type;
  };
};

template<typename Arg1,typename Arg2,typename Arg3>
struct ranked_non_unique
{
  typedef detail::ordered_index_args<
    Arg1,Arg2,Arg3>                                index_args;
  typedef typename index_args::tag_list_type::type tag_list_type;
  typedef typename index_args::key_from_value_type key_from_value_type;
  typedef typename index_args::compare_type        compare_type;

  template<typename Super>
  struct node_class
  {
    typedef detail::ordered_index_node<detail::rank_policy,Super> type;
  };

  template<typename SuperMeta>
  struct index_class
  {
    typedef detail::ordered_index<
      key_from_value_type,compare_type,
      SuperMeta,tag_list_type,detail::ordered_non_unique_tag,
      detail::rank_policy>                                    type;
  };
};

} /* namespace multi_index */

} /* namespace boost */

#endif
