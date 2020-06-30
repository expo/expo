//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2005-2011. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/interprocess for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_INTERPROCESS_MEM_ALGO_DETAIL_SIMPLE_SEQ_FIT_IMPL_HPP
#define BOOST_INTERPROCESS_MEM_ALGO_DETAIL_SIMPLE_SEQ_FIT_IMPL_HPP

#if defined(_MSC_VER)
#  pragma once
#endif

#include <boost/interprocess/detail/config_begin.hpp>
#include <boost/interprocess/detail/workaround.hpp>

#include <boost/intrusive/pointer_traits.hpp>

#include <boost/interprocess/interprocess_fwd.hpp>
#include <boost/interprocess/containers/allocation_type.hpp>
#include <boost/interprocess/offset_ptr.hpp>
#include <boost/interprocess/sync/interprocess_mutex.hpp>
#include <boost/interprocess/exceptions.hpp>
#include <boost/interprocess/detail/utilities.hpp>
#include <boost/interprocess/detail/multi_segment_services.hpp>
#include <boost/type_traits/alignment_of.hpp>
#include <boost/type_traits/type_with_alignment.hpp>
#include <boost/interprocess/detail/min_max.hpp>
#include <boost/interprocess/sync/scoped_lock.hpp>
#include <boost/intrusive/pointer_traits.hpp>
#include <algorithm>
#include <utility>
#include <cstring>

#include <boost/assert.hpp>
#include <new>

/*!\file
   Describes sequential fit algorithm used to allocate objects in shared memory.
   This class is intended as a base class for single segment and multi-segment
   implementations.
*/

namespace boost {

namespace interprocess {

namespace ipcdetail {

/*!This class implements the simple sequential fit algorithm with a simply
   linked list of free buffers.
   This class is intended as a base class for single segment and multi-segment
   implementations.*/
template<class MutexFamily, class VoidPointer>
class simple_seq_fit_impl
{
   //Non-copyable
   simple_seq_fit_impl();
   simple_seq_fit_impl(const simple_seq_fit_impl &);
   simple_seq_fit_impl &operator=(const simple_seq_fit_impl &);

   public:
   /*!Shared interprocess_mutex family used for the rest of the Interprocess framework*/
   typedef MutexFamily        mutex_family;
   /*!Pointer type to be used with the rest of the Interprocess framework*/
   typedef VoidPointer        void_pointer;

   typedef typename boost::intrusive::pointer_traits<char_ptr>::difference_type difference_type;
   typedef typename boost::make_unsigned<difference_type>::type size_type;


   private:
   struct block_ctrl;
   typedef typename boost::intrusive::
      pointer_traits<void_pointer>::template
         rebind_pointer<block_ctrl>::type                         block_ctrl_ptr;

   /*!Block control structure*/
   struct block_ctrl
   {
      /*!Offset pointer to the next block.*/
      block_ctrl_ptr m_next;
      /*!This block's memory size (including block_ctrl
         header) in BasicSize units*/
      size_type    m_size;

      size_type get_user_bytes() const
      {  return this->m_size*Alignment - BlockCtrlBytes; }

      size_type get_total_bytes() const
      {  return this->m_size*Alignment; }

      static block_ctrl *get_block_from_addr(void *addr)
      {
         return reinterpret_cast<block_ctrl*>
            (reinterpret_cast<char*>(addr) - BlockCtrlBytes);
      }

      void *get_addr() const
      {
         return reinterpret_cast<block_ctrl*>
            (reinterpret_cast<const char*>(this) + BlockCtrlBytes);
      }

   };

   /*!Shared interprocess_mutex to protect memory allocate/deallocate*/
   typedef typename MutexFamily::mutex_type        interprocess_mutex;

   /*!This struct includes needed data and derives from
      interprocess_mutex to allow EBO when using null interprocess_mutex*/
   struct header_t : public interprocess_mutex
   {
      /*!Pointer to the first free block*/
      block_ctrl        m_root;
      /*!Allocated bytes for internal checking*/
      size_type       m_allocated;
      /*!The size of the memory segment*/
      size_type       m_size;
   }  m_header;

   public:
   /*!Constructor. "size" is the total size of the managed memory segment,
      "extra_hdr_bytes" indicates the extra bytes beginning in the sizeof(simple_seq_fit_impl)
      offset that the allocator should not use at all.*/
   simple_seq_fit_impl           (size_type size, size_type extra_hdr_bytes);
   /*!Destructor.*/
   ~simple_seq_fit_impl();
   /*!Obtains the minimum size needed by the algorithm*/
   static size_type get_min_size (size_type extra_hdr_bytes);

   //Functions for single segment management

   /*!Allocates bytes, returns 0 if there is not more memory*/
   void* allocate             (size_type nbytes);

   /*!Deallocates previously allocated bytes*/
   void   deallocate          (void *addr);

   /*!Returns the size of the memory segment*/
   size_type get_size()  const;

   /*!Increases managed memory in extra_size bytes more*/
   void grow(size_type extra_size);

   /*!Returns true if all allocated memory has been deallocated*/
   bool all_memory_deallocated();

   /*!Makes an internal sanity check and returns true if success*/
   bool check_sanity();

   //!Initializes to zero all the memory that's not in use.
   //!This function is normally used for security reasons.
   void clear_free_memory();

   std::pair<void *, bool>
      allocation_command  (boost::interprocess::allocation_type command,   size_type limit_size,
                           size_type preferred_size,size_type &received_size,
                           void *reuse_ptr = 0, size_type backwards_multiple = 1);

   /*!Returns the size of the buffer previously allocated pointed by ptr*/
   size_type size(void *ptr) const;

   /*!Allocates aligned bytes, returns 0 if there is not more memory.
      Alignment must be power of 2*/
   void* allocate_aligned     (size_type nbytes, size_type alignment);

   /*!Allocates bytes, if there is no more memory, it executes functor
      f(size_type) to allocate a new segment to manage. The functor returns
      std::pair<void*, size_type> indicating the base address and size of
      the new segment. If the new segment can't be allocated, allocate
      it will return 0.*/
   void* multi_allocate(size_type nbytes);

   private:
   /*!Real allocation algorithm with min allocation option*/
   std::pair<void *, bool> priv_allocate(boost::interprocess::allocation_type command
                                        ,size_type min_size
                                        ,size_type preferred_size
                                        ,size_type &received_size
                                        ,void *reuse_ptr = 0);
   /*!Returns next block if it's free.
      Returns 0 if next block is not free.*/
   block_ctrl *priv_next_block_if_free(block_ctrl *ptr);

   /*!Returns previous block's if it's free.
      Returns 0 if previous block is not free.*/
   std::pair<block_ctrl*, block_ctrl*>priv_prev_block_if_free(block_ctrl *ptr);

   /*!Real expand function implementation*/
   bool priv_expand(void *ptr
                   ,size_type min_size, size_type preferred_size
                   ,size_type &received_size);

   /*!Real expand to both sides implementation*/
   void* priv_expand_both_sides(boost::interprocess::allocation_type command
                               ,size_type min_size
                               ,size_type preferred_size
                               ,size_type &received_size
                               ,void *reuse_ptr
                               ,bool only_preferred_backwards);

   /*!Real shrink function implementation*/
   bool priv_shrink(void *ptr
                   ,size_type max_size, size_type preferred_size
                   ,size_type &received_size);

   //!Real private aligned allocation function
   void* priv_allocate_aligned     (size_type nbytes, size_type alignment);

   /*!Checks if block has enough memory and splits/unlinks the block
      returning the address to the users*/
   void* priv_check_and_allocate(size_type units
                                ,block_ctrl* prev
                                ,block_ctrl* block
                                ,size_type &received_size);
   /*!Real deallocation algorithm*/
   void priv_deallocate(void *addr);

   /*!Makes a new memory portion available for allocation*/
   void priv_add_segment(void *addr, size_type size);

   static const std::size_t Alignment = ::boost::alignment_of<boost::ipcdetail::max_align>::value;
   static const std::size_t BlockCtrlBytes = ipcdetail::ct_rounded_size<sizeof(block_ctrl), Alignment>::value;
   static const std::size_t BlockCtrlSize  = BlockCtrlBytes/Alignment;
   static const std::size_t MinBlockSize   = BlockCtrlSize + Alignment;

   public:
   static const std::size_t PayloadPerAllocation = BlockCtrlBytes;
};

template<class MutexFamily, class VoidPointer>
inline simple_seq_fit_impl<MutexFamily, VoidPointer>::
   simple_seq_fit_impl(size_type size, size_type extra_hdr_bytes)
{
   //Initialize sizes and counters
   m_header.m_allocated = 0;
   m_header.m_size      = size;

   //Initialize pointers
   size_type block1_off  = ipcdetail::get_rounded_size(sizeof(*this)+extra_hdr_bytes, Alignment);
   m_header.m_root.m_next  = reinterpret_cast<block_ctrl*>
                              (reinterpret_cast<char*>(this) + block1_off);
   m_header.m_root.m_next->m_size  = (size - block1_off)/Alignment;
   m_header.m_root.m_next->m_next  = &m_header.m_root;
}

template<class MutexFamily, class VoidPointer>
inline simple_seq_fit_impl<MutexFamily, VoidPointer>::~simple_seq_fit_impl()
{
   //There is a memory leak!
//   BOOST_ASSERT(m_header.m_allocated == 0);
//   BOOST_ASSERT(m_header.m_root.m_next->m_next == block_ctrl_ptr(&m_header.m_root));
}

template<class MutexFamily, class VoidPointer>
inline void simple_seq_fit_impl<MutexFamily, VoidPointer>::grow(size_type extra_size)
{
   //Old highest address block's end offset
   size_type old_end = m_header.m_size/Alignment*Alignment;

   //Update managed buffer's size
   m_header.m_size += extra_size;

   //We need at least MinBlockSize blocks to create a new block
   if((m_header.m_size - old_end) < MinBlockSize){
      return;
   }

   //We'll create a new free block with extra_size bytes
   block_ctrl *new_block = reinterpret_cast<block_ctrl*>
                              (reinterpret_cast<char*>(this) + old_end);

   new_block->m_next = 0;
   new_block->m_size = (m_header.m_size - old_end)/Alignment;
   m_header.m_allocated += new_block->m_size*Alignment;
   this->priv_deallocate(reinterpret_cast<char*>(new_block) + BlockCtrlBytes);
}

template<class MutexFamily, class VoidPointer>
inline void simple_seq_fit_impl<MutexFamily, VoidPointer>::priv_add_segment(void *addr, size_type size)
{
   //Check size
   BOOST_ASSERT(!(size < MinBlockSize));
   if(size < MinBlockSize)
      return;
   //Construct big block using the new segment
   block_ctrl *new_block   = static_cast<block_ctrl *>(addr);
   new_block->m_size       = size/Alignment;
   new_block->m_next       = 0;
   //Simulate this block was previously allocated
   m_header.m_allocated   += new_block->m_size*Alignment;
   //Return block and insert it in the free block list
   this->priv_deallocate(reinterpret_cast<char*>(new_block) + BlockCtrlBytes);
}

template<class MutexFamily, class VoidPointer>
inline typename simple_seq_fit_impl<MutexFamily, VoidPointer>::size_type
simple_seq_fit_impl<MutexFamily, VoidPointer>::get_size()  const
   {  return m_header.m_size;  }

template<class MutexFamily, class VoidPointer>
inline typename simple_seq_fit_impl<MutexFamily, VoidPointer>::size_type
simple_seq_fit_impl<MutexFamily, VoidPointer>::
   get_min_size (size_type extra_hdr_bytes)
{
   return ipcdetail::get_rounded_size(sizeof(simple_seq_fit_impl)+extra_hdr_bytes
                                  ,Alignment)
          + MinBlockSize;
}

template<class MutexFamily, class VoidPointer>
inline bool simple_seq_fit_impl<MutexFamily, VoidPointer>::
    all_memory_deallocated()
{
   //-----------------------
   boost::interprocess::scoped_lock<interprocess_mutex> guard(m_header);
   //-----------------------
   return m_header.m_allocated == 0 &&
          ipcdetail::to_raw_pointer(m_header.m_root.m_next->m_next) == &m_header.m_root;
}

template<class MutexFamily, class VoidPointer>
inline void simple_seq_fit_impl<MutexFamily, VoidPointer>::clear_free_memory()
{
   //-----------------------
   boost::interprocess::scoped_lock<interprocess_mutex> guard(m_header);
   //-----------------------
   block_ctrl *block = ipcdetail::to_raw_pointer(m_header.m_root.m_next);

   //Iterate through all free portions
   do{
      //Just clear user the memory part reserved for the user
      std::memset( reinterpret_cast<char*>(block) + BlockCtrlBytes
                 , 0
                 , block->m_size*Alignment - BlockCtrlBytes);
      block = ipcdetail::to_raw_pointer(block->m_next);
   }
   while(block != &m_header.m_root);
}

template<class MutexFamily, class VoidPointer>
inline bool simple_seq_fit_impl<MutexFamily, VoidPointer>::
    check_sanity()
{
   //-----------------------
   boost::interprocess::scoped_lock<interprocess_mutex> guard(m_header);
   //-----------------------
   block_ctrl *block = ipcdetail::to_raw_pointer(m_header.m_root.m_next);

   size_type free_memory = 0;

   //Iterate through all blocks obtaining their size
   do{
      //Free blocks's next must be always valid
      block_ctrl *next = ipcdetail::to_raw_pointer(block->m_next);
      if(!next){
         return false;
      }
      free_memory += block->m_size*Alignment;
      block = next;
   }
   while(block != &m_header.m_root);

   //Check allocated bytes are less than size
   if(m_header.m_allocated > m_header.m_size){
      return false;
   }

   //Check free bytes are less than size
   if(free_memory > m_header.m_size){
      return false;
   }
   return true;
}

template<class MutexFamily, class VoidPointer>
inline void* simple_seq_fit_impl<MutexFamily, VoidPointer>::
   allocate(size_type nbytes)
{
   //-----------------------
   boost::interprocess::scoped_lock<interprocess_mutex> guard(m_header);
   //-----------------------
   size_type ignore;
   return priv_allocate(boost::interprocess::allocate_new, nbytes, nbytes, ignore).first;
}

template<class MutexFamily, class VoidPointer>
inline void* simple_seq_fit_impl<MutexFamily, VoidPointer>::
   allocate_aligned(size_type nbytes, size_type alignment)
{
   //-----------------------
   boost::interprocess::scoped_lock<interprocess_mutex> guard(m_header);
   //-----------------------
   return priv_allocate_aligned(nbytes, alignment);
}

template<class MutexFamily, class VoidPointer>
inline std::pair<void *, bool> simple_seq_fit_impl<MutexFamily, VoidPointer>::
   allocation_command  (boost::interprocess::allocation_type command,   size_type min_size,
                        size_type preferred_size,size_type &received_size,
                        void *reuse_ptr, size_type backwards_multiple)
{
   //-----------------------
   boost::interprocess::scoped_lock<interprocess_mutex> guard(m_header);
   //-----------------------
   (void)backwards_multiple;
   command &= ~boost::interprocess::expand_bwd;
   if(!command)
      return std::pair<void *, bool>(0, false);
   return priv_allocate(command, min_size, preferred_size, received_size, reuse_ptr);
}

template<class MutexFamily, class VoidPointer>
inline typename simple_seq_fit_impl<MutexFamily, VoidPointer>::size_type
simple_seq_fit_impl<MutexFamily, VoidPointer>::
   size(void *ptr) const
{
   //We need no synchronization since this block is not going
   //to be modified
   //Obtain the real size of the block
   block_ctrl *block = reinterpret_cast<block_ctrl*>
                        (reinterpret_cast<char*>(ptr) - BlockCtrlBytes);
   return block->m_size*Alignment - BlockCtrlBytes;
}

template<class MutexFamily, class VoidPointer>
inline void* simple_seq_fit_impl<MutexFamily, VoidPointer>::
   multi_allocate(size_type nbytes)
{
   //-----------------------
   boost::interprocess::scoped_lock<interprocess_mutex> guard(m_header);
   //-----------------------
   //Multisegment pointer. Let's try first the normal allocation
   //since it's faster.
   size_type ignore;
   void *addr = this->priv_allocate(boost::interprocess::allocate_new, nbytes, nbytes, ignore).first;
   if(!addr){
      //If this fails we will try the allocation through the segment
      //creator.
      size_type group, id;
      //Obtain the segment group of this segment
      void_pointer::get_group_and_id(this, group, id);
      if(group == 0){
         //Ooops, group 0 is not valid.
         return 0;
      }
      //Now obtain the polymorphic functor that creates
      //new segments and try to allocate again.
      boost::interprocess::multi_segment_services *p_services =
         static_cast<boost::interprocess::multi_segment_services*>
                     (void_pointer::find_group_data(group));
      BOOST_ASSERT(p_services);
     std::pair<void *, std::size_t> ret =
         p_services->create_new_segment(MinBlockSize > nbytes ? MinBlockSize : nbytes);
      if(ret.first){
         priv_add_segment(ret.first, ret.second);
         addr = this->priv_allocate(boost::interprocess::allocate_new, nbytes, nbytes, ignore).first;
      }
   }
   return addr;
}

template<class MutexFamily, class VoidPointer>
void* simple_seq_fit_impl<MutexFamily, VoidPointer>::
   priv_expand_both_sides(boost::interprocess::allocation_type command
                         ,size_type min_size
                         ,size_type preferred_size
                         ,size_type &received_size
                         ,void *reuse_ptr
                         ,bool only_preferred_backwards)
{
   typedef std::pair<block_ctrl *, block_ctrl *> prev_block_t;
   block_ctrl *reuse = block_ctrl::get_block_from_addr(reuse_ptr);
   received_size = 0;

   if(this->size(reuse_ptr) > min_size){
      received_size = this->size(reuse_ptr);
      return reuse_ptr;
   }

   if(command & boost::interprocess::expand_fwd){
      if(priv_expand(reuse_ptr, min_size, preferred_size, received_size))
         return reuse_ptr;
   }
   else{
      received_size = this->size(reuse_ptr);
   }
   if(command & boost::interprocess::expand_bwd){
      size_type extra_forward = !received_size ? 0 : received_size + BlockCtrlBytes;
      prev_block_t prev_pair = priv_prev_block_if_free(reuse);
      block_ctrl *prev = prev_pair.second;
      if(!prev){
         return 0;
      }

      size_type needs_backwards =
         ipcdetail::get_rounded_size(preferred_size - extra_forward, Alignment);

      if(!only_preferred_backwards){
         needs_backwards =
            max_value(ipcdetail::get_rounded_size(min_size - extra_forward, Alignment)
                     ,min_value(prev->get_user_bytes(), needs_backwards));
      }

      //Check if previous block has enough size
      if((prev->get_user_bytes()) >=  needs_backwards){
         //Now take all next space. This will succeed
         if(!priv_expand(reuse_ptr, received_size, received_size, received_size)){
            BOOST_ASSERT(0);
         }

         //We need a minimum size to split the previous one
         if((prev->get_user_bytes() - needs_backwards) > 2*BlockCtrlBytes){
            block_ctrl *new_block = reinterpret_cast<block_ctrl *>
               (reinterpret_cast<char*>(reuse) - needs_backwards - BlockCtrlBytes);
            new_block->m_next = 0;
            new_block->m_size =
               BlockCtrlSize + (needs_backwards + extra_forward)/Alignment;
            prev->m_size =
               (prev->get_total_bytes() - needs_backwards)/Alignment - BlockCtrlSize;
            received_size = needs_backwards + extra_forward;
            m_header.m_allocated += needs_backwards + BlockCtrlBytes;
            return new_block->get_addr();
         }
         else{
            //Just merge the whole previous block
            block_ctrl *prev_2_block = prev_pair.first;
            //Update received size and allocation
            received_size = extra_forward + prev->get_user_bytes();
            m_header.m_allocated += prev->get_total_bytes();
            //Now unlink it from previous block
            prev_2_block->m_next = prev->m_next;
            prev->m_size = reuse->m_size + prev->m_size;
            prev->m_next = 0;
            return prev->get_addr();
         }
      }
   }
   return 0;
}

template<class MutexFamily, class VoidPointer>
std::pair<void *, bool> simple_seq_fit_impl<MutexFamily, VoidPointer>::
   priv_allocate(boost::interprocess::allocation_type command
                ,size_type limit_size
                ,size_type preferred_size
                ,size_type &received_size
                ,void *reuse_ptr)
{
   if(command & boost::interprocess::shrink_in_place){
      bool success =
         this->priv_shrink(reuse_ptr, limit_size, preferred_size, received_size);
      return std::pair<void *, bool> ((success ? reuse_ptr : 0), true);
   }
   typedef std::pair<void *, bool> return_type;
   received_size = 0;

   if(limit_size > preferred_size)
      return return_type(0, false);

   //Number of units to request (including block_ctrl header)
   size_type nunits = ipcdetail::get_rounded_size(preferred_size, Alignment)/Alignment + BlockCtrlSize;

   //Get the root and the first memory block
   block_ctrl *prev                 = &m_header.m_root;
   block_ctrl *block                = ipcdetail::to_raw_pointer(prev->m_next);
   block_ctrl *root                 = &m_header.m_root;
   block_ctrl *biggest_block        = 0;
   block_ctrl *prev_biggest_block   = 0;
   size_type biggest_size         = limit_size;

   //Expand in place
   //reuse_ptr, limit_size, preferred_size, received_size
   //
   if(reuse_ptr && (command & (boost::interprocess::expand_fwd | boost::interprocess::expand_bwd))){
      void *ret = priv_expand_both_sides
         (command, limit_size, preferred_size, received_size, reuse_ptr, true);
      if(ret)
         return return_type(ret, true);
   }

   if(command & boost::interprocess::allocate_new){
      received_size = 0;
      while(block != root){
         //Update biggest block pointers
         if(block->m_size > biggest_size){
            prev_biggest_block = prev;
            biggest_size  = block->m_size;
            biggest_block = block;
         }
         void *addr = this->priv_check_and_allocate(nunits, prev, block, received_size);
         if(addr) return return_type(addr, false);
         //Bad luck, let's check next block
         prev  = block;
         block = ipcdetail::to_raw_pointer(block->m_next);
      }

      //Bad luck finding preferred_size, now if we have any biggest_block
      //try with this block
      if(biggest_block){
         received_size = biggest_block->m_size*Alignment - BlockCtrlSize;
         nunits = ipcdetail::get_rounded_size(limit_size, Alignment)/Alignment + BlockCtrlSize;
         void *ret = this->priv_check_and_allocate
                        (nunits, prev_biggest_block, biggest_block, received_size);
         if(ret)
            return return_type(ret, false);
      }
   }
   //Now try to expand both sides with min size
   if(reuse_ptr && (command & (boost::interprocess::expand_fwd | boost::interprocess::expand_bwd))){
      return return_type(priv_expand_both_sides
         (command, limit_size, preferred_size, received_size, reuse_ptr, false), true);
   }
   return return_type(0, false);
}

template<class MutexFamily, class VoidPointer>
inline typename simple_seq_fit_impl<MutexFamily, VoidPointer>::block_ctrl *
   simple_seq_fit_impl<MutexFamily, VoidPointer>::
      priv_next_block_if_free
         (typename simple_seq_fit_impl<MutexFamily, VoidPointer>::block_ctrl *ptr)
{
   //Take the address where the next block should go
   block_ctrl *next_block = reinterpret_cast<block_ctrl*>
      (reinterpret_cast<char*>(ptr) + ptr->m_size*Alignment);

   //Check if the adjacent block is in the managed segment
   size_type distance = (reinterpret_cast<char*>(next_block) - reinterpret_cast<char*>(this))/Alignment;
   if(distance >= (m_header.m_size/Alignment)){
      //"next_block" does not exist so we can't expand "block"
      return 0;
   }

   if(!next_block->m_next)
      return 0;

   return next_block;
}

template<class MutexFamily, class VoidPointer>
inline
   std::pair<typename simple_seq_fit_impl<MutexFamily, VoidPointer>::block_ctrl *
            ,typename simple_seq_fit_impl<MutexFamily, VoidPointer>::block_ctrl *>
   simple_seq_fit_impl<MutexFamily, VoidPointer>::
      priv_prev_block_if_free
         (typename simple_seq_fit_impl<MutexFamily, VoidPointer>::block_ctrl *ptr)
{
   typedef std::pair<block_ctrl *, block_ctrl *> prev_pair_t;
   //Take the address where the previous block should go
   block_ctrl *root           = &m_header.m_root;
   block_ctrl *prev_2_block   = root;
   block_ctrl *prev_block = ipcdetail::to_raw_pointer(root->m_next);
   while((reinterpret_cast<char*>(prev_block) + prev_block->m_size*Alignment)
            != (reinterpret_cast<char*>(ptr))
         && prev_block != root){
      prev_2_block = prev_block;
      prev_block = ipcdetail::to_raw_pointer(prev_block->m_next);
   }

   if(prev_block == root || !prev_block->m_next)
      return prev_pair_t(0, 0);

   //Check if the previous block is in the managed segment
   size_type distance = (reinterpret_cast<char*>(prev_block) - reinterpret_cast<char*>(this))/Alignment;
   if(distance >= (m_header.m_size/Alignment)){
      //"previous_block" does not exist so we can't expand "block"
      return prev_pair_t(0, 0);
   }
   return prev_pair_t(prev_2_block, prev_block);
}


template<class MutexFamily, class VoidPointer>
inline bool simple_seq_fit_impl<MutexFamily, VoidPointer>::
   priv_expand (void *ptr
               ,size_type min_size
               ,size_type preferred_size
               ,size_type &received_size)
{
   //Obtain the real size of the block
   block_ctrl *block = reinterpret_cast<block_ctrl*>
                        (reinterpret_cast<char*>(ptr) - BlockCtrlBytes);
   size_type old_block_size = block->m_size;

   //All used blocks' next is marked with 0 so check it
   BOOST_ASSERT(block->m_next == 0);

   //Put this to a safe value
   received_size = old_block_size*Alignment - BlockCtrlBytes;

   //Now translate it to Alignment units
   min_size       = ipcdetail::get_rounded_size(min_size, Alignment)/Alignment;
   preferred_size = ipcdetail::get_rounded_size(preferred_size, Alignment)/Alignment;

   //Some parameter checks
   if(min_size > preferred_size)
      return false;

   size_type data_size = old_block_size - BlockCtrlSize;

   if(data_size >= min_size)
      return true;

   block_ctrl *next_block = priv_next_block_if_free(block);
   if(!next_block){
      return false;
   }

   //Is "block" + "next_block" big enough?
   size_type merged_size = old_block_size + next_block->m_size;

   //Now we can expand this block further than before
   received_size = merged_size*Alignment - BlockCtrlBytes;

   if(merged_size < (min_size + BlockCtrlSize)){
      return false;
   }

   //We can fill expand. Merge both blocks,
   block->m_next = next_block->m_next;
   block->m_size = merged_size;

   //Find the previous free block of next_block
   block_ctrl *prev = &m_header.m_root;
   while(ipcdetail::to_raw_pointer(prev->m_next) != next_block){
      prev = ipcdetail::to_raw_pointer(prev->m_next);
   }

   //Now insert merged block in the free list
   //This allows reusing allocation logic in this function
   m_header.m_allocated -= old_block_size*Alignment;
   prev->m_next = block;

   //Now use check and allocate to do the allocation logic
   preferred_size += BlockCtrlSize;
   size_type nunits = preferred_size < merged_size ? preferred_size : merged_size;

   //This must success since nunits is less than merged_size!
   if(!this->priv_check_and_allocate (nunits, prev, block, received_size)){
      //Something very ugly is happening here. This is a bug
      //or there is memory corruption
      BOOST_ASSERT(0);
      return false;
   }
   return true;
}

template<class MutexFamily, class VoidPointer>
inline bool simple_seq_fit_impl<MutexFamily, VoidPointer>::
   priv_shrink (void *ptr
               ,size_type max_size
               ,size_type preferred_size
               ,size_type &received_size)
{
   //Obtain the real size of the block
   block_ctrl *block = reinterpret_cast<block_ctrl*>
                        (reinterpret_cast<char*>(ptr) - BlockCtrlBytes);
   size_type block_size = block->m_size;

   //All used blocks' next is marked with 0 so check it
   BOOST_ASSERT(block->m_next == 0);

   //Put this to a safe value
   received_size = block_size*Alignment - BlockCtrlBytes;

   //Now translate it to Alignment units
   max_size       = max_size/Alignment;
   preferred_size = ipcdetail::get_rounded_size(preferred_size, Alignment)/Alignment;

   //Some parameter checks
   if(max_size < preferred_size)
      return false;

   size_type data_size = block_size - BlockCtrlSize;

   if(data_size < preferred_size)
      return false;

   if(data_size == preferred_size)
      return true;

   //We must be able to create at least a new empty block
   if((data_size - preferred_size) < BlockCtrlSize){
      return false;
   }

   //Now we can just rewrite the size of the old buffer
   block->m_size = preferred_size + BlockCtrlSize;

   //Update new size
   received_size = preferred_size*Alignment;

   //We create the new block
   block = reinterpret_cast<block_ctrl*>
               (reinterpret_cast<char*>(block) + block->m_size*Alignment);

   //Write control data to simulate this new block was previously allocated
   block->m_next = 0;
   block->m_size = data_size - preferred_size;

   //Now deallocate the new block to insert it in the free list
   this->priv_deallocate(reinterpret_cast<char*>(block)+BlockCtrlBytes);
   return true;
}

template<class MutexFamily, class VoidPointer>
inline void* simple_seq_fit_impl<MutexFamily, VoidPointer>::
   priv_allocate_aligned(size_type nbytes, size_type alignment)
{
   //Ensure power of 2
   if ((alignment & (alignment - size_type(1u))) != 0){
      //Alignment is not power of two
      BOOST_ASSERT((alignment & (alignment - size_type(1u))) != 0);
      return 0;
   }

   size_type ignore;
   if(alignment <= Alignment){
      return priv_allocate(boost::interprocess::allocate_new, nbytes, nbytes, ignore).first;
   }

   size_type request =
      nbytes + alignment + MinBlockSize*Alignment - BlockCtrlBytes;
   void *buffer = priv_allocate(boost::interprocess::allocate_new, request, request, ignore).first;
   if(!buffer)
      return 0;
   else if ((((std::size_t)(buffer)) % alignment) == 0)
      return buffer;

   char *aligned_portion = reinterpret_cast<char*>
      (reinterpret_cast<size_type>(static_cast<char*>(buffer) + alignment - 1) & -alignment);

   char *pos = ((aligned_portion - reinterpret_cast<char*>(buffer)) >= (MinBlockSize*Alignment)) ?
      aligned_portion : (aligned_portion + alignment);

   block_ctrl *first = reinterpret_cast<block_ctrl*>
                           (reinterpret_cast<char*>(buffer) - BlockCtrlBytes);

   block_ctrl *second = reinterpret_cast<block_ctrl*>(pos - BlockCtrlBytes);

   size_type old_size = first->m_size;

   first->m_size  = (reinterpret_cast<char*>(second) - reinterpret_cast<char*>(first))/Alignment;
   second->m_size = old_size - first->m_size;

   //Write control data to simulate this new block was previously allocated
   second->m_next = 0;

   //Now deallocate the new block to insert it in the free list
   this->priv_deallocate(reinterpret_cast<char*>(first) + BlockCtrlBytes);
   return reinterpret_cast<char*>(second) + BlockCtrlBytes;
}

template<class MutexFamily, class VoidPointer> inline
void* simple_seq_fit_impl<MutexFamily, VoidPointer>::priv_check_and_allocate
   (size_type nunits
   ,typename simple_seq_fit_impl<MutexFamily, VoidPointer>::block_ctrl* prev
   ,typename simple_seq_fit_impl<MutexFamily, VoidPointer>::block_ctrl* block
   ,size_type &received_size)
{
   size_type upper_nunits = nunits + BlockCtrlSize;
   bool found = false;

   if (block->m_size > upper_nunits){
      //This block is bigger than needed, split it in
      //two blocks, the first's size will be (block->m_size-units)
      //the second's size (units)
      size_type total_size = block->m_size;
      block->m_size  = nunits;
      block_ctrl *new_block = reinterpret_cast<block_ctrl*>
                     (reinterpret_cast<char*>(block) + Alignment*nunits);
      new_block->m_size  = total_size - nunits;
      new_block->m_next  = block->m_next;
      prev->m_next = new_block;
      found = true;
   }
   else if (block->m_size >= nunits){
      //This block has exactly the right size with an extra
      //unusable extra bytes.
      prev->m_next = block->m_next;
      found = true;
   }

   if(found){
      //We need block_ctrl for deallocation stuff, so
      //return memory user can overwrite
      m_header.m_allocated += block->m_size*Alignment;
      received_size =  block->m_size*Alignment - BlockCtrlBytes;
      //Mark the block as allocated
      block->m_next = 0;
      //Check alignment
      BOOST_ASSERT(((reinterpret_cast<char*>(block) - reinterpret_cast<char*>(this))
               % Alignment) == 0 );
      return reinterpret_cast<char*>(block) + BlockCtrlBytes;
   }
   return 0;
}

template<class MutexFamily, class VoidPointer>
void simple_seq_fit_impl<MutexFamily, VoidPointer>::deallocate(void* addr)
{
   if(!addr)   return;
   //-----------------------
   boost::interprocess::scoped_lock<interprocess_mutex> guard(m_header);
   //-----------------------
   return this->priv_deallocate(addr);
}

template<class MutexFamily, class VoidPointer>
void simple_seq_fit_impl<MutexFamily, VoidPointer>::priv_deallocate(void* addr)
{
   if(!addr)   return;

   //Let's get free block list. List is always sorted
   //by memory address to allow block merging.
   //Pointer next always points to the first
   //(lower address) block
   block_ctrl_ptr prev  = &m_header.m_root;
   block_ctrl_ptr pos   = m_header.m_root.m_next;
   block_ctrl_ptr block = reinterpret_cast<block_ctrl*>
                           (reinterpret_cast<char*>(addr) - BlockCtrlBytes);

   //All used blocks' next is marked with 0 so check it
   BOOST_ASSERT(block->m_next == 0);

   //Check if alignment and block size are right
   BOOST_ASSERT((reinterpret_cast<char*>(addr) - reinterpret_cast<char*>(this))
            % Alignment == 0 );

   size_type total_size = Alignment*block->m_size;
   BOOST_ASSERT(m_header.m_allocated >= total_size);

   //Update used memory count
   m_header.m_allocated -= total_size;

   //Let's find the previous and the next block of the block to deallocate
   //This ordering comparison must be done with original pointers
   //types since their mapping to raw pointers can be different
   //in each process
   while((ipcdetail::to_raw_pointer(pos) != &m_header.m_root) && (block > pos)){
      prev = pos;
      pos = pos->m_next;
   }

   //Try to combine with upper block
   if ((reinterpret_cast<char*>(ipcdetail::to_raw_pointer(block))
            + Alignment*block->m_size) ==
        reinterpret_cast<char*>(ipcdetail::to_raw_pointer(pos))){

      block->m_size += pos->m_size;
      block->m_next  = pos->m_next;
   }
   else{
      block->m_next = pos;
   }

   //Try to combine with lower block
   if ((reinterpret_cast<char*>(ipcdetail::to_raw_pointer(prev))
            + Alignment*prev->m_size) ==
        reinterpret_cast<char*>(ipcdetail::to_raw_pointer(block))){
      prev->m_size += block->m_size;
      prev->m_next  = block->m_next;
   }
   else{
      prev->m_next = block;
   }
}

}  //namespace ipcdetail {

}  //namespace interprocess {

}  //namespace boost {

#include <boost/interprocess/detail/config_end.hpp>

#endif   //#ifndef BOOST_INTERPROCESS_MEM_ALGO_DETAIL_SIMPLE_SEQ_FIT_IMPL_HPP

