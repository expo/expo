/* pb_encode.c -- encode a protobuf using minimal resources
 *
 * 2011 Petteri Aimonen <jpa@kapsi.fi>
 */

#include "pb.h"
#include "pb_encode.h"
#include "pb_common.h"

/* Use the GCC warn_unused_result attribute to check that all return values
 * are propagated correctly. On other compilers and gcc before 3.4.0 just
 * ignore the annotation.
 */
#if !defined(__GNUC__) || ( __GNUC__ < 3) || (__GNUC__ == 3 && __GNUC_MINOR__ < 4)
    #define checkreturn
#else
    #define checkreturn __attribute__((warn_unused_result))
#endif

/**************************************
 * Declarations internal to this file *
 **************************************/
typedef bool (*pb_encoder_t)(pb_ostream_t *stream, const pb_field_t *field, const void *src) checkreturn;

static bool checkreturn buf_write(pb_ostream_t *stream, const pb_byte_t *buf, size_t count);
static bool checkreturn encode_array(pb_ostream_t *stream, const pb_field_t *field, const void *pData, size_t count, pb_encoder_t func);
static bool checkreturn encode_field(pb_ostream_t *stream, const pb_field_t *field, const void *pData);
static bool checkreturn default_extension_encoder(pb_ostream_t *stream, const pb_extension_t *extension);
static bool checkreturn encode_extension_field(pb_ostream_t *stream, const pb_field_t *field, const void *pData);
static void *pb_const_cast(const void *p);
static bool checkreturn pb_enc_varint(pb_ostream_t *stream, const pb_field_t *field, const void *src);
static bool checkreturn pb_enc_uvarint(pb_ostream_t *stream, const pb_field_t *field, const void *src);
static bool checkreturn pb_enc_svarint(pb_ostream_t *stream, const pb_field_t *field, const void *src);
static bool checkreturn pb_enc_fixed32(pb_ostream_t *stream, const pb_field_t *field, const void *src);
static bool checkreturn pb_enc_fixed64(pb_ostream_t *stream, const pb_field_t *field, const void *src);
static bool checkreturn pb_enc_bytes(pb_ostream_t *stream, const pb_field_t *field, const void *src);
static bool checkreturn pb_enc_string(pb_ostream_t *stream, const pb_field_t *field, const void *src);
static bool checkreturn pb_enc_submessage(pb_ostream_t *stream, const pb_field_t *field, const void *src);
static bool checkreturn pb_enc_fixed_length_bytes(pb_ostream_t *stream, const pb_field_t *field, const void *src);

#ifdef PB_WITHOUT_64BIT
#define pb_int64_t int32_t
#define pb_uint64_t uint32_t

static bool checkreturn pb_encode_negative_varint(pb_ostream_t *stream, pb_uint64_t value);
#else
#define pb_int64_t int64_t
#define pb_uint64_t uint64_t
#endif

/* --- Function pointers to field encoders ---
 * Order in the array must match pb_action_t LTYPE numbering.
 */
static const pb_encoder_t PB_ENCODERS[PB_LTYPES_COUNT] = {
    &pb_enc_varint,
    &pb_enc_uvarint,
    &pb_enc_svarint,
    &pb_enc_fixed32,
    &pb_enc_fixed64,
    
    &pb_enc_bytes,
    &pb_enc_string,
    &pb_enc_submessage,
    NULL, /* extensions */
    &pb_enc_fixed_length_bytes
};

/*******************************
 * pb_ostream_t implementation *
 *******************************/

static bool checkreturn buf_write(pb_ostream_t *stream, const pb_byte_t *buf, size_t count)
{
    size_t i;
    pb_byte_t *dest = (pb_byte_t*)stream->state;
    stream->state = dest + count;
    
    for (i = 0; i < count; i++)
        dest[i] = buf[i];
    
    return true;
}

pb_ostream_t pb_ostream_from_buffer(pb_byte_t *buf, size_t bufsize)
{
    pb_ostream_t stream;
#ifdef PB_BUFFER_ONLY
    stream.callback = (void*)1; /* Just a marker value */
#else
    stream.callback = &buf_write;
#endif
    stream.state = buf;
    stream.max_size = bufsize;
    stream.bytes_written = 0;
#ifndef PB_NO_ERRMSG
    stream.errmsg = NULL;
#endif
    return stream;
}

bool checkreturn pb_write(pb_ostream_t *stream, const pb_byte_t *buf, size_t count)
{
    if (stream->callback != NULL)
    {
        if (stream->bytes_written + count > stream->max_size)
            PB_RETURN_ERROR(stream, "stream full");

#ifdef PB_BUFFER_ONLY
        if (!buf_write(stream, buf, count))
            PB_RETURN_ERROR(stream, "io error");
#else        
        if (!stream->callback(stream, buf, count))
            PB_RETURN_ERROR(stream, "io error");
#endif
    }
    
    stream->bytes_written += count;
    return true;
}

/*************************
 * Encode a single field *
 *************************/

/* Encode a static array. Handles the size calculations and possible packing. */
static bool checkreturn encode_array(pb_ostream_t *stream, const pb_field_t *field,
                         const void *pData, size_t count, pb_encoder_t func)
{
    size_t i;
    const void *p;
    size_t size;
    
    if (count == 0)
        return true;

    if (PB_ATYPE(field->type) != PB_ATYPE_POINTER && count > field->array_size)
        PB_RETURN_ERROR(stream, "array max size exceeded");
    
    /* We always pack arrays if the datatype allows it. */
    if (PB_LTYPE(field->type) <= PB_LTYPE_LAST_PACKABLE)
    {
        if (!pb_encode_tag(stream, PB_WT_STRING, field->tag))
            return false;
        
        /* Determine the total size of packed array. */
        if (PB_LTYPE(field->type) == PB_LTYPE_FIXED32)
        {
            size = 4 * count;
        }
        else if (PB_LTYPE(field->type) == PB_LTYPE_FIXED64)
        {
            size = 8 * count;
        }
        else
        { 
            pb_ostream_t sizestream = PB_OSTREAM_SIZING;
            p = pData;
            for (i = 0; i < count; i++)
            {
                if (!func(&sizestream, field, p))
                    return false;
                p = (const char*)p + field->data_size;
            }
            size = sizestream.bytes_written;
        }
        
        if (!pb_encode_varint(stream, (pb_uint64_t)size))
            return false;
        
        if (stream->callback == NULL)
            return pb_write(stream, NULL, size); /* Just sizing.. */
        
        /* Write the data */
        p = pData;
        for (i = 0; i < count; i++)
        {
            if (!func(stream, field, p))
                return false;
            p = (const char*)p + field->data_size;
        }
    }
    else
    {
        p = pData;
        for (i = 0; i < count; i++)
        {
            if (!pb_encode_tag_for_field(stream, field))
                return false;

            /* Normally the data is stored directly in the array entries, but
             * for pointer-type string and bytes fields, the array entries are
             * actually pointers themselves also. So we have to dereference once
             * more to get to the actual data. */
            if (PB_ATYPE(field->type) == PB_ATYPE_POINTER &&
                (PB_LTYPE(field->type) == PB_LTYPE_STRING ||
                 PB_LTYPE(field->type) == PB_LTYPE_BYTES))
            {
                if (!func(stream, field, *(const void* const*)p))
                    return false;
            }
            else
            {
                if (!func(stream, field, p))
                    return false;
            }
            p = (const char*)p + field->data_size;
        }
    }
    
    return true;
}

/* In proto3, all fields are optional and are only encoded if their value is "non-zero".
 * This function implements the check for the zero value. */
static bool pb_check_proto3_default_value(const pb_field_t *field, const void *pData)
{
    pb_type_t type = field->type;
    const void *pSize = (const char*)pData + field->size_offset;

    if (PB_HTYPE(type) == PB_HTYPE_REQUIRED)
    {
        /* Required proto2 fields inside proto3 submessage, pretty rare case */
        return false;
    }
    else if (PB_HTYPE(type) == PB_HTYPE_REPEATED)
    {
        /* Repeated fields inside proto3 submessage: present if count != 0 */
        return *(const pb_size_t*)pSize == 0;
    }
    else if (PB_HTYPE(type) == PB_HTYPE_ONEOF)
    {
        /* Oneof fields */
        return *(const pb_size_t*)pSize == 0;
    }
    else if (PB_HTYPE(type) == PB_HTYPE_OPTIONAL && field->size_offset)
    {
        /* Proto2 optional fields inside proto3 submessage */
        return *(const bool*)pSize == false;
    }

    /* Rest is proto3 singular fields */

    if (PB_ATYPE(type) == PB_ATYPE_STATIC)
    {
        if (PB_LTYPE(type) == PB_LTYPE_BYTES)
        {
            const pb_bytes_array_t *bytes = (const pb_bytes_array_t*)pData;
            return bytes->size == 0;
        }
        else if (PB_LTYPE(type) == PB_LTYPE_STRING)
        {
            return *(const char*)pData == '\0';
        }
        else if (PB_LTYPE(type) == PB_LTYPE_FIXED_LENGTH_BYTES)
        {
            /* Fixed length bytes is only empty if its length is fixed
             * as 0. Which would be pretty strange, but we can check
             * it anyway. */
            return field->data_size == 0;
        }
        else if (PB_LTYPE(type) == PB_LTYPE_SUBMESSAGE)
        {
            /* Check all fields in the submessage to find if any of them
             * are non-zero. The comparison cannot be done byte-per-byte
             * because the C struct may contain padding bytes that must
             * be skipped.
             */
            pb_field_iter_t iter;
            if (pb_field_iter_begin(&iter, (const pb_field_t*)field->ptr, pb_const_cast(pData)))
            {
                do
                {
                    if (!pb_check_proto3_default_value(iter.pos, iter.pData))
                    {
                        return false;
                    }
                } while (pb_field_iter_next(&iter));
            }
            return true;
        }
    }
    
	{
	    /* Catch-all branch that does byte-per-byte comparison for zero value.
	     *
	     * This is for all pointer fields, and for static PB_LTYPE_VARINT,
	     * UVARINT, SVARINT, FIXED32, FIXED64, EXTENSION fields, and also
	     * callback fields. These all have integer or pointer value which
	     * can be compared with 0.
	     */
	    pb_size_t i;
	    const char *p = (const char*)pData;
	    for (i = 0; i < field->data_size; i++)
	    {
	        if (p[i] != 0)
	        {
	            return false;
	        }
	    }

	    return true;
	}
}

/* Encode a field with static or pointer allocation, i.e. one whose data
 * is available to the encoder directly. */
static bool checkreturn encode_basic_field(pb_ostream_t *stream,
    const pb_field_t *field, const void *pData)
{
    pb_encoder_t func;
    bool implicit_has;
    const void *pSize = &implicit_has;
    
    func = PB_ENCODERS[PB_LTYPE(field->type)];
    
    if (field->size_offset)
    {
        /* Static optional, repeated or oneof field */
        pSize = (const char*)pData + field->size_offset;
    }
    else if (PB_HTYPE(field->type) == PB_HTYPE_OPTIONAL)
    {
        /* Proto3 style field, optional but without explicit has_ field. */
        implicit_has = !pb_check_proto3_default_value(field, pData);
    }
    else
    {
        /* Required field, always present */
        implicit_has = true;
    }

    if (PB_ATYPE(field->type) == PB_ATYPE_POINTER)
    {
        /* pData is a pointer to the field, which contains pointer to
         * the data. If the 2nd pointer is NULL, it is interpreted as if
         * the has_field was false.
         */
        pData = *(const void* const*)pData;
        implicit_has = (pData != NULL);
    }

    switch (PB_HTYPE(field->type))
    {
        case PB_HTYPE_REQUIRED:
            if (!pData)
                PB_RETURN_ERROR(stream, "missing required field");
            if (!pb_encode_tag_for_field(stream, field))
                return false;
            if (!func(stream, field, pData))
                return false;
            break;
        
        case PB_HTYPE_OPTIONAL:
            if (*(const bool*)pSize)
            {
                if (!pb_encode_tag_for_field(stream, field))
                    return false;
            
                if (!func(stream, field, pData))
                    return false;
            }
            break;
        
        case PB_HTYPE_REPEATED: {
            pb_size_t count;
            if (field->size_offset != 0) {
                count = *(const pb_size_t*)pSize;
            } else {
                count = field->array_size;
            }
            if (!encode_array(stream, field, pData, count, func))
                return false;
            break;
        }
        
        case PB_HTYPE_ONEOF:
            if (*(const pb_size_t*)pSize == field->tag)
            {
                if (!pb_encode_tag_for_field(stream, field))
                    return false;

                if (!func(stream, field, pData))
                    return false;
            }
            break;
            
        default:
            PB_RETURN_ERROR(stream, "invalid field type");
    }
    
    return true;
}

/* Encode a field with callback semantics. This means that a user function is
 * called to provide and encode the actual data. */
static bool checkreturn encode_callback_field(pb_ostream_t *stream,
    const pb_field_t *field, const void *pData)
{
    const pb_callback_t *callback = (const pb_callback_t*)pData;
    
#ifdef PB_OLD_CALLBACK_STYLE
    const void *arg = callback->arg;
#else
    void * const *arg = &(callback->arg);
#endif    
    
    if (callback->funcs.encode != NULL)
    {
        if (!callback->funcs.encode(stream, field, arg))
            PB_RETURN_ERROR(stream, "callback error");
    }
    return true;
}

/* Encode a single field of any callback or static type. */
static bool checkreturn encode_field(pb_ostream_t *stream,
    const pb_field_t *field, const void *pData)
{
    switch (PB_ATYPE(field->type))
    {
        case PB_ATYPE_STATIC:
        case PB_ATYPE_POINTER:
            return encode_basic_field(stream, field, pData);
        
        case PB_ATYPE_CALLBACK:
            return encode_callback_field(stream, field, pData);
        
        default:
            PB_RETURN_ERROR(stream, "invalid field type");
    }
}

/* Default handler for extension fields. Expects to have a pb_field_t
 * pointer in the extension->type->arg field. */
static bool checkreturn default_extension_encoder(pb_ostream_t *stream,
    const pb_extension_t *extension)
{
    const pb_field_t *field = (const pb_field_t*)extension->type->arg;
    
    if (PB_ATYPE(field->type) == PB_ATYPE_POINTER)
    {
        /* For pointer extensions, the pointer is stored directly
         * in the extension structure. This avoids having an extra
         * indirection. */
        return encode_field(stream, field, &extension->dest);
    }
    else
    {
        return encode_field(stream, field, extension->dest);
    }
}

/* Walk through all the registered extensions and give them a chance
 * to encode themselves. */
static bool checkreturn encode_extension_field(pb_ostream_t *stream,
    const pb_field_t *field, const void *pData)
{
    const pb_extension_t *extension = *(const pb_extension_t* const *)pData;
    PB_UNUSED(field);
    
    while (extension)
    {
        bool status;
        if (extension->type->encode)
            status = extension->type->encode(stream, extension);
        else
            status = default_extension_encoder(stream, extension);

        if (!status)
            return false;
        
        extension = extension->next;
    }
    
    return true;
}

/*********************
 * Encode all fields *
 *********************/

static void *pb_const_cast(const void *p)
{
    /* Note: this casts away const, in order to use the common field iterator
     * logic for both encoding and decoding. */
    union {
        void *p1;
        const void *p2;
    } t;
    t.p2 = p;
    return t.p1;
}

bool checkreturn pb_encode(pb_ostream_t *stream, const pb_field_t fields[], const void *src_struct)
{
    pb_field_iter_t iter;
    if (!pb_field_iter_begin(&iter, fields, pb_const_cast(src_struct)))
        return true; /* Empty message type */
    
    do {
        if (PB_LTYPE(iter.pos->type) == PB_LTYPE_EXTENSION)
        {
            /* Special case for the extension field placeholder */
            if (!encode_extension_field(stream, iter.pos, iter.pData))
                return false;
        }
        else
        {
            /* Regular field */
            if (!encode_field(stream, iter.pos, iter.pData))
                return false;
        }
    } while (pb_field_iter_next(&iter));
    
    return true;
}

bool pb_encode_delimited(pb_ostream_t *stream, const pb_field_t fields[], const void *src_struct)
{
    return pb_encode_submessage(stream, fields, src_struct);
}

bool pb_encode_nullterminated(pb_ostream_t *stream, const pb_field_t fields[], const void *src_struct)
{
    const pb_byte_t zero = 0;

    if (!pb_encode(stream, fields, src_struct))
        return false;

    return pb_write(stream, &zero, 1);
}

bool pb_get_encoded_size(size_t *size, const pb_field_t fields[], const void *src_struct)
{
    pb_ostream_t stream = PB_OSTREAM_SIZING;
    
    if (!pb_encode(&stream, fields, src_struct))
        return false;
    
    *size = stream.bytes_written;
    return true;
}

/********************
 * Helper functions *
 ********************/

#ifdef PB_WITHOUT_64BIT
bool checkreturn pb_encode_negative_varint(pb_ostream_t *stream, pb_uint64_t value)
{
  pb_byte_t buffer[10];
  size_t i = 0;
  size_t compensation = 32;/* we need to compensate 32 bits all set to 1 */

  while (value)
  {
    buffer[i] = (pb_byte_t)((value & 0x7F) | 0x80);
    value >>= 7;
    if (compensation)
    {
      /* re-set all the compensation bits we can or need */
      size_t bits = compensation > 7 ? 7 : compensation;
      value ^= (pb_uint64_t)((0xFFu >> (8 - bits)) << 25); /* set the number of bits needed on the lowest of the most significant 7 bits */
      compensation -= bits;
    }
    i++;
  }
  buffer[i - 1] &= 0x7F; /* Unset top bit on last byte */

  return pb_write(stream, buffer, i);
}
#endif

bool checkreturn pb_encode_varint(pb_ostream_t *stream, pb_uint64_t value)
{
    pb_byte_t buffer[10];
    size_t i = 0;
    
    if (value <= 0x7F)
    {
        pb_byte_t v = (pb_byte_t)value;
        return pb_write(stream, &v, 1);
    }
    
    while (value)
    {
        buffer[i] = (pb_byte_t)((value & 0x7F) | 0x80);
        value >>= 7;
        i++;
    }
    buffer[i-1] &= 0x7F; /* Unset top bit on last byte */
    
    return pb_write(stream, buffer, i);
}

bool checkreturn pb_encode_svarint(pb_ostream_t *stream, pb_int64_t value)
{
    pb_uint64_t zigzagged;
    if (value < 0)
        zigzagged = ~((pb_uint64_t)value << 1);
    else
        zigzagged = (pb_uint64_t)value << 1;
    
    return pb_encode_varint(stream, zigzagged);
}

bool checkreturn pb_encode_fixed32(pb_ostream_t *stream, const void *value)
{
    uint32_t val = *(const uint32_t*)value;
    pb_byte_t bytes[4];
    bytes[0] = (pb_byte_t)(val & 0xFF);
    bytes[1] = (pb_byte_t)((val >> 8) & 0xFF);
    bytes[2] = (pb_byte_t)((val >> 16) & 0xFF);
    bytes[3] = (pb_byte_t)((val >> 24) & 0xFF);
    return pb_write(stream, bytes, 4);
}

#ifndef PB_WITHOUT_64BIT
bool checkreturn pb_encode_fixed64(pb_ostream_t *stream, const void *value)
{
    uint64_t val = *(const uint64_t*)value;
    pb_byte_t bytes[8];
    bytes[0] = (pb_byte_t)(val & 0xFF);
    bytes[1] = (pb_byte_t)((val >> 8) & 0xFF);
    bytes[2] = (pb_byte_t)((val >> 16) & 0xFF);
    bytes[3] = (pb_byte_t)((val >> 24) & 0xFF);
    bytes[4] = (pb_byte_t)((val >> 32) & 0xFF);
    bytes[5] = (pb_byte_t)((val >> 40) & 0xFF);
    bytes[6] = (pb_byte_t)((val >> 48) & 0xFF);
    bytes[7] = (pb_byte_t)((val >> 56) & 0xFF);
    return pb_write(stream, bytes, 8);
}
#endif

bool checkreturn pb_encode_tag(pb_ostream_t *stream, pb_wire_type_t wiretype, uint32_t field_number)
{
    pb_uint64_t tag = ((pb_uint64_t)field_number << 3) | wiretype;
    return pb_encode_varint(stream, tag);
}

bool checkreturn pb_encode_tag_for_field(pb_ostream_t *stream, const pb_field_t *field)
{
    pb_wire_type_t wiretype;
    switch (PB_LTYPE(field->type))
    {
        case PB_LTYPE_VARINT:
        case PB_LTYPE_UVARINT:
        case PB_LTYPE_SVARINT:
            wiretype = PB_WT_VARINT;
            break;
        
        case PB_LTYPE_FIXED32:
            wiretype = PB_WT_32BIT;
            break;
        
        case PB_LTYPE_FIXED64:
            wiretype = PB_WT_64BIT;
            break;
        
        case PB_LTYPE_BYTES:
        case PB_LTYPE_STRING:
        case PB_LTYPE_SUBMESSAGE:
        case PB_LTYPE_FIXED_LENGTH_BYTES:
            wiretype = PB_WT_STRING;
            break;
        
        default:
            PB_RETURN_ERROR(stream, "invalid field type");
    }
    
    return pb_encode_tag(stream, wiretype, field->tag);
}

bool checkreturn pb_encode_string(pb_ostream_t *stream, const pb_byte_t *buffer, size_t size)
{
    if (!pb_encode_varint(stream, (pb_uint64_t)size))
        return false;
    
    return pb_write(stream, buffer, size);
}

bool checkreturn pb_encode_submessage(pb_ostream_t *stream, const pb_field_t fields[], const void *src_struct)
{
    /* First calculate the message size using a non-writing substream. */
    pb_ostream_t substream = PB_OSTREAM_SIZING;
    size_t size;
    bool status;
    
    if (!pb_encode(&substream, fields, src_struct))
    {
#ifndef PB_NO_ERRMSG
        stream->errmsg = substream.errmsg;
#endif
        return false;
    }
    
    size = substream.bytes_written;
    
    if (!pb_encode_varint(stream, (pb_uint64_t)size))
        return false;
    
    if (stream->callback == NULL)
        return pb_write(stream, NULL, size); /* Just sizing */
    
    if (stream->bytes_written + size > stream->max_size)
        PB_RETURN_ERROR(stream, "stream full");
        
    /* Use a substream to verify that a callback doesn't write more than
     * what it did the first time. */
    substream.callback = stream->callback;
    substream.state = stream->state;
    substream.max_size = size;
    substream.bytes_written = 0;
#ifndef PB_NO_ERRMSG
    substream.errmsg = NULL;
#endif
    
    status = pb_encode(&substream, fields, src_struct);
    
    stream->bytes_written += substream.bytes_written;
    stream->state = substream.state;
#ifndef PB_NO_ERRMSG
    stream->errmsg = substream.errmsg;
#endif
    
    if (substream.bytes_written != size)
        PB_RETURN_ERROR(stream, "submsg size changed");
    
    return status;
}

/* Field encoders */

static bool checkreturn pb_enc_varint(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    pb_int64_t value = 0;
    
    if (field->data_size == sizeof(int_least8_t))
        value = *(const int_least8_t*)src;
    else if (field->data_size == sizeof(int_least16_t))
        value = *(const int_least16_t*)src;
    else if (field->data_size == sizeof(int32_t))
        value = *(const int32_t*)src;
    else if (field->data_size == sizeof(pb_int64_t))
        value = *(const pb_int64_t*)src;
    else
        PB_RETURN_ERROR(stream, "invalid data_size");
    
#ifdef PB_WITHOUT_64BIT
    if (value < 0)
      return pb_encode_negative_varint(stream, (pb_uint64_t)value);
    else
#endif
      return pb_encode_varint(stream, (pb_uint64_t)value);
}

static bool checkreturn pb_enc_uvarint(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    pb_uint64_t value = 0;
    
    if (field->data_size == sizeof(uint_least8_t))
        value = *(const uint_least8_t*)src;
    else if (field->data_size == sizeof(uint_least16_t))
        value = *(const uint_least16_t*)src;
    else if (field->data_size == sizeof(uint32_t))
        value = *(const uint32_t*)src;
    else if (field->data_size == sizeof(pb_uint64_t))
        value = *(const pb_uint64_t*)src;
    else
        PB_RETURN_ERROR(stream, "invalid data_size");
    
    return pb_encode_varint(stream, value);
}

static bool checkreturn pb_enc_svarint(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    pb_int64_t value = 0;
    
    if (field->data_size == sizeof(int_least8_t))
        value = *(const int_least8_t*)src;
    else if (field->data_size == sizeof(int_least16_t))
        value = *(const int_least16_t*)src;
    else if (field->data_size == sizeof(int32_t))
        value = *(const int32_t*)src;
    else if (field->data_size == sizeof(pb_int64_t))
        value = *(const pb_int64_t*)src;
    else
        PB_RETURN_ERROR(stream, "invalid data_size");
    
    return pb_encode_svarint(stream, value);
}

static bool checkreturn pb_enc_fixed64(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    PB_UNUSED(field);
#ifndef PB_WITHOUT_64BIT
    return pb_encode_fixed64(stream, src);
#else
    PB_UNUSED(src);
    PB_RETURN_ERROR(stream, "no 64bit support");
#endif
}

static bool checkreturn pb_enc_fixed32(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    PB_UNUSED(field);
    return pb_encode_fixed32(stream, src);
}

static bool checkreturn pb_enc_bytes(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    const pb_bytes_array_t *bytes = NULL;

    bytes = (const pb_bytes_array_t*)src;
    
    if (src == NULL)
    {
        /* Treat null pointer as an empty bytes field */
        return pb_encode_string(stream, NULL, 0);
    }
    
    if (PB_ATYPE(field->type) == PB_ATYPE_STATIC &&
        PB_BYTES_ARRAY_T_ALLOCSIZE(bytes->size) > field->data_size)
    {
        PB_RETURN_ERROR(stream, "bytes size exceeded");
    }
    
    return pb_encode_string(stream, bytes->bytes, bytes->size);
}

static bool checkreturn pb_enc_string(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    size_t size = 0;
    size_t max_size = field->data_size;
    const char *p = (const char*)src;
    
    if (PB_ATYPE(field->type) == PB_ATYPE_POINTER)
        max_size = (size_t)-1;

    if (src == NULL)
    {
        size = 0; /* Treat null pointer as an empty string */
    }
    else
    {
        /* strnlen() is not always available, so just use a loop */
        while (size < max_size && *p != '\0')
        {
            size++;
            p++;
        }
    }

    return pb_encode_string(stream, (const pb_byte_t*)src, size);
}

static bool checkreturn pb_enc_submessage(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    if (field->ptr == NULL)
        PB_RETURN_ERROR(stream, "invalid field descriptor");
    
    return pb_encode_submessage(stream, (const pb_field_t*)field->ptr, src);
}

static bool checkreturn pb_enc_fixed_length_bytes(pb_ostream_t *stream, const pb_field_t *field, const void *src)
{
    return pb_encode_string(stream, (const pb_byte_t*)src, field->data_size);
}

