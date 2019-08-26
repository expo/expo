//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2013. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/container for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_CONTAINER_DETAIL_ADAPTIVE_NODE_POOL_IMPL_HPP
#define BOOST_CONTAINER_DETAIL_ADAPTIVE_NODE_POOL_IMPL_HPP

#ifndef BOOST_CONFIG_HPP
#  include <boost/config.hpp>
#endif

#if defined(BOOST_HAS_PRAGMA_ONCE)
#  pragma once
#endif

#include <boost/container/detail/config_begin.hpp>
#include <boost/container/detail/workaround.hpp>

// container
#include <boost/container/container_fwd.hpp>
#include <boost/container/throw_exception.hpp>
// container/detail
#include <boost/container/detail/pool_common.hpp>
#include <boost/container/detail/iterator.hpp>
#include <boost/container/detail/iterator_to_raw_pointer.hpp>
#include <boost/container/detail/math_functions.hpp>
#include <boost/container/detail/mpl.hpp>
#include <boost/container/detail/to_raw_pointer.hpp>
#include <boost/container/detail/type_traits.hpp>
// intrusive
#include <boost/intrusive/pointer_traits.hpp>
#include <boost/intrusive/set.hpp>
#include <boost/intrusive/list.hpp>
#include <boost/intrusive/slist.hpp>
// other
#include <boost/assert.hpp>
#include <boost/core/no_exceptions_support.hpp>
#include <cstddef>

namespace boost {
namespace container {

namespace adaptive_pool_flag {

static const unsigned int none            = 0u;
static const unsigned int align_only      = 1u << 0u;
static const unsigned int size_ordered    = 1u << 1u;
static const unsigned int address_ordered = 1u << 2u;

}  //namespace adaptive_pool_flag{

namespace container_detail {

template<class size_type>
struct hdr_offset_holder_t
{
   hdr_offset_holder_t(size_type offset = 0)
      : hdr_offset(offset)
   {}
   size_type hdr_offset;
};

template<class SizeType, unsigned int Flags>
struct less_func;

template<class SizeType>
struct less_func<SizeType, adaptive_pool_flag::none>
{
   static bool less(SizeType, SizeType, const void *, const void *)
   {  return true;   }
};

template<class SizeType>
struct less_func<SizeType, adaptive_pool_flag::size_ordered>
{
   static bool less(SizeType ls, SizeType rs, const void *, const void *)
   {  return ls < rs;   }
};

template<class SizeType>
struct less_func<SizeType, adaptive_pool_flag::address_ordered>
{
   static bool less(SizeType, SizeType, const void *la, const void *ra)
   {  return &la < &ra;   }
};

template<class SizeType>
struct less_func<SizeType, adaptive_pool_flag::size_ordered | adaptive_pool_flag::address_ordered>
{
   static bool less(SizeType ls, SizeType rs, const void *la, const void *ra)
   {  return (ls < rs) || ((ls == rs) && (la < ra));  }
};

template<class VoidPointer, class SizeType, bool ordered>
struct block_container_traits
{
   typedef typename bi::make_set_base_hook
      < bi::void_pointer<VoidPointer>
      , bi::optimize_size<true>
      , bi::link_mode<bi::normal_link> >::type hook_t;

   template<class T>
   struct container
   {
      typedef typename bi::make_multiset
         <T, bi::base_hook<hook_t>, bi::size_type<SizeType> >::type  type;
   };

   template<class Container>
   static void reinsert_was_used(Container &container, typename Container::reference v, bool)
   {
      typedef typename Container::const_iterator const_block_iterator;
      const const_block_iterator this_block
         (Container::s_iterator_to(const_cast<typename Container::const_reference>(v)));
      const_block_iterator next_block(this_block);
      if(++next_block != container.cend()){
         if(this_block->free_nodes.size() > next_block->free_nodes.size()){
            container.erase(this_block);
            container.insert(v);
         }
      }
   }

   template<class Container>
   static void insert_was_empty(Container &container, typename Container::value_type &v, bool)
   {
      container.insert(v);
   }

   template<class Container>
   static void erase_first(Container &container)
   {
      container.erase(container.cbegin());
   }

   template<class Container>
   static void erase_last(Container &container)
   {
      container.erase(--container.cend());
   }
};

template<class VoidPointer, class SizeType>
struct block_container_traits<VoidPointer, SizeType, false>
{
   typedef typename bi::make_list_base_hook
      < bi::void_pointer<VoidPointer>
      , bi::link_mode<bi::normal_link> >::type hook_t;

   template<class T>
   struct container
   {
      typedef typename bi::make_list
         <T, bi::base_hook<hook_t>, bi::size_type<SizeType>, bi::constant_time_size<false> >::type  type;
   };

   template<class Container>
   static void reinsert_was_used(Container &container, typename Container::value_type &v, bool is_full)
   {
      if(is_full){
         container.erase(Container::s_iterator_to(v));
         container.push_back(v);
      }
   }

   template<class Container>
   static void insert_was_empty(Container &container, typename Container::value_type &v, bool is_full)
   {
      if(is_full){
         container.push_back(v);
      }
      else{
         container.push_front(v);
      }
   }

   template<class Container>
   static void erase_first(Container &container)
   {
      container.pop_front();
   }

   template<class Container>
   static void erase_last(Container &container)
   {
      container.pop_back();
   }
};

template<class MultiallocationChain, class VoidPointer, class SizeType, unsigned int Flags>
struct adaptive_pool_types
{
   typedef VoidPointer void_pointer;
   static const bool ordered = (Flags & (adaptive_pool_flag::size_ordered | adaptive_pool_flag::address_ordered)) != 0;
   typedef block_container_traits<VoidPointer, SizeType, ordered> block_container_traits_t;
   typedef typename block_container_traits_t::hook_t hook_t;
   typedef hdr_offset_holder_t<SizeType> hdr_offset_holder;
   static const unsigned int order_flags = Flags & (adaptive_pool_flag::size_ordered | adaptive_pool_flag::address_ordered);
   typedef MultiallocationChain free_nodes_t;

   struct block_info_t
      : public hdr_offset_holder,
        public hook_t
   {
      //An intrusive list of free node from this block
      free_nodes_t free_nodes;
      friend bool operator <(const block_info_t &l, const block_info_t &r)
      {
         return less_func<SizeType, order_flags>::
            less(l.free_nodes.size(), r.free_nodes.size(), &l , &r);
      }

      friend bool operator ==(const block_info_t &l, const block_info_t &r)
      {  return &l == &r;  }
   };
   typedef typename block_container_traits_t:: template container<block_info_t>::type  block_container_t;
};

template<class size_type>
inline size_type calculate_alignment
   ( size_type overhead_percent, size_type real_node_size
   , size_type hdr_size, size_type hdr_offset_size, size_type payload_per_allocation)
{
   //to-do: handle real_node_size != node_size
   const size_type divisor  = overhead_percent*real_node_size;
   const size_type dividend = hdr_offset_size*100;
   size_type elements_per_subblock = (dividend - 1)/divisor + 1;
   size_type candidate_power_of_2 =
      upper_power_of_2(elements_per_subblock*real_node_size + hdr_offset_size);
   bool overhead_satisfied = false;
   //Now calculate the wors-case overhead for a subblock
   const size_type max_subblock_overhead  = hdr_size + payload_per_allocation;
   while(!overhead_satisfied){
      elements_per_subblock = (candidate_power_of_2 - max_subblock_overhead)/real_node_size;
      const size_type overhead_size = candidate_power_of_2 - elements_per_subblock*real_node_size;
      if(overhead_size*100/candidate_power_of_2 < overhead_percent){
         overhead_satisfied = true;
      }
      else{
         candidate_power_of_2 <<= 1;
      }
   }
   return candidate_power_of_2;
}

template<class size_type>
inline void calculate_num_subblocks
   (size_type alignment, size_type real_node_size, size_type elements_per_block
   , size_type &num_subblocks, size_type &real_num_node, size_type overhead_percent
   , size_type hdr_size, size_type hdr_offset_size, size_type payload_per_allocation)
{
   const size_type hdr_subblock_elements = (alignment - hdr_size - payload_per_allocation)/real_node_size;
   size_type elements_per_subblock = (alignment - hdr_offset_size)/real_node_size;
   size_type possible_num_subblock = (elements_per_block - 1)/elements_per_subblock + 1;
   while(((possible_num_subblock-1)*elements_per_subblock + hdr_subblock_elements) < elements_per_block){
      ++possible_num_subblock;
   }
   elements_per_subblock = (alignment - hdr_offset_size)/real_node_size;
   bool overhead_satisfied = false;
   while(!overhead_satisfied){
      const size_type total_data = (elements_per_subblock*(possible_num_subblock-1) + hdr_subblock_elements)*real_node_size;
      const size_type total_size = alignment*possible_num_subblock;
      if((total_size - total_data)*100/total_size < overhead_percent){
         overhead_satisfied = true;
      }
      else{
         ++possible_num_subblock;
      }
   }
   num_subblocks = possible_num_subblock;
   real_num_node = (possible_num_subblock-1)*elements_per_subblock + hdr_subblock_elements;
}

template<class SegmentManagerBase, unsigned int Flags>
class private_adaptive_node_pool_impl
{
   //Non-copyable
   private_adaptive_node_pool_impl();
   private_adaptive_node_pool_impl(const private_adaptive_node_pool_impl &);
   private_adaptive_node_pool_impl &operator=(const private_adaptive_node_pool_impl &);
   typedef private_adaptive_node_pool_impl this_type;

   typedef typename SegmentManagerBase::void_pointer void_pointer;
   static const typename SegmentManagerBase::
      size_type PayloadPerAllocation = SegmentManagerBase::PayloadPerAllocation;
   //Flags
   //align_only
   static const bool AlignOnly      = (Flags & adaptive_pool_flag::align_only) != 0;
   typedef bool_<AlignOnly>            IsAlignOnly;
   typedef true_                       AlignOnlyTrue;
   typedef false_                      AlignOnlyFalse;
   //size_ordered
   static const bool SizeOrdered    = (Flags & adaptive_pool_flag::size_ordered) != 0;
   typedef bool_<SizeOrdered>          IsSizeOrdered;
   typedef true_                       SizeOrderedTrue;
   typedef false_                      SizeOrderedFalse;
   //address_ordered
   static const bool AddressOrdered = (Flags & adaptive_pool_flag::address_ordered) != 0;
   typedef bool_<AddressOrdered>       IsAddressOrdered;
   typedef true_                       AddressOrderedTrue;
   typedef false_                      AddressOrderedFalse;

   public:
   typedef typename SegmentManagerBase::multiallocation_chain        multiallocation_chain;
   typedef typename SegmentManagerBase::size_type                    size_type;

   private:
   typedef adaptive_pool_types
      <multiallocation_chain, void_pointer, size_type, Flags>        adaptive_pool_types_t;
   typedef typename adaptive_pool_types_t::free_nodes_t              free_nodes_t;
   typedef typename adaptive_pool_types_t::block_info_t              block_info_t;
   typedef typename adaptive_pool_types_t::block_container_t         block_container_t;
   typedef typename adaptive_pool_types_t::block_container_traits_t  block_container_traits_t;
   typedef typename block_container_t::iterator                      block_iterator;
   typedef typename block_container_t::const_iterator                const_block_iterator;
   typedef typename adaptive_pool_types_t::hdr_offset_holder         hdr_offset_holder;

   static const size_type MaxAlign = alignment_of<void_pointer>::value;
   static const size_type HdrSize  = ((sizeof(block_info_t)-1)/MaxAlign+1)*MaxAlign;
   static const size_type HdrOffsetSize = ((sizeof(hdr_offset_holder)-1)/MaxAlign+1)*MaxAlign;

   public:
   //!Segment manager typedef
   typedef SegmentManagerBase                 segment_manager_base_type;

   //!Constructor from a segment manager. Never throws
   private_adaptive_node_pool_impl
      ( segment_manager_base_type *segment_mngr_base
      , size_type node_size
      , size_type nodes_per_block
      , size_type max_free_blocks
      , unsigned char overhead_percent
      )
   :  m_max_free_blocks(max_free_blocks)
   ,  m_real_node_size(lcm(node_size, size_type(alignment_of<void_pointer>::value)))
      //Round the size to a power of two value.
      //This is the total memory size (including payload) that we want to
      //allocate from the general-purpose allocator
   ,  m_real_block_alignment
         (AlignOnly ?
            upper_power_of_2(HdrSize + m_real_node_size*nodes_per_block) :
            calculate_alignment( (size_type)overhead_percent, m_real_node_size
                               , HdrSize, HdrOffsetSize, PayloadPerAllocation))
      //This is the real number of nodes per block
   ,  m_num_subblocks(0)
   ,  m_real_num_node(AlignOnly ? (m_real_block_alignment - PayloadPerAllocation - HdrSize)/m_real_node_size : 0)
      //General purpose allocator
   ,  mp_segment_mngr_base(segment_mngr_base)
   ,  m_block_container()
   ,  m_totally_free_blocks(0)
   {
      if(!AlignOnly){
         calculate_num_subblocks
            ( m_real_block_alignment
            , m_real_node_size
            , nodes_per_block
            , m_num_subblocks
            , m_real_num_node
            , (size_type)overhead_percent
            , HdrSize
            , HdrOffsetSize
            , PayloadPerAllocation);
      }
   }

   //!Destructor. Deallocates all allocated blocks. Never throws
   ~private_adaptive_node_pool_impl()
   {  this->priv_clear();  }

   size_type get_real_num_node() const
   {  return m_real_num_node; }

   //!Returns the segment manager. Never throws
   segment_manager_base_type* get_segment_manager_base()const
   {  return container_detail::to_raw_pointer(mp_segment_mngr_base);  }

   //!Allocates array of count elements. Can throw
   void *allocate_node()
   {
      this->priv_invariants();
      //If there are no free nodes we allocate a new block
      if(!m_block_container.empty()){
         //We take the first free node the multiset can't be empty
         free_nodes_t &free_nodes = m_block_container.begin()->free_nodes;
         BOOST_ASSERT(!free_nodes.empty());
         const size_type free_nodes_count = free_nodes.size();
         void *first_node = container_detail::to_raw_pointer(free_nodes.pop_front());
         if(free_nodes.empty()){
            block_container_traits_t::erase_first(m_block_container);
         }
         m_totally_free_blocks -= static_cast<size_type>(free_nodes_count == m_real_num_node);
         this->priv_invariants();
         return first_node;
      }
      else{
         multiallocation_chain chain;
         this->priv_append_from_new_blocks(1, chain, IsAlignOnly());
         return container_detail::to_raw_pointer(chain.pop_front());
      }
   }

   //!Deallocates an array pointed by ptr. Never throws
   void deallocate_node(void *pElem)
   {
      this->priv_invariants();
      block_info_t &block_info = *this->priv_block_from_node(pElem);
      BOOST_ASSERT(block_info.free_nodes.size() < m_real_num_node);

      //We put the node at the beginning of the free node list
      block_info.free_nodes.push_back(void_pointer(pElem));

      //The loop reinserts all blocks except the last one
      this->priv_reinsert_block(block_info, block_info.free_nodes.size() == 1);
      this->priv_deallocate_free_blocks(m_max_free_blocks);
      this->priv_invariants();
   }

   //!Allocates n nodes.
   //!Can throw
   void allocate_nodes(const size_type n, multiallocation_chain &chain)
   {
      size_type i = 0;
      BOOST_TRY{
         this->priv_invariants();
         while(i != n){
            //If there are no free nodes we allocate all needed blocks
            if (m_block_container.empty()){
               this->priv_append_from_new_blocks(n - i, chain, IsAlignOnly());
               BOOST_ASSERT(m_block_container.empty() || (++m_block_container.cbegin() == m_block_container.cend()));
               BOOST_ASSERT(chain.size() == n);
               break;
            }
            free_nodes_t &free_nodes = m_block_container.begin()->free_nodes;
            const size_type free_nodes_count_before = free_nodes.size();
            m_totally_free_blocks -= static_cast<size_type>(free_nodes_count_before == m_real_num_node);
            const size_type num_left  = n-i;
            const size_type num_elems = (num_left < free_nodes_count_before) ? num_left : free_nodes_count_before;
            typedef typename free_nodes_t::iterator free_nodes_iterator;

            if(num_left < free_nodes_count_before){
               const free_nodes_iterator it_bbeg(free_nodes.before_begin());
               free_nodes_iterator it_bend(it_bbeg);
               for(size_type j = 0; j != num_elems; ++j){
                  ++it_bend;
               }
               free_nodes_iterator it_end = it_bend; ++it_end;
               free_nodes_iterator it_beg = it_bbeg; ++it_beg;
               free_nodes.erase_after(it_bbeg, it_end, num_elems);
               chain.incorporate_after(chain.last(), &*it_beg, &*it_bend, num_elems);
               //chain.splice_after(chain.last(), free_nodes, it_bbeg, it_bend, num_elems);
               BOOST_ASSERT(!free_nodes.empty());
            }
            else{
               const free_nodes_iterator it_beg(free_nodes.begin()), it_bend(free_nodes.last());
               free_nodes.clear();
               chain.incorporate_after(chain.last(), &*it_beg, &*it_bend, num_elems);
               block_container_traits_t::erase_first(m_block_container);
            }
            i += num_elems;
         }
      }
      BOOST_CATCH(...){
         this->deallocate_nodes(chain);
         BOOST_RETHROW
      }
      BOOST_CATCH_END
      this->priv_invariants();
   }

   //!Deallocates a linked list of nodes. Never throws
   void deallocate_nodes(multiallocation_chain &nodes)
   {
      this->priv_invariants();
      //To take advantage of node locality, wait until two
      //nodes belong to different blocks. Only then reinsert
      //the block of the first node in the block tree.
      //Cache of the previous block
      block_info_t *prev_block_info = 0;

      //If block was empty before this call, it's not already
      //inserted in the block tree.
      bool prev_block_was_empty     = false;
      typedef typename free_nodes_t::iterator free_nodes_iterator;
      {
         const free_nodes_iterator itbb(nodes.before_begin()), ite(nodes.end());
         free_nodes_iterator itf(nodes.begin()), itbf(itbb);
         size_type splice_node_count = size_type(-1);
         while(itf != ite){
            void *pElem = container_detail::to_raw_pointer(container_detail::iterator_to_raw_pointer(itf));
            block_info_t &block_info = *this->priv_block_from_node(pElem);
            BOOST_ASSERT(block_info.free_nodes.size() < m_real_num_node);
            ++splice_node_count;

            //If block change is detected calculate the cached block position in the tree
            if(&block_info != prev_block_info){
               if(prev_block_info){ //Make sure we skip the initial "dummy" cache
                  free_nodes_iterator it(itbb); ++it;
                  nodes.erase_after(itbb, itf, splice_node_count);
                  prev_block_info->free_nodes.incorporate_after(prev_block_info->free_nodes.last(), &*it, &*itbf, splice_node_count);
                  this->priv_reinsert_block(*prev_block_info, prev_block_was_empty);
                  splice_node_count = 0;
               }
               //Update cache with new data
               prev_block_was_empty = block_info.free_nodes.empty();
               prev_block_info = &block_info;
            }
            itbf = itf;
            ++itf;
         }
      }
      if(prev_block_info){
         //The loop reinserts all blocks except the last one
         const free_nodes_iterator itfirst(nodes.begin()), itlast(nodes.last());
         const size_type splice_node_count = nodes.size();
         nodes.clear();
         prev_block_info->free_nodes.incorporate_after(prev_block_info->free_nodes.last(), &*itfirst, &*itlast, splice_node_count);
         this->priv_reinsert_block(*prev_block_info, prev_block_was_empty);
         this->priv_invariants();
         this->priv_deallocate_free_blocks(m_max_free_blocks);
      }
   }

   void deallocate_free_blocks()
   {  this->priv_deallocate_free_blocks(0);  }

   size_type num_free_nodes()
   {
      typedef typename block_container_t::const_iterator citerator;
      size_type count = 0;
      citerator it (m_block_container.begin()), itend(m_block_container.end());
      for(; it != itend; ++it){
         count += it->free_nodes.size();
      }
      return count;
   }

   void swap(private_adaptive_node_pool_impl &other)
   {
      BOOST_ASSERT(m_max_free_blocks == other.m_max_free_blocks);
      BOOST_ASSERT(m_real_node_size == other.m_real_node_size);
      BOOST_ASSERT(m_real_block_alignment == other.m_real_block_alignment);
      BOOST_ASSERT(m_real_num_node == other.m_real_num_node);
      std::swap(mp_segment_mngr_base, other.mp_segment_mngr_base);
      std::swap(m_totally_free_blocks, other.m_totally_free_blocks);
      m_block_container.swap(other.m_block_container);
   }

   //Deprecated, use deallocate_free_blocks
   void deallocate_free_chunks()
   {  this->priv_deallocate_free_blocks(0);   }

   private:

   void priv_deallocate_free_blocks(size_type max_free_blocks)
   {  //Trampoline function to ease inlining
      if(m_totally_free_blocks > max_free_blocks){
         this->priv_deallocate_free_blocks_impl(max_free_blocks);
      }
   }

   void priv_deallocate_free_blocks_impl(size_type max_free_blocks)
   {
      this->priv_invariants();
      //Now check if we've reached the free nodes limit
      //and check if we have free blocks. If so, deallocate as much
      //as we can to stay below the limit
      multiallocation_chain chain;
      {
         const const_block_iterator itend = m_block_container.cend();
         const_block_iterator it = itend;
         --it;
         size_type totally_free_blocks = m_totally_free_blocks;

         for( ; totally_free_blocks > max_free_blocks; --totally_free_blocks){
            BOOST_ASSERT(it->free_nodes.size() == m_real_num_node);
            void *addr = priv_first_subblock_from_block(const_cast<block_info_t*>(&*it));
            --it;
            block_container_traits_t::erase_last(m_block_container);
            chain.push_front(void_pointer(addr));
         }
         BOOST_ASSERT((m_totally_free_blocks - max_free_blocks) == chain.size());
         m_totally_free_blocks = max_free_blocks;
      }
      this->mp_segment_mngr_base->deallocate_many(chain);
   }

   void priv_reinsert_block(block_info_t &prev_block_info, const bool prev_block_was_empty)
   {
      //Cache the free nodes from the block
      const size_type this_block_free_nodes = prev_block_info.free_nodes.size();
      const bool is_full = this_block_free_nodes == m_real_num_node;

      //Update free block count
      m_totally_free_blocks += static_cast<size_type>(is_full);
      if(prev_block_was_empty){
         block_container_traits_t::insert_was_empty(m_block_container, prev_block_info, is_full);
      }
      else{
         block_container_traits_t::reinsert_was_used(m_block_container, prev_block_info, is_full);
      }
   }

   class block_destroyer;
   friend class block_destroyer;

   class block_destroyer
   {
      public:
      block_destroyer(const this_type *impl, multiallocation_chain &chain)
         :  mp_impl(impl), m_chain(chain)
      {}

      void operator()(typename block_container_t::pointer to_deallocate)
      {  return this->do_destroy(to_deallocate, IsAlignOnly()); }

      private:
      void do_destroy(typename block_container_t::pointer to_deallocate, AlignOnlyTrue)
      {
         BOOST_ASSERT(to_deallocate->free_nodes.size() == mp_impl->m_real_num_node);
         m_chain.push_back(to_deallocate);
      }

      void do_destroy(typename block_container_t::pointer to_deallocate, AlignOnlyFalse)
      {
         BOOST_ASSERT(to_deallocate->free_nodes.size() == mp_impl->m_real_num_node);
         BOOST_ASSERT(0 == to_deallocate->hdr_offset);
         hdr_offset_holder *hdr_off_holder =
            mp_impl->priv_first_subblock_from_block(container_detail::to_raw_pointer(to_deallocate));
         m_chain.push_back(hdr_off_holder);
      }

      const this_type *mp_impl;
      multiallocation_chain &m_chain;
   };

   //This macro will activate invariant checking. Slow, but helpful for debugging the code.
   //#define BOOST_CONTAINER_ADAPTIVE_NODE_POOL_CHECK_INVARIANTS
   void priv_invariants()
   #ifdef BOOST_CONTAINER_ADAPTIVE_NODE_POOL_CHECK_INVARIANTS
   #undef BOOST_CONTAINER_ADAPTIVE_NODE_POOL_CHECK_INVARIANTS
   {
      const const_block_iterator itend(m_block_container.end());

      {  //We iterate through the block tree to free the memory
         const_block_iterator it(m_block_container.begin());

         if(it != itend){
            for(++it; it != itend; ++it){
               const_block_iterator prev(it);
               --prev;
               BOOST_ASSERT(*prev < *it);
               (void)prev;   (void)it;
            }
         }
      }
      {  //Check that the total free nodes are correct
         const_block_iterator it(m_block_container.cbegin());
         size_type total_free_nodes = 0;
         for(; it != itend; ++it){
            total_free_nodes += it->free_nodes.size();
         }
         BOOST_ASSERT(total_free_nodes >= m_totally_free_blocks*m_real_num_node);
      }
      {  //Check that the total totally free blocks are correct
         BOOST_ASSERT(m_block_container.size() >= m_totally_free_blocks);
         const_block_iterator it = m_block_container.cend();
         size_type total_free_blocks = m_totally_free_blocks;
         while(total_free_blocks--){
            BOOST_ASSERT((--it)->free_nodes.size() == m_real_num_node);
         }
      }

      if(!AlignOnly){
         //Check that header offsets are correct
         const_block_iterator it = m_block_container.begin();
         for(; it != itend; ++it){
            hdr_offset_holder *hdr_off_holder = this->priv_first_subblock_from_block(const_cast<block_info_t *>(&*it));
            for(size_type i = 0, max = m_num_subblocks; i < max; ++i){
               const size_type offset = reinterpret_cast<char*>(const_cast<block_info_t *>(&*it)) - reinterpret_cast<char*>(hdr_off_holder);
               BOOST_ASSERT(hdr_off_holder->hdr_offset == offset);
               BOOST_ASSERT(0 == ((size_type)hdr_off_holder & (m_real_block_alignment - 1)));
               BOOST_ASSERT(0 == (hdr_off_holder->hdr_offset & (m_real_block_alignment - 1)));
               hdr_off_holder = reinterpret_cast<hdr_offset_holder *>(reinterpret_cast<char*>(hdr_off_holder) + m_real_block_alignment);
            }
         }
      }
   }
   #else
   {} //empty
   #endif

   //!Deallocates all used memory. Never throws
   void priv_clear()
   {
      #ifndef NDEBUG
      block_iterator it    = m_block_container.begin();
      block_iterator itend = m_block_container.end();
      size_type n_free_nodes = 0;
      for(; it != itend; ++it){
         //Check for memory leak
         BOOST_ASSERT(it->free_nodes.size() == m_real_num_node);
         ++n_free_nodes;
      }
      BOOST_ASSERT(n_free_nodes == m_totally_free_blocks);
      #endif
      //Check for memory leaks
      this->priv_invariants();
      multiallocation_chain chain;
      m_block_container.clear_and_dispose(block_destroyer(this, chain));
      this->mp_segment_mngr_base->deallocate_many(chain);
      m_totally_free_blocks = 0;
   }

   block_info_t *priv_block_from_node(void *node, AlignOnlyFalse) const
   {
      hdr_offset_holder *hdr_off_holder =
         reinterpret_cast<hdr_offset_holder*>((std::size_t)node & size_type(~(m_real_block_alignment - 1)));
      BOOST_ASSERT(0 == ((std::size_t)hdr_off_holder & (m_real_block_alignment - 1)));
      BOOST_ASSERT(0 == (hdr_off_holder->hdr_offset & (m_real_block_alignment - 1)));
      block_info_t *block = reinterpret_cast<block_info_t *>
         (reinterpret_cast<char*>(hdr_off_holder) + hdr_off_holder->hdr_offset);
      BOOST_ASSERT(block->hdr_offset == 0);
      return block;
   }

   block_info_t *priv_block_from_node(void *node, AlignOnlyTrue) const
   {
      return (block_info_t *)((std::size_t)node & std::size_t(~(m_real_block_alignment - 1)));
   }

   block_info_t *priv_block_from_node(void *node) const
   {  return this->priv_block_from_node(node, IsAlignOnly());   }

   hdr_offset_holder *priv_first_subblock_from_block(block_info_t *block) const
   {  return this->priv_first_subblock_from_block(block, IsAlignOnly());   }

   hdr_offset_holder *priv_first_subblock_from_block(block_info_t *block, AlignOnlyFalse) const
   {
      hdr_offset_holder *const hdr_off_holder = reinterpret_cast<hdr_offset_holder*>
            (reinterpret_cast<char*>(block) - (m_num_subblocks-1)*m_real_block_alignment);
      BOOST_ASSERT(hdr_off_holder->hdr_offset == size_type(reinterpret_cast<char*>(block) - reinterpret_cast<char*>(hdr_off_holder)));
      BOOST_ASSERT(0 == ((std::size_t)hdr_off_holder & (m_real_block_alignment - 1)));
      BOOST_ASSERT(0 == (hdr_off_holder->hdr_offset & (m_real_block_alignment - 1)));
      return hdr_off_holder;
   }

   hdr_offset_holder *priv_first_subblock_from_block(block_info_t *block, AlignOnlyTrue) const
   {
      return reinterpret_cast<hdr_offset_holder*>(block);
   }

   void priv_dispatch_block_chain_or_free
      ( multiallocation_chain &chain, block_info_t &c_info, size_type num_node
      , char *mem_address, size_type total_elements, bool insert_block_if_free)
   {
      BOOST_ASSERT(chain.size() <= total_elements);
      //First add all possible nodes to the chain
      const size_type left = total_elements - chain.size();
      const size_type max_chain = (num_node < left) ? num_node : left;
      mem_address = static_cast<char *>(container_detail::to_raw_pointer
         (chain.incorporate_after(chain.last(), void_pointer(mem_address), m_real_node_size, max_chain)));
      //Now store remaining nodes in the free list
      if(const size_type max_free = num_node - max_chain){
         free_nodes_t & free_nodes = c_info.free_nodes;
         free_nodes.incorporate_after(free_nodes.last(), void_pointer(mem_address), m_real_node_size, max_free);
         if(insert_block_if_free){
            m_block_container.push_front(c_info);
         }
      }
   }

   //!Allocates a several blocks of nodes. Can throw
   void priv_append_from_new_blocks(size_type min_elements, multiallocation_chain &chain, AlignOnlyTrue)
   {
      BOOST_ASSERT(m_block_container.empty());
      BOOST_ASSERT(min_elements > 0);
      const size_type n = (min_elements - 1)/m_real_num_node + 1;
      const size_type real_block_size = m_real_block_alignment - PayloadPerAllocation;
      const size_type total_elements = chain.size() + min_elements;
      for(size_type i = 0; i != n; ++i){
         //We allocate a new NodeBlock and put it the last
         //element of the tree
         char *mem_address = static_cast<char*>
            (mp_segment_mngr_base->allocate_aligned(real_block_size, m_real_block_alignment));
         if(!mem_address){
            //In case of error, free memory deallocating all nodes (the new ones allocated
            //in this function plus previously stored nodes in chain).
            this->deallocate_nodes(chain);
            throw_bad_alloc();
         }
         block_info_t &c_info = *new(mem_address)block_info_t();
         mem_address += HdrSize;
         if(i != (n-1)){
            chain.incorporate_after(chain.last(), void_pointer(mem_address), m_real_node_size, m_real_num_node);
         }
         else{
            this->priv_dispatch_block_chain_or_free(chain, c_info, m_real_num_node, mem_address, total_elements, true);
         }
      }
   }

   void priv_append_from_new_blocks(size_type min_elements, multiallocation_chain &chain, AlignOnlyFalse)
   {
      BOOST_ASSERT(m_block_container.empty());
      BOOST_ASSERT(min_elements > 0);
      const size_type n = (min_elements - 1)/m_real_num_node + 1;
      const size_type real_block_size = m_real_block_alignment*m_num_subblocks - PayloadPerAllocation;
      const size_type elements_per_subblock = (m_real_block_alignment - HdrOffsetSize)/m_real_node_size;
      const size_type hdr_subblock_elements = (m_real_block_alignment - HdrSize - PayloadPerAllocation)/m_real_node_size;
      const size_type total_elements = chain.size() + min_elements;

      for(size_type i = 0; i != n; ++i){
         //We allocate a new NodeBlock and put it the last
         //element of the tree
         char *mem_address = static_cast<char*>
            (mp_segment_mngr_base->allocate_aligned(real_block_size, m_real_block_alignment));
         if(!mem_address){
            //In case of error, free memory deallocating all nodes (the new ones allocated
            //in this function plus previously stored nodes in chain).
            this->deallocate_nodes(chain);
            throw_bad_alloc();
         }
         //First initialize header information on the last subblock
         char *hdr_addr = mem_address + m_real_block_alignment*(m_num_subblocks-1);
         block_info_t &c_info = *new(hdr_addr)block_info_t();
         //Some structural checks
         BOOST_ASSERT(static_cast<void*>(&static_cast<hdr_offset_holder&>(c_info).hdr_offset) ==
                      static_cast<void*>(&c_info));   (void)c_info;
         if(i != (n-1)){
            for( size_type subblock = 0, maxsubblock = m_num_subblocks - 1
               ; subblock < maxsubblock
               ; ++subblock, mem_address += m_real_block_alignment){
               //Initialize header offset mark
               new(mem_address) hdr_offset_holder(size_type(hdr_addr - mem_address));
               chain.incorporate_after
                  (chain.last(), void_pointer(mem_address + HdrOffsetSize), m_real_node_size, elements_per_subblock);
            }
            chain.incorporate_after(chain.last(), void_pointer(hdr_addr + HdrSize), m_real_node_size, hdr_subblock_elements);
         }
         else{
            for( size_type subblock = 0, maxsubblock = m_num_subblocks - 1
               ; subblock < maxsubblock
               ; ++subblock, mem_address += m_real_block_alignment){
               //Initialize header offset mark
               new(mem_address) hdr_offset_holder(size_type(hdr_addr - mem_address));
               this->priv_dispatch_block_chain_or_free
                  (chain, c_info, elements_per_subblock, mem_address + HdrOffsetSize, total_elements, false);
            }
            this->priv_dispatch_block_chain_or_free
               (chain, c_info, hdr_subblock_elements, hdr_addr + HdrSize, total_elements, true);
         }
      }
   }

   private:
   typedef typename boost::intrusive::pointer_traits
      <void_pointer>::template rebind_pointer<segment_manager_base_type>::type   segment_mngr_base_ptr_t;
   const size_type m_max_free_blocks;
   const size_type m_real_node_size;
   //Round the size to a power of two value.
   //This is the total memory size (including payload) that we want to
   //allocate from the general-purpose allocator
   const size_type m_real_block_alignment;
   size_type m_num_subblocks;
   //This is the real number of nodes per block
   //const
   size_type m_real_num_node;
   segment_mngr_base_ptr_t             mp_segment_mngr_base;   //Segment manager
   block_container_t                    m_block_container;       //Intrusive block list
   size_type                           m_totally_free_blocks;  //Free blocks
};

}  //namespace container_detail {
}  //namespace container {
}  //namespace boost {

#include <boost/container/detail/config_end.hpp>

#endif   //#ifndef BOOST_CONTAINER_DETAIL_ADAPTIVE_NODE_POOL_IMPL_HPP
