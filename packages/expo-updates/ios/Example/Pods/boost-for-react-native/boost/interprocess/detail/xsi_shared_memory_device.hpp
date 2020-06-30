//////////////////////////////////////////////////////////////////////////////
//
// (C) Copyright Ion Gaztanaga 2009-2012. Distributed under the Boost
// Software License, Version 1.0. (See accompanying file
// LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//
// See http://www.boost.org/libs/interprocess for documentation.
//
//////////////////////////////////////////////////////////////////////////////

#ifndef BOOST_INTERPROCESS_XSI_SHARED_MEMORY_DEVICE_HPP
#define BOOST_INTERPROCESS_XSI_SHARED_MEMORY_DEVICE_HPP

#if defined(_MSC_VER)
#  pragma once
#endif

#include <boost/interprocess/detail/config_begin.hpp>
#include <boost/interprocess/detail/workaround.hpp>
#include <boost/detail/workaround.hpp>

#if defined(BOOST_INTERPROCESS_WINDOWS)
#error "This header can't be used in Windows operating systems"
#endif

#include <boost/interprocess/creation_tags.hpp>
#include <boost/interprocess/exceptions.hpp>
#include <boost/interprocess/detail/utilities.hpp>
#include <boost/interprocess/detail/os_file_functions.hpp>
#include <boost/interprocess/detail/shared_dir_helpers.hpp>
#include <boost/interprocess/interprocess_fwd.hpp>
#include <boost/interprocess/exceptions.hpp>

#include <boost/interprocess/xsi_shared_memory.hpp>
#include <boost/interprocess/sync/xsi/xsi_named_mutex.hpp>
#include <boost/interprocess/mapped_region.hpp>
#include <boost/interprocess/sync/scoped_lock.hpp>
#include <cstddef>
#include <boost/cstdint.hpp>
#include <string>
#include <cstring>

//!\file
//!Describes a class representing a native xsi shared memory.

namespace boost {
namespace interprocess {

class xsi_shared_memory_device
{
   #if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)
   BOOST_MOVABLE_BUT_NOT_COPYABLE(xsi_shared_memory_file_wrapper)
   #endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED

   public:

   xsi_shared_memory_device();

   xsi_shared_memory_device(create_only_t, const char *name, mode_t mode, std::size_t size)
   {  this->priv_open_or_create_name_only(ipcdetail::DoCreate, name, mode, size);  }

   xsi_shared_memory_device(open_or_create_t, const char *name, mode_t mode, std::size_t size)
   {  this->priv_open_or_create_name_only(ipcdetail::DoOpenOrCreate, name, mode, size);  }

   xsi_shared_memory_device(open_only_t, const char *name, mode_t mode)
   {  this->priv_open_or_create_name_only(ipcdetail::DoOpen, name, mode, 0);  }

   xsi_shared_memory_device(create_only_t, const char *filepath, boost::uint8_t id, mode_t mode, std::size_t size)
   {  this->priv_open_or_create_name_id(ipcdetail::DoCreate, name, id, mode, size);  }

   xsi_shared_memory_device(open_or_create_t, const char *filepath, boost::uint8_t id, mode_t mode, std::size_t size)
   {  this->priv_open_or_create_name_id(ipcdetail::DoOpenOrCreate, id, name, mode, size);  }

   xsi_shared_memory_device(open_only_t, const char *filepath, boost::uint8_t id, mode_t mode)
   {  this->priv_open_or_create_name_id(ipcdetail::DoOpen, name, id, mode, 0);  }

   xsi_shared_memory_device(BOOST_RV_REF(xsi_shared_memory_device) moved)
   {  this->swap(moved);   }

   xsi_shared_memory_device &operator=(BOOST_RV_REF(xsi_shared_memory_device) moved)
   {
      xsi_shared_memory_device tmp(boost::move(moved));
      this->swap(tmp);
      return *this;
   }

   //!Swaps two xsi_shared_memory_device. Does not throw
   void swap(xsi_shared_memory_device &other);

   //!Destroys *this. The shared memory won't be destroyed, just
   //!this connection to it. Use remove() to destroy the shared memory.
   ~xsi_shared_memory_device();

   //!Returns the name of the
   //!shared memory.
   const char *get_name() const;

   //!Returns the shared memory ID that
   //!identifies the shared memory
   int get_shmid() const;

   //!Returns access
   //!permissions
   mode_t get_mode() const;

   //!Returns the mapping handle.
   //!Never throws
   mapping_handle_t get_mapping_handle() const;

   //!Erases a XSI shared memory object identified by shmname
   //!from the system.
   //!Returns false on error. Never throws
   static bool remove(const char *shmname);

   //!Erases the XSI shared memory object identified by shmid
   //!from the system.
   //!Returns false on error. Never throws
   static bool remove(int shmid);

   #if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)
   private:
   template<int Dummy>
   struct info_constants_t
   {
      static const std::size_t MaxName = 32;
      static const std::size_t FirstID = 2;
      static const std::size_t LastID  = 256;
      static const std::size_t NumID   = LastID - FirstID;
   };

   struct info_t
   {
      struct names_t
      {
         char buf[info_constants_t<0>::MaxName];
      } names[info_constants_t<0>::NumID];
   };

   static void priv_obtain_index(mapped_region &m, xsi_named_mutex &m, std::string &path);
   static bool priv_remove_dead_memory(info_t *info, const char *path);

   bool priv_open_or_create_name_only( ipcdetail::create_enum_t type
                           , const char *shmname
                           , mode_t mode
                           , std::size_t size);
   bool priv_open_or_create_name_id( ipcdetail::create_enum_t type
                           , const char *shmname
                           , boost::uint8_t id
                           , mode_t mode
                           , std::size_t size);
   xsi_shared_memory m_shm;
   mode_t            m_mode;
   std::string       m_name;
   #endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED
};

template<int Dummy>
const std::size_t xsi_shared_memory_device::info_constants_t<Dummy>::MaxName;

template<int Dummy>
const std::size_t xsi_shared_memory_device::info_constants_t<Dummy>::FirstID;

template<int Dummy>
const std::size_t xsi_shared_memory_device::info_constants_t<Dummy>::LastID;

template<int Dummy>
const std::size_t xsi_shared_memory_device::info_constants_t<Dummy>::NumID;

#if !defined(BOOST_INTERPROCESS_DOXYGEN_INVOKED)

inline xsi_shared_memory_device::xsi_shared_memory_device()
   : m_shm(), m_mode(invalid_mode), m_name()
{}

inline xsi_shared_memory_device::~xsi_shared_memory_device()
{}

inline const char *xsi_shared_memory_device::get_name() const
{  return m_name.c_str(); }

inline void xsi_shared_memory_device::swap(xsi_shared_memory_device &other)
{
   m_shm.swap(other.m_shm);
   std::swap(m_mode,  other.m_mode);
   m_name.swap(other.m_name);
}

inline mapping_handle_t xsi_shared_memory_device::get_mapping_handle() const
{  return m_shm.get_mapping_handle();   }

inline mode_t xsi_shared_memory_device::get_mode() const
{  return m_mode; }

inline int xsi_shared_memory::get_shmid() const
{  return m_shm.get_shmid(); }

inline void xsi_shared_memory_device::priv_obtain_index
   (mapped_region &reg, xsi_named_mutex &mut, std::string &path)
{
   const char *const filename = "xsi_shm_emulation_file";
   permissions p;
   p.set_unrestricted();
   std::string xsi_shm_emulation_file_path;
   ipcdetail::create_shared_dir_cleaning_old_and_get_filepath(filename, xsi_shm_emulation_file_path);
   ipcdetail::create_or_open_file(xsi_shm_emulation_file_path.c_str(), read_write, p);
   const std::size_t MemSize = sizeof(info_t);

   xsi_shared_memory index_shm(open_or_create, xsi_shm_emulation_file_path.c_str(), 1, MemSize, 0666);
   mapped_region r(index_shm, read_write, 0, MemSize, 0);
   xsi_named_mutex m(open_or_create, xsi_shm_emulation_file_path.c_str(), 2, 0666);
   reg = boost::move(r);
   mut = boost::move(m);
   path.swap(xsi_shm_emulation_file_path);
}

inline bool xsi_shared_memory_device::priv_remove_dead_memory
   (xsi_shared_memory_device::info_t *info, const char *path)
{
   bool removed = false;
   for(std::size_t i = 0; i != info_constants_t<0>::NumID; ++i){
      if(info->names[i].buf[0]){
         try{
            xsi_shared_memory temp( open_only, path, i+info_constants_t<0>::FirstID, 0600);
         }
         catch(interprocess_exception &e){
               if(e.get_error_code() == not_found_error){
                  std::memset(info->names[i].buf, 0, info_constants_t<0>::MaxName);
                  removed = true;
               }
         }
      }
   }
   return removed;
}

inline bool xsi_shared_memory_device::priv_open_or_create_name_id
   (ipcdetail::create_enum_t type, const char *filepath, mode_t mode, std::size_t size)
{
   //Set accesses
   if (mode != read_write && mode != read_only){
      error_info err = other_error;
      throw interprocess_exception(err);
   }

   int perm = (mode == read_only) ? (0444) : (0666);

   if(type == ipcdetail::DoOpen){
      if(!found){
         error_info err = not_found_error;
         throw interprocess_exception(err);
      }
      xsi_shared_memory temp(open_only, filepath, id, perm);
      m_shm = boost::move(temp);
   }
   else if(type == ipcdetail::DoCreate){
      //Try to reuse slot
      xsi_shared_memory temp(create_only, filepath, id, size, perm);
      std::strcpy(info->names[target_entry].buf, shmname);
      m_shm = boost::move(temp);
   }
   else{ // if(type == ipcdetail::DoOpenOrCreate){
      xsi_shared_memory temp(open_or_create, filepath, id, size, perm);
      m_shm = boost::move(temp);
   }

   m_mode = mode;
   m_name.clear();
   return true;
}

inline bool xsi_shared_memory_device::priv_open_or_create_name_only
   (ipcdetail::create_enum_t type, const char *shmname, mode_t mode, std::size_t size)
{
   //Set accesses
   if (mode != read_write && mode != read_only){
      error_info err = other_error;
      throw interprocess_exception(err);
   }

   if (std::strlen(shmname) >= (info_constants_t<0>::MaxName)){
      error_info err = other_error;
      throw interprocess_exception(err);
   }

   {
      //Obtain index and index lock
      mapped_region region;
      xsi_named_mutex mut;
      std::string xsi_shm_emulation_file_path;
      priv_obtain_index(region, mut, xsi_shm_emulation_file_path);
      info_t *info = static_cast<info_t *>(region.get_address());
      scoped_lock<xsi_named_mutex> lock(mut);

      //Find the correct entry or the first empty index
      bool found = false;
      int target_entry = -1;
      int tries = 2;
      while(tries--){
         for(std::size_t i = 0; i != info_constants_t<0>::NumID; ++i){
            if(target_entry < 0 && !info->names[i].buf[0]){
               target_entry = static_cast<int>(i);
            }
            else if(0 == std::strcmp(info->names[i].buf, shmname)){
               found = true;
               target_entry = static_cast<int>(i);
               break;
            }
         }
         if(target_entry < 0){
            if(!tries || !priv_remove_dead_memory(info, xsi_shm_emulation_file_path.c_str())){
               error_info err = out_of_resource_error;
               throw interprocess_exception(err);
            }
         }
      }
      //Now handle the result
      int perm = (mode == read_only) ? (0444) : (0666);
      if(type == ipcdetail::DoOpen){
         if(!found){
            error_info err = not_found_error;
            throw interprocess_exception(err);
         }
         xsi_shared_memory temp( open_only, xsi_shm_emulation_file_path.c_str()
                               , target_entry+info_constants_t<0>::FirstID, perm);
         m_shm = boost::move(temp);
      }
      else{

         if(type == ipcdetail::DoCreate){
            //Try to reuse slot
            xsi_shared_memory temp( create_only, xsi_shm_emulation_file_path.c_str()
                                  , target_entry+info_constants_t<0>::FirstID, size, perm);
            std::strcpy(info->names[target_entry].buf, shmname);
            m_shm = boost::move(temp);
         }
         else{ // if(type == ipcdetail::DoOpenOrCreate){
            xsi_shared_memory temp( open_or_create, xsi_shm_emulation_file_path.c_str()
                                  , target_entry+info_constants_t<0>::FirstID, size, perm);
            if(!found){
               std::memset(info->names[target_entry].buf, 0, info_constants_t<0>::MaxName);
               std::strcpy(info->names[target_entry].buf, shmname);
            }
            m_shm = boost::move(temp);
         }
      }
   }

   m_mode = mode;
   m_name = shmname;
   return true;
}

inline bool xsi_shared_memory_device::remove(const char *shmname)
{
   try{
      //Obtain index and index lockss
      mapped_region region;
      xsi_named_mutex mut;
      std::string xsi_shm_emulation_file_path;
      priv_obtain_index(region, mut, xsi_shm_emulation_file_path);
      scoped_lock<xsi_named_mutex> lock(mut);
      info_t *info = static_cast<info_t *>(region.get_address());

      //Now check and remove
      bool removed = false;

      for(std::size_t i = 0; i != info_constants_t<0>::NumID; ++i){
         if(0 == std::strcmp(info->names[i].buf, name)){
            xsi_shared_memory temp( open_only, xsi_shm_emulation_file_path.c_str()
                                  , i+info_constants_t<0>::FirstID);
            if(!xsi_shared_memory::remove(temp.get_shmid()) && (system_error_code() != invalid_argument)){
               return false;
            }
            std::memset(info->names[i].buf, 0, info_constants_t<0>::MaxName);
            removed = true;
            break;
         }
      }
      return removed;
   }
   catch(...){
      return false;
   }
}

inline bool xsi_shared_memory_device::remove(int shmid)
{  return xsi_shared_memory::remove(shmid);  }

#endif   //#ifndef BOOST_INTERPROCESS_DOXYGEN_INVOKED

}  //namespace interprocess {
}  //namespace boost {

#include <boost/interprocess/detail/config_end.hpp>

#endif   //BOOST_INTERPROCESS_XSI_SHARED_MEMORY_DEVICE_HPP
