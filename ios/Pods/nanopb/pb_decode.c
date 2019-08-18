/* pb_decode.c -- decode a protobuf using minimal resources
 *
 * 2011 Petteri Aimonen <jpa@kapsi.fi>
 */

/* Use the GCC warn_unused_result attribute to check that all return values
 * are propagated correctly. On other compilers and gcc before 3.4.0 just
 * ignore the annotation.
 */
#if !defined(__GNUC__) || ( __GNUC__ < 3) || (__GNUC__ == 3 && __GNUC_MINOR__ < 4)
    #define checkreturn
#else
    #define checkreturn __attribute__((warn_unused_result))
#endif

#include "pb.h"
#include "pb_decode.h"
#include "pb_common.h"

/**************************************
 * Declarations internal to this file *
 **************************************/

typedef bool (*pb_decoder_t)(pb_istream_t *stream, const pb_field_t *field, void *dest) checkreturn;

static bool checkreturn buf_read(pb_istream_t *stream, pb_byte_t *buf, size_t count);
static bool checkreturn read_raw_value(pb_istream_t *stream, pb_wire_type_t wire_type, pb_byte_t *buf, size_t *size);
static bool checkreturn decode_static_field(pb_istream_t *stream, pb_wire_type_t wire_type, pb_field_iter_t *iter);
static bool checkreturn decode_callback_field(pb_istream_t *stream, pb_wire_type_t wire_type, pb_field_iter_t *iter);
static bool checkreturn decode_field(pb_istream_t *stream, pb_wire_type_t wire_type, pb_field_iter_t *iter);
static void iter_from_extension(pb_field_iter_t *iter, pb_extension_t *extension);
static bool checkreturn default_extension_decoder(pb_istream_t *stream, pb_extension_t *extension, uint32_t tag, pb_wire_type_t wire_type);
static bool checkreturn decode_extension(pb_istream_t *stream, uint32_t tag, pb_wire_type_t wire_type, pb_field_iter_t *iter);
static bool checkreturn find_extension_field(pb_field_iter_t *iter);
static void pb_field_set_to_default(pb_field_iter_t *iter);
static void pb_message_set_to_defaults(const pb_field_t fields[], void *dest_struct);
static bool checkreturn pb_dec_varint(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_decode_varint32_eof(pb_istream_t *stream, uint32_t *dest, bool *eof);
static bool checkreturn pb_dec_uvarint(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_dec_svarint(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_dec_fixed32(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_dec_fixed64(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_dec_bytes(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_dec_string(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_dec_submessage(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_dec_fixed_length_bytes(pb_istream_t *stream, const pb_field_t *field, void *dest);
static bool checkreturn pb_skip_varint(pb_istream_t *stream);
static bool checkreturn pb_skip_string(pb_istream_t *stream);

#ifdef PB_ENABLE_MALLOC
static bool checkreturn allocate_field(pb_istream_t *stream, void *pData, size_t data_size, size_t array_size);
static bool checkreturn pb_release_union_field(pb_istream_t *stream, pb_field_iter_t *iter);
static void pb_release_single_field(const pb_field_iter_t *iter);
#endif

#ifdef PB_WITHOUT_64BIT
#define pb_int64_t int32_t
#define pb_uint64_t uint32_t
#else
#define pb_int64_t int64_t
#define pb_uint64_t uint64_t
#endif

/* --- Function pointers to field decoders ---
 * Order in the array must match pb_action_t LTYPE numbering.
 */
static const pb_decoder_t PB_DECODERS[PB_LTYPES_COUNT] = {
    &pb_dec_varint,
    &pb_dec_uvarint,
    &pb_dec_svarint,
    &pb_dec_fixed32,
    &pb_dec_fixed64,
    
    &pb_dec_bytes,
    &pb_dec_string,
    &pb_dec_submessage,
    NULL, /* extensions */
    &pb_dec_fixed_length_bytes
};

/*******************************
 * pb_istream_t implementation *
 *******************************/

static bool checkreturn buf_read(pb_istream_t *stream, pb_byte_t *buf, size_t count)
{
    size_t i;
    const pb_byte_t *source = (const pb_byte_t*)stream->state;
    stream->state = (pb_byte_t*)stream->state + count;
    
    if (buf != NULL)
    {
        for (i = 0; i < count; i++)
            buf[i] = source[i];
    }
    
    return true;
}

bool checkreturn pb_read(pb_istream_t *stream, pb_byte_t *buf, size_t count)
{
#ifndef PB_BUFFER_ONLY
	if (buf == NULL && stream->callback != buf_read)
	{
		/* Skip input bytes */
		pb_byte_t tmp[16];
		while (count > 16)
		{
			if (!pb_read(stream, tmp, 16))
				return false;
			
			count -= 16;
		}
		
		return pb_read(stream, tmp, count);
	}
#endif

    if (stream->bytes_left < count)
        PB_RETURN_ERROR(stream, "end-of-stream");
    
#ifndef PB_BUFFER_ONLY
    if (!stream->callback(stream, buf, count))
        PB_RETURN_ERROR(stream, "io error");
#else
    if (!buf_read(stream, buf, count))
        return false;
#endif
    
    stream->bytes_left -= count;
    return true;
}

/* Read a single byte from input stream. buf may not be NULL.
 * This is an optimization for the varint decoding. */
static bool checkreturn pb_readbyte(pb_istream_t *stream, pb_byte_t *buf)
{
    if (stream->bytes_left == 0)
        PB_RETURN_ERROR(stream, "end-of-stream");

#ifndef PB_BUFFER_ONLY
    if (!stream->callback(stream, buf, 1))
        PB_RETURN_ERROR(stream, "io error");
#else
    *buf = *(const pb_byte_t*)stream->state;
    stream->state = (pb_byte_t*)stream->state + 1;
#endif

    stream->bytes_left--;
    
    return true;    
}

pb_istream_t pb_istream_from_buffer(const pb_byte_t *buf, size_t bufsize)
{
    pb_istream_t stream;
    /* Cast away the const from buf without a compiler error.  We are
     * careful to use it only in a const manner in the callbacks.
     */
    union {
        void *state;
        const void *c_state;
    } state;
#ifdef PB_BUFFER_ONLY
    stream.callback = NULL;
#else
    stream.callback = &buf_read;
#endif
    state.c_state = buf;
    stream.state = state.state;
    stream.bytes_left = bufsize;
#ifndef PB_NO_ERRMSG
    stream.errmsg = NULL;
#endif
    return stream;
}

/********************
 * Helper functions *
 ********************/

static bool checkreturn pb_decode_varint32_eof(pb_istream_t *stream, uint32_t *dest, bool *eof)
{
    pb_byte_t byte;
    uint32_t result;
    
    if (!pb_readbyte(stream, &byte))
    {
        if (stream->bytes_left == 0)
        {
            if (eof)
            {
                *eof = true;
            }
        }

        return false;
    }
    
    if ((byte & 0x80) == 0)
    {
        /* Quick case, 1 byte value */
        result = byte;
    }
    else
    {
        /* Multibyte case */
        uint_fast8_t bitpos = 7;
        result = byte & 0x7F;
        
        do
        {
            if (!pb_readbyte(stream, &byte))
                return false;
            
            if (bitpos >= 32)
            {
                /* Note: The varint could have trailing 0x80 bytes, or 0xFF for negative. */
                uint8_t sign_extension = (bitpos < 63) ? 0xFF : 0x01;
                
                if ((byte & 0x7F) != 0x00 && ((result >> 31) == 0 || byte != sign_extension))
                {
                    PB_RETURN_ERROR(stream, "varint overflow");
                }
            }
            else
            {
                result |= (uint32_t)(byte & 0x7F) << bitpos;
            }
            bitpos = (uint_fast8_t)(bitpos + 7);
        } while (byte & 0x80);
        
        if (bitpos == 35 && (byte & 0x70) != 0)
        {
            /* The last byte was at bitpos=28, so only bottom 4 bits fit. */
            PB_RETURN_ERROR(stream, "varint overflow");
        }
   }
   
   *dest = result;
   return true;
}

bool checkreturn pb_decode_varint32(pb_istream_t *stream, uint32_t *dest)
{
    return pb_decode_varint32_eof(stream, dest, NULL);
}

#ifndef PB_WITHOUT_64BIT
bool checkreturn pb_decode_varint(pb_istream_t *stream, uint64_t *dest)
{
    pb_byte_t byte;
    uint_fast8_t bitpos = 0;
    uint64_t result = 0;
    
    do
    {
        if (bitpos >= 64)
            PB_RETURN_ERROR(stream, "varint overflow");
        
        if (!pb_readbyte(stream, &byte))
            return false;

        result |= (uint64_t)(byte & 0x7F) << bitpos;
        bitpos = (uint_fast8_t)(bitpos + 7);
    } while (byte & 0x80);
    
    *dest = result;
    return true;
}
#endif

bool checkreturn pb_skip_varint(pb_istream_t *stream)
{
    pb_byte_t byte;
    do
    {
        if (!pb_read(stream, &byte, 1))
            return false;
    } while (byte & 0x80);
    return true;
}

bool checkreturn pb_skip_string(pb_istream_t *stream)
{
    uint32_t length;
    if (!pb_decode_varint32(stream, &length))
        return false;
    
    return pb_read(stream, NULL, length);
}

bool checkreturn pb_decode_tag(pb_istream_t *stream, pb_wire_type_t *wire_type, uint32_t *tag, bool *eof)
{
    uint32_t temp;
    *eof = false;
    *wire_type = (pb_wire_type_t) 0;
    *tag = 0;
    
    if (!pb_decode_varint32_eof(stream, &temp, eof))
    {
        return false;
    }
    
    if (temp == 0)
    {
        *eof = true; /* Special feature: allow 0-terminated messages. */
        return false;
    }
    
    *tag = temp >> 3;
    *wire_type = (pb_wire_type_t)(temp & 7);
    return true;
}

bool checkreturn pb_skip_field(pb_istream_t *stream, pb_wire_type_t wire_type)
{
    switch (wire_type)
    {
        case PB_WT_VARINT: return pb_skip_varint(stream);
        case PB_WT_64BIT: return pb_read(stream, NULL, 8);
        case PB_WT_STRING: return pb_skip_string(stream);
        case PB_WT_32BIT: return pb_read(stream, NULL, 4);
        default: PB_RETURN_ERROR(stream, "invalid wire_type");
    }
}

/* Read a raw value to buffer, for the purpose of passing it to callback as
 * a substream. Size is maximum size on call, and actual size on return.
 */
static bool checkreturn read_raw_value(pb_istream_t *stream, pb_wire_type_t wire_type, pb_byte_t *buf, size_t *size)
{
    size_t max_size = *size;
    switch (wire_type)
    {
        case PB_WT_VARINT:
            *size = 0;
            do
            {
                (*size)++;
                if (*size > max_size) return false;
                if (!pb_read(stream, buf, 1)) return false;
            } while (*buf++ & 0x80);
            return true;
            
        case PB_WT_64BIT:
            *size = 8;
            return pb_read(stream, buf, 8);
        
        case PB_WT_32BIT:
            *size = 4;
            return pb_read(stream, buf, 4);
        
        case PB_WT_STRING:
            /* Calling read_raw_value with a PB_WT_STRING is an error.
             * Explicitly handle this case and fallthrough to default to avoid
             * compiler warnings.
             */

        default: PB_RETURN_ERROR(stream, "invalid wire_type");
    }
}

/* Decode string length from stream and return a substream with limited length.
 * Remember to close the substream using pb_close_string_substream().
 */
bool checkreturn pb_make_string_substream(pb_istream_t *stream, pb_istream_t *substream)
{
    uint32_t size;
    if (!pb_decode_varint32(stream, &size))
        return false;
    
    *substream = *stream;
    if (substream->bytes_left < size)
        PB_RETURN_ERROR(stream, "parent stream too short");
    
    substream->bytes_left = size;
    stream->bytes_left -= size;
    return true;
}

bool checkreturn pb_close_string_substream(pb_istream_t *stream, pb_istream_t *substream)
{
    if (substream->bytes_left) {
        if (!pb_read(substream, NULL, substream->bytes_left))
            return false;
    }

    stream->state = substream->state;

#ifndef PB_NO_ERRMSG
    stream->errmsg = substream->errmsg;
#endif
    return true;
}

/*************************
 * Decode a single field *
 *************************/

static bool checkreturn decode_static_field(pb_istream_t *stream, pb_wire_type_t wire_type, pb_field_iter_t *iter)
{
    pb_type_t type;
    pb_decoder_t func;
    
    type = iter->pos->type;
    func = PB_DECODERS[PB_LTYPE(type)];

    switch (PB_HTYPE(type))
    {
        case PB_HTYPE_REQUIRED:
            return func(stream, iter->pos, iter->pData);
            
        case PB_HTYPE_OPTIONAL:
            if (iter->pSize != iter->pData)
                *(bool*)iter->pSize = true;
            return func(stream, iter->pos, iter->pData);
    
        case PB_HTYPE_REPEATED:
            if (wire_type == PB_WT_STRING
                && PB_LTYPE(type) <= PB_LTYPE_LAST_PACKABLE)
            {
                /* Packed array */
                bool status = true;
                pb_size_t *size = (pb_size_t*)iter->pSize;

                pb_istream_t substream;
                if (!pb_make_string_substream(stream, &substream))
                    return false;

                while (substream.bytes_left > 0 && *size < iter->pos->array_size)
                {
                    void *pItem = (char*)iter->pData + iter->pos->data_size * (*size);
                    if (!func(&substream, iter->pos, pItem))
                    {
                        status = false;
                        break;
                    }
                    (*size)++;
                }

                if (substream.bytes_left != 0)
                    PB_RETURN_ERROR(stream, "array overflow");
                if (!pb_close_string_substream(stream, &substream))
                    return false;

                return status;
            }
            else
            {
                /* Repeated field */
                pb_size_t *size = (pb_size_t*)iter->pSize;
                char *pItem = (char*)iter->pData + iter->pos->data_size * (*size);

                if ((*size)++ >= iter->pos->array_size)
                    PB_RETURN_ERROR(stream, "array overflow");

                return func(stream, iter->pos, pItem);
            }

        case PB_HTYPE_ONEOF:
            *(pb_size_t*)iter->pSize = iter->pos->tag;
            if (PB_LTYPE(type) == PB_LTYPE_SUBMESSAGE)
            {
                /* We memset to zero so that any callbacks are set to NULL.
                 * Then set any default values. */
                memset(iter->pData, 0, iter->pos->data_size);
                pb_message_set_to_defaults((const pb_field_t*)iter->pos->ptr, iter->pData);
            }
            return func(stream, iter->pos, iter->pData);

        default:
            PB_RETURN_ERROR(stream, "invalid field type");
    }
}

#ifdef PB_ENABLE_MALLOC
/* Allocate storage for the field and store the pointer at iter->pData.
 * array_size is the number of entries to reserve in an array.
 * Zero size is not allowed, use pb_free() for releasing.
 */
static bool checkreturn allocate_field(pb_istream_t *stream, void *pData, size_t data_size, size_t array_size)
{    
    void *ptr = *(void**)pData;
    
    if (data_size == 0 || array_size == 0)
        PB_RETURN_ERROR(stream, "invalid size");
    
    /* Check for multiplication overflows.
     * This code avoids the costly division if the sizes are small enough.
     * Multiplication is safe as long as only half of bits are set
     * in either multiplicand.
     */
    {
        const size_t check_limit = (size_t)1 << (sizeof(size_t) * 4);
        if (data_size >= check_limit || array_size >= check_limit)
        {
            const size_t size_max = (size_t)-1;
            if (size_max / array_size < data_size)
            {
                PB_RETURN_ERROR(stream, "size too large");
            }
        }
    }
    
    /* Allocate new or expand previous allocation */
    /* Note: on failure the old pointer will remain in the structure,
     * the message must be freed by caller also on error return. */
    ptr = pb_realloc(ptr, array_size * data_size);
    if (ptr == NULL)
        PB_RETURN_ERROR(stream, "realloc failed");
    
    *(void**)pData = ptr;
    return true;
}

/* Clear a newly allocated item in case it contains a pointer, or is a submessage. */
static void initialize_pointer_field(void *pItem, pb_field_iter_t *iter)
{
    if (PB_LTYPE(iter->pos->type) == PB_LTYPE_STRING ||
        PB_LTYPE(iter->pos->type) == PB_LTYPE_BYTES)
    {
        *(void**)pItem = NULL;
    }
    else if (PB_LTYPE(iter->pos->type) == PB_LTYPE_SUBMESSAGE)
    {
        /* We memset to zero so that any callbacks are set to NULL.
         * Then set any default values. */
        memset(pItem, 0, iter->pos->data_size);
        pb_message_set_to_defaults((const pb_field_t *) iter->pos->ptr, pItem);
    }
}
#endif

static bool checkreturn decode_pointer_field(pb_istream_t *stream, pb_wire_type_t wire_type, pb_field_iter_t *iter)
{
#ifndef PB_ENABLE_MALLOC
    PB_UNUSED(wire_type);
    PB_UNUSED(iter);
    PB_RETURN_ERROR(stream, "no malloc support");
#else
    pb_type_t type;
    pb_decoder_t func;
    
    type = iter->pos->type;
    func = PB_DECODERS[PB_LTYPE(type)];
    
    switch (PB_HTYPE(type))
    {
        case PB_HTYPE_REQUIRED:
        case PB_HTYPE_OPTIONAL:
        case PB_HTYPE_ONEOF:
            if (PB_LTYPE(type) == PB_LTYPE_SUBMESSAGE &&
                *(void**)iter->pData != NULL)
            {
                /* Duplicate field, have to release the old allocation first. */
                pb_release_single_field(iter);
            }
        
            if (PB_HTYPE(type) == PB_HTYPE_ONEOF)
            {
                *(pb_size_t*)iter->pSize = iter->pos->tag;
            }

            if (PB_LTYPE(type) == PB_LTYPE_STRING ||
                PB_LTYPE(type) == PB_LTYPE_BYTES)
            {
                return func(stream, iter->pos, iter->pData);
            }
            else
            {
                if (!allocate_field(stream, iter->pData, iter->pos->data_size, 1))
                    return false;
                
                initialize_pointer_field(*(void**)iter->pData, iter);
                return func(stream, iter->pos, *(void**)iter->pData);
            }
    
        case PB_HTYPE_REPEATED:
            if (wire_type == PB_WT_STRING
                && PB_LTYPE(type) <= PB_LTYPE_LAST_PACKABLE)
            {
                /* Packed array, multiple items come in at once. */
                bool status = true;
                pb_size_t *size = (pb_size_t*)iter->pSize;
                size_t allocated_size = *size;
                void *pItem;
                pb_istream_t substream;
                
                if (!pb_make_string_substream(stream, &substream))
                    return false;
                
                while (substream.bytes_left)
                {
                    if ((size_t)*size + 1 > allocated_size)
                    {
                        /* Allocate more storage. This tries to guess the
                         * number of remaining entries. Round the division
                         * upwards. */
                        allocated_size += (substream.bytes_left - 1) / iter->pos->data_size + 1;
                        
                        if (!allocate_field(&substream, iter->pData, iter->pos->data_size, allocated_size))
                        {
                            status = false;
                            break;
                        }
                    }

                    /* Decode the array entry */
                    pItem = *(char**)iter->pData + iter->pos->data_size * (*size);
                    initialize_pointer_field(pItem, iter);
                    if (!func(&substream, iter->pos, pItem))
                    {
                        status = false;
                        break;
                    }
                    
                    if (*size == PB_SIZE_MAX)
                    {
#ifndef PB_NO_ERRMSG
                        stream->errmsg = "too many array entries";
#endif
                        status = false;
                        break;
                    }
                    
                    (*size)++;
                }
                if (!pb_close_string_substream(stream, &substream))
                    return false;
                
                return status;
            }
            else
            {
                /* Normal repeated field, i.e. only one item at a time. */
                pb_size_t *size = (pb_size_t*)iter->pSize;
                void *pItem;
                
                if (*size == PB_SIZE_MAX)
                    PB_RETURN_ERROR(stream, "too many array entries");
                
                (*size)++;
                if (!allocate_field(stream, iter->pData, iter->pos->data_size, *size))
                    return false;
            
                pItem = *(char**)iter->pData + iter->pos->data_size * (*size - 1);
                initialize_pointer_field(pItem, iter);
                return func(stream, iter->pos, pItem);
            }

        default:
            PB_RETURN_ERROR(stream, "invalid field type");
    }
#endif
}

static bool checkreturn decode_callback_field(pb_istream_t *stream, pb_wire_type_t wire_type, pb_field_iter_t *iter)
{
    pb_callback_t *pCallback = (pb_callback_t*)iter->pData;
    
#ifdef PB_OLD_CALLBACK_STYLE
    void *arg = pCallback->arg;
#else
    void **arg = &(pCallback->arg);
#endif
    
    if (pCallback == NULL || pCallback->funcs.decode == NULL)
        return pb_skip_field(stream, wire_type);
    
    if (wire_type == PB_WT_STRING)
    {
        pb_istream_t substream;
        
        if (!pb_make_string_substream(stream, &substream))
            return false;
        
        do
        {
            if (!pCallback->funcs.decode(&substream, iter->pos, arg))
                PB_RETURN_ERROR(stream, "callback failed");
        } while (substream.bytes_left);
        
        if (!pb_close_string_substream(stream, &substream))
            return false;

        return true;
    }
    else
    {
        /* Copy the single scalar value to stack.
         * This is required so that we can limit the stream length,
         * which in turn allows to use same callback for packed and
         * not-packed fields. */
        pb_istream_t substream;
        pb_byte_t buffer[10];
        size_t size = sizeof(buffer);
        
        if (!read_raw_value(stream, wire_type, buffer, &size))
            return false;
        substream = pb_istream_from_buffer(buffer, size);
        
        return pCallback->funcs.decode(&substream, iter->pos, arg);
    }
}

static bool checkreturn decode_field(pb_istream_t *stream, pb_wire_type_t wire_type, pb_field_iter_t *iter)
{
#ifdef PB_ENABLE_MALLOC
    /* When decoding an oneof field, check if there is old data that must be
     * released first. */
    if (PB_HTYPE(iter->pos->type) == PB_HTYPE_ONEOF)
    {
        if (!pb_release_union_field(stream, iter))
            return false;
    }
#endif

    switch (PB_ATYPE(iter->pos->type))
    {
        case PB_ATYPE_STATIC:
            return decode_static_field(stream, wire_type, iter);
        
        case PB_ATYPE_POINTER:
            return decode_pointer_field(stream, wire_type, iter);
        
        case PB_ATYPE_CALLBACK:
            return decode_callback_field(stream, wire_type, iter);
        
        default:
            PB_RETURN_ERROR(stream, "invalid field type");
    }
}

static void iter_from_extension(pb_field_iter_t *iter, pb_extension_t *extension)
{
    /* Fake a field iterator for the extension field.
     * It is not actually safe to advance this iterator, but decode_field
     * will not even try to. */
    const pb_field_t *field = (const pb_field_t*)extension->type->arg;
    (void)pb_field_iter_begin(iter, field, extension->dest);
    iter->pData = extension->dest;
    iter->pSize = &extension->found;
    
    if (PB_ATYPE(field->type) == PB_ATYPE_POINTER)
    {
        /* For pointer extensions, the pointer is stored directly
         * in the extension structure. This avoids having an extra
         * indirection. */
        iter->pData = &extension->dest;
    }
}

/* Default handler for extension fields. Expects a pb_field_t structure
 * in extension->type->arg. */
static bool checkreturn default_extension_decoder(pb_istream_t *stream,
    pb_extension_t *extension, uint32_t tag, pb_wire_type_t wire_type)
{
    const pb_field_t *field = (const pb_field_t*)extension->type->arg;
    pb_field_iter_t iter;
    
    if (field->tag != tag)
        return true;
    
    iter_from_extension(&iter, extension);
    extension->found = true;
    return decode_field(stream, wire_type, &iter);
}

/* Try to decode an unknown field as an extension field. Tries each extension
 * decoder in turn, until one of them handles the field or loop ends. */
static bool checkreturn decode_extension(pb_istream_t *stream,
    uint32_t tag, pb_wire_type_t wire_type, pb_field_iter_t *iter)
{
    pb_extension_t *extension = *(pb_extension_t* const *)iter->pData;
    size_t pos = stream->bytes_left;
    
    while (extension != NULL && pos == stream->bytes_left)
    {
        bool status;
        if (extension->type->decode)
            status = extension->type->decode(stream, extension, tag, wire_type);
        else
            status = default_extension_decoder(stream, extension, tag, wire_type);

        if (!status)
            return false;
        
        extension = extension->next;
    }
    
    return true;
}

/* Step through the iterator until an extension field is found or until all
 * entries have been checked. There can be only one extension field per
 * message. Returns false if no extension field is found. */
static bool checkreturn find_extension_field(pb_field_iter_t *iter)
{
    const pb_field_t *start = iter->pos;
    
    do {
        if (PB_LTYPE(iter->pos->type) == PB_LTYPE_EXTENSION)
            return true;
        (void)pb_field_iter_next(iter);
    } while (iter->pos != start);
    
    return false;
}

/* Initialize message fields to default values, recursively */
static void pb_field_set_to_default(pb_field_iter_t *iter)
{
    pb_type_t type;
    type = iter->pos->type;
    
    if (PB_LTYPE(type) == PB_LTYPE_EXTENSION)
    {
        pb_extension_t *ext = *(pb_extension_t* const *)iter->pData;
        while (ext != NULL)
        {
            pb_field_iter_t ext_iter;
            ext->found = false;
            iter_from_extension(&ext_iter, ext);
            pb_field_set_to_default(&ext_iter);
            ext = ext->next;
        }
    }
    else if (PB_ATYPE(type) == PB_ATYPE_STATIC)
    {
        bool init_data = true;
        if (PB_HTYPE(type) == PB_HTYPE_OPTIONAL && iter->pSize != iter->pData)
        {
            /* Set has_field to false. Still initialize the optional field
             * itself also. */
            *(bool*)iter->pSize = false;
        }
        else if (PB_HTYPE(type) == PB_HTYPE_REPEATED ||
                 PB_HTYPE(type) == PB_HTYPE_ONEOF)
        {
            /* REPEATED: Set array count to 0, no need to initialize contents.
               ONEOF: Set which_field to 0. */
            *(pb_size_t*)iter->pSize = 0;
            init_data = false;
        }

        if (init_data)
        {
            if (PB_LTYPE(iter->pos->type) == PB_LTYPE_SUBMESSAGE)
            {
                /* Initialize submessage to defaults */
                pb_message_set_to_defaults((const pb_field_t *) iter->pos->ptr, iter->pData);
            }
            else if (iter->pos->ptr != NULL)
            {
                /* Initialize to default value */
                memcpy(iter->pData, iter->pos->ptr, iter->pos->data_size);
            }
            else
            {
                /* Initialize to zeros */
                memset(iter->pData, 0, iter->pos->data_size);
            }
        }
    }
    else if (PB_ATYPE(type) == PB_ATYPE_POINTER)
    {
        /* Initialize the pointer to NULL. */
        *(void**)iter->pData = NULL;
        
        /* Initialize array count to 0. */
        if (PB_HTYPE(type) == PB_HTYPE_REPEATED ||
            PB_HTYPE(type) == PB_HTYPE_ONEOF)
        {
            *(pb_size_t*)iter->pSize = 0;
        }
    }
    else if (PB_ATYPE(type) == PB_ATYPE_CALLBACK)
    {
        /* Don't overwrite callback */
    }
}

static void pb_message_set_to_defaults(const pb_field_t fields[], void *dest_struct)
{
    pb_field_iter_t iter;

    if (!pb_field_iter_begin(&iter, fields, dest_struct))
        return; /* Empty message type */
    
    do
    {
        pb_field_set_to_default(&iter);
    } while (pb_field_iter_next(&iter));
}

/*********************
 * Decode all fields *
 *********************/

bool checkreturn pb_decode_noinit(pb_istream_t *stream, const pb_field_t fields[], void *dest_struct)
{
    uint32_t fields_seen[(PB_MAX_REQUIRED_FIELDS + 31) / 32] = {0, 0};
    const uint32_t allbits = ~(uint32_t)0;
    uint32_t extension_range_start = 0;
    pb_field_iter_t iter;

    /* 'fixed_count_field' and 'fixed_count_size' track position of a repeated fixed
     * count field. This can only handle _one_ repeated fixed count field that
     * is unpacked and unordered among other (non repeated fixed count) fields.
     */
    const pb_field_t *fixed_count_field = NULL;
    pb_size_t fixed_count_size = 0;

    /* Return value ignored, as empty message types will be correctly handled by
     * pb_field_iter_find() anyway. */
    (void)pb_field_iter_begin(&iter, fields, dest_struct);

    while (stream->bytes_left)
    {
        uint32_t tag;
        pb_wire_type_t wire_type;
        bool eof;

        if (!pb_decode_tag(stream, &wire_type, &tag, &eof))
        {
            if (eof)
                break;
            else
                return false;
        }

        if (!pb_field_iter_find(&iter, tag))
        {
            /* No match found, check if it matches an extension. */
            if (tag >= extension_range_start)
            {
                if (!find_extension_field(&iter))
                    extension_range_start = (uint32_t)-1;
                else
                    extension_range_start = iter.pos->tag;

                if (tag >= extension_range_start)
                {
                    size_t pos = stream->bytes_left;

                    if (!decode_extension(stream, tag, wire_type, &iter))
                        return false;

                    if (pos != stream->bytes_left)
                    {
                        /* The field was handled */
                        continue;
                    }
                }
            }

            /* No match found, skip data */
            if (!pb_skip_field(stream, wire_type))
                return false;
            continue;
        }

        /* If a repeated fixed count field was found, get size from
         * 'fixed_count_field' as there is no counter contained in the struct.
         */
        if (PB_HTYPE(iter.pos->type) == PB_HTYPE_REPEATED
            && iter.pSize == iter.pData)
        {
            if (fixed_count_field != iter.pos) {
                /* If the new fixed count field does not match the previous one,
                 * check that the previous one is NULL or that it finished
                 * receiving all the expected data.
                 */
                if (fixed_count_field != NULL &&
                    fixed_count_size != fixed_count_field->array_size)
                {
                    PB_RETURN_ERROR(stream, "wrong size for fixed count field");
                }

                fixed_count_field = iter.pos;
                fixed_count_size = 0;
            }

            iter.pSize = &fixed_count_size;
        }

        if (PB_HTYPE(iter.pos->type) == PB_HTYPE_REQUIRED
            && iter.required_field_index < PB_MAX_REQUIRED_FIELDS)
        {
            uint32_t tmp = ((uint32_t)1 << (iter.required_field_index & 31));
            fields_seen[iter.required_field_index >> 5] |= tmp;
        }

        if (!decode_field(stream, wire_type, &iter))
            return false;
    }

    /* Check that all elements of the last decoded fixed count field were present. */
    if (fixed_count_field != NULL &&
        fixed_count_size != fixed_count_field->array_size)
    {
        PB_RETURN_ERROR(stream, "wrong size for fixed count field");
    }

    /* Check that all required fields were present. */
    {
        /* First figure out the number of required fields by
         * seeking to the end of the field array. Usually we
         * are already close to end after decoding.
         */
        unsigned req_field_count;
        pb_type_t last_type;
        unsigned i;
        do {
            req_field_count = iter.required_field_index;
            last_type = iter.pos->type;
        } while (pb_field_iter_next(&iter));
        
        /* Fixup if last field was also required. */
        if (PB_HTYPE(last_type) == PB_HTYPE_REQUIRED && iter.pos->tag != 0)
            req_field_count++;
        
        if (req_field_count > PB_MAX_REQUIRED_FIELDS)
            req_field_count = PB_MAX_REQUIRED_FIELDS;

        if (req_field_count > 0)
        {
            /* Check the whole words */
            for (i = 0; i < (req_field_count >> 5); i++)
            {
                if (fields_seen[i] != allbits)
                    PB_RETURN_ERROR(stream, "missing required field");
            }
            
            /* Check the remaining bits (if any) */
            if ((req_field_count & 31) != 0)
            {
                if (fields_seen[req_field_count >> 5] !=
                    (allbits >> (32 - (req_field_count & 31))))
                {
                    PB_RETURN_ERROR(stream, "missing required field");
                }
            }
        }
    }
    
    return true;
}

bool checkreturn pb_decode(pb_istream_t *stream, const pb_field_t fields[], void *dest_struct)
{
    bool status;
    pb_message_set_to_defaults(fields, dest_struct);
    status = pb_decode_noinit(stream, fields, dest_struct);
    
#ifdef PB_ENABLE_MALLOC
    if (!status)
        pb_release(fields, dest_struct);
#endif
    
    return status;
}

bool pb_decode_delimited_noinit(pb_istream_t *stream, const pb_field_t fields[], void *dest_struct)
{
    pb_istream_t substream;
    bool status;

    if (!pb_make_string_substream(stream, &substream))
        return false;

    status = pb_decode_noinit(&substream, fields, dest_struct);

    if (!pb_close_string_substream(stream, &substream))
        return false;
    return status;
}

bool pb_decode_delimited(pb_istream_t *stream, const pb_field_t fields[], void *dest_struct)
{
    pb_istream_t substream;
    bool status;
    
    if (!pb_make_string_substream(stream, &substream))
        return false;
    
    status = pb_decode(&substream, fields, dest_struct);

    if (!pb_close_string_substream(stream, &substream))
        return false;
    return status;
}

bool pb_decode_nullterminated(pb_istream_t *stream, const pb_field_t fields[], void *dest_struct)
{
    /* This behaviour will be separated in nanopb-0.4.0, see issue #278. */
    return pb_decode(stream, fields, dest_struct);
}

#ifdef PB_ENABLE_MALLOC
/* Given an oneof field, if there has already been a field inside this oneof,
 * release it before overwriting with a different one. */
static bool pb_release_union_field(pb_istream_t *stream, pb_field_iter_t *iter)
{
    pb_size_t old_tag = *(pb_size_t*)iter->pSize; /* Previous which_ value */
    pb_size_t new_tag = iter->pos->tag; /* New which_ value */

    if (old_tag == 0)
        return true; /* Ok, no old data in union */

    if (old_tag == new_tag)
        return true; /* Ok, old data is of same type => merge */

    /* Release old data. The find can fail if the message struct contains
     * invalid data. */
    if (!pb_field_iter_find(iter, old_tag))
        PB_RETURN_ERROR(stream, "invalid union tag");

    pb_release_single_field(iter);

    /* Restore iterator to where it should be.
     * This shouldn't fail unless the pb_field_t structure is corrupted. */
    if (!pb_field_iter_find(iter, new_tag))
        PB_RETURN_ERROR(stream, "iterator error");
    
    return true;
}

static void pb_release_single_field(const pb_field_iter_t *iter)
{
    pb_type_t type;
    type = iter->pos->type;

    if (PB_HTYPE(type) == PB_HTYPE_ONEOF)
    {
        if (*(pb_size_t*)iter->pSize != iter->pos->tag)
            return; /* This is not the current field in the union */
    }

    /* Release anything contained inside an extension or submsg.
     * This has to be done even if the submsg itself is statically
     * allocated. */
    if (PB_LTYPE(type) == PB_LTYPE_EXTENSION)
    {
        /* Release fields from all extensions in the linked list */
        pb_extension_t *ext = *(pb_extension_t**)iter->pData;
        while (ext != NULL)
        {
            pb_field_iter_t ext_iter;
            iter_from_extension(&ext_iter, ext);
            pb_release_single_field(&ext_iter);
            ext = ext->next;
        }
    }
    else if (PB_LTYPE(type) == PB_LTYPE_SUBMESSAGE)
    {
        /* Release fields in submessage or submsg array */
        void *pItem = iter->pData;
        pb_size_t count = 1;
        
        if (PB_ATYPE(type) == PB_ATYPE_POINTER)
        {
            pItem = *(void**)iter->pData;
        }
        
        if (PB_HTYPE(type) == PB_HTYPE_REPEATED)
        {
            if (PB_ATYPE(type) == PB_ATYPE_STATIC && iter->pSize == iter->pData) {
                /* No _count field so use size of the array */
                count = iter->pos->array_size;
            } else {
                count = *(pb_size_t*)iter->pSize;
            }

            if (PB_ATYPE(type) == PB_ATYPE_STATIC && count > iter->pos->array_size)
            {
                /* Protect against corrupted _count fields */
                count = iter->pos->array_size;
            }
        }
        
        if (pItem)
        {
            while (count--)
            {
                pb_release((const pb_field_t*)iter->pos->ptr, pItem);
                pItem = (char*)pItem + iter->pos->data_size;
            }
        }
    }
    
    if (PB_ATYPE(type) == PB_ATYPE_POINTER)
    {
        if (PB_HTYPE(type) == PB_HTYPE_REPEATED &&
            (PB_LTYPE(type) == PB_LTYPE_STRING ||
             PB_LTYPE(type) == PB_LTYPE_BYTES))
        {
            /* Release entries in repeated string or bytes array */
            void **pItem = *(void***)iter->pData;
            pb_size_t count = *(pb_size_t*)iter->pSize;
            while (count--)
            {
                pb_free(*pItem);
                *pItem++ = NULL;
            }
        }
        
        if (PB_HTYPE(type) == PB_HTYPE_REPEATED)
        {
            /* We are going to release the array, so set the size to 0 */
            *(pb_size_t*)iter->pSize = 0;
        }
        
        /* Release main item */
        pb_free(*(void**)iter->pData);
        *(void**)iter->pData = NULL;
    }
}

void pb_release(const pb_field_t fields[], void *dest_struct)
{
    pb_field_iter_t iter;
    
    if (!dest_struct)
        return; /* Ignore NULL pointers, similar to free() */

    if (!pb_field_iter_begin(&iter, fields, dest_struct))
        return; /* Empty message type */
    
    do
    {
        pb_release_single_field(&iter);
    } while (pb_field_iter_next(&iter));
}
#endif

/* Field decoders */

bool pb_decode_svarint(pb_istream_t *stream, pb_int64_t *dest)
{
    pb_uint64_t value;
    if (!pb_decode_varint(stream, &value))
        return false;
    
    if (value & 1)
        *dest = (pb_int64_t)(~(value >> 1));
    else
        *dest = (pb_int64_t)(value >> 1);
    
    return true;
}

bool pb_decode_fixed32(pb_istream_t *stream, void *dest)
{
    pb_byte_t bytes[4];

    if (!pb_read(stream, bytes, 4))
        return false;
    
    *(uint32_t*)dest = ((uint32_t)bytes[0] << 0) |
                       ((uint32_t)bytes[1] << 8) |
                       ((uint32_t)bytes[2] << 16) |
                       ((uint32_t)bytes[3] << 24);
    return true;
}

#ifndef PB_WITHOUT_64BIT
bool pb_decode_fixed64(pb_istream_t *stream, void *dest)
{
    pb_byte_t bytes[8];

    if (!pb_read(stream, bytes, 8))
        return false;
    
    *(uint64_t*)dest = ((uint64_t)bytes[0] << 0) |
                       ((uint64_t)bytes[1] << 8) |
                       ((uint64_t)bytes[2] << 16) |
                       ((uint64_t)bytes[3] << 24) |
                       ((uint64_t)bytes[4] << 32) |
                       ((uint64_t)bytes[5] << 40) |
                       ((uint64_t)bytes[6] << 48) |
                       ((uint64_t)bytes[7] << 56);
    
    return true;
}
#endif

static bool checkreturn pb_dec_varint(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    pb_uint64_t value;
    pb_int64_t svalue;
    pb_int64_t clamped;
    if (!pb_decode_varint(stream, &value))
        return false;
    
    /* See issue 97: Google's C++ protobuf allows negative varint values to
     * be cast as int32_t, instead of the int64_t that should be used when
     * encoding. Previous nanopb versions had a bug in encoding. In order to
     * not break decoding of such messages, we cast <=32 bit fields to
     * int32_t first to get the sign correct.
     */
    if (field->data_size == sizeof(pb_int64_t))
        svalue = (pb_int64_t)value;
    else
        svalue = (int32_t)value;

    /* Cast to the proper field size, while checking for overflows */
    if (field->data_size == sizeof(pb_int64_t))
        clamped = *(pb_int64_t*)dest = svalue;
    else if (field->data_size == sizeof(int32_t))
        clamped = *(int32_t*)dest = (int32_t)svalue;
    else if (field->data_size == sizeof(int_least16_t))
        clamped = *(int_least16_t*)dest = (int_least16_t)svalue;
    else if (field->data_size == sizeof(int_least8_t))
        clamped = *(int_least8_t*)dest = (int_least8_t)svalue;
    else
        PB_RETURN_ERROR(stream, "invalid data_size");

    if (clamped != svalue)
        PB_RETURN_ERROR(stream, "integer too large");
    
    return true;
}

static bool checkreturn pb_dec_uvarint(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    pb_uint64_t value, clamped;
    if (!pb_decode_varint(stream, &value))
        return false;
    
    /* Cast to the proper field size, while checking for overflows */
    if (field->data_size == sizeof(pb_uint64_t))
        clamped = *(pb_uint64_t*)dest = value;
    else if (field->data_size == sizeof(uint32_t))
        clamped = *(uint32_t*)dest = (uint32_t)value;
    else if (field->data_size == sizeof(uint_least16_t))
        clamped = *(uint_least16_t*)dest = (uint_least16_t)value;
    else if (field->data_size == sizeof(uint_least8_t))
        clamped = *(uint_least8_t*)dest = (uint_least8_t)value;
    else
        PB_RETURN_ERROR(stream, "invalid data_size");
    
    if (clamped != value)
        PB_RETURN_ERROR(stream, "integer too large");

    return true;
}

static bool checkreturn pb_dec_svarint(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    pb_int64_t value, clamped;
    if (!pb_decode_svarint(stream, &value))
        return false;
    
    /* Cast to the proper field size, while checking for overflows */
    if (field->data_size == sizeof(pb_int64_t))
        clamped = *(pb_int64_t*)dest = value;
    else if (field->data_size == sizeof(int32_t))
        clamped = *(int32_t*)dest = (int32_t)value;
    else if (field->data_size == sizeof(int_least16_t))
        clamped = *(int_least16_t*)dest = (int_least16_t)value;
    else if (field->data_size == sizeof(int_least8_t))
        clamped = *(int_least8_t*)dest = (int_least8_t)value;
    else
        PB_RETURN_ERROR(stream, "invalid data_size");

    if (clamped != value)
        PB_RETURN_ERROR(stream, "integer too large");
    
    return true;
}

static bool checkreturn pb_dec_fixed32(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    PB_UNUSED(field);
    return pb_decode_fixed32(stream, dest);
}

static bool checkreturn pb_dec_fixed64(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    PB_UNUSED(field);
#ifndef PB_WITHOUT_64BIT
    return pb_decode_fixed64(stream, dest);
#else
    PB_UNUSED(dest);
    PB_RETURN_ERROR(stream, "no 64bit support");
#endif
}

static bool checkreturn pb_dec_bytes(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    uint32_t size;
    size_t alloc_size;
    pb_bytes_array_t *bdest;
    
    if (!pb_decode_varint32(stream, &size))
        return false;
    
    if (size > PB_SIZE_MAX)
        PB_RETURN_ERROR(stream, "bytes overflow");
    
    alloc_size = PB_BYTES_ARRAY_T_ALLOCSIZE(size);
    if (size > alloc_size)
        PB_RETURN_ERROR(stream, "size too large");
    
    if (PB_ATYPE(field->type) == PB_ATYPE_POINTER)
    {
#ifndef PB_ENABLE_MALLOC
        PB_RETURN_ERROR(stream, "no malloc support");
#else
        if (!allocate_field(stream, dest, alloc_size, 1))
            return false;
        bdest = *(pb_bytes_array_t**)dest;
#endif
    }
    else
    {
        if (alloc_size > field->data_size)
            PB_RETURN_ERROR(stream, "bytes overflow");
        bdest = (pb_bytes_array_t*)dest;
    }

    bdest->size = (pb_size_t)size;
    return pb_read(stream, bdest->bytes, size);
}

static bool checkreturn pb_dec_string(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    uint32_t size;
    size_t alloc_size;
    bool status;
    if (!pb_decode_varint32(stream, &size))
        return false;
    
    /* Space for null terminator */
    alloc_size = size + 1;
    
    if (alloc_size < size)
        PB_RETURN_ERROR(stream, "size too large");
    
    if (PB_ATYPE(field->type) == PB_ATYPE_POINTER)
    {
#ifndef PB_ENABLE_MALLOC
        PB_RETURN_ERROR(stream, "no malloc support");
#else
        if (!allocate_field(stream, dest, alloc_size, 1))
            return false;
        dest = *(void**)dest;
#endif
    }
    else
    {
        if (alloc_size > field->data_size)
            PB_RETURN_ERROR(stream, "string overflow");
    }
    
    status = pb_read(stream, (pb_byte_t*)dest, size);
    *((pb_byte_t*)dest + size) = 0;
    return status;
}

static bool checkreturn pb_dec_submessage(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    bool status;
    pb_istream_t substream;
    const pb_field_t* submsg_fields = (const pb_field_t*)field->ptr;
    
    if (!pb_make_string_substream(stream, &substream))
        return false;
    
    if (field->ptr == NULL)
        PB_RETURN_ERROR(stream, "invalid field descriptor");
    
    /* New array entries need to be initialized, while required and optional
     * submessages have already been initialized in the top-level pb_decode. */
    if (PB_HTYPE(field->type) == PB_HTYPE_REPEATED)
        status = pb_decode(&substream, submsg_fields, dest);
    else
        status = pb_decode_noinit(&substream, submsg_fields, dest);
    
    if (!pb_close_string_substream(stream, &substream))
        return false;
    return status;
}

static bool checkreturn pb_dec_fixed_length_bytes(pb_istream_t *stream, const pb_field_t *field, void *dest)
{
    uint32_t size;

    if (!pb_decode_varint32(stream, &size))
        return false;

    if (size > PB_SIZE_MAX)
        PB_RETURN_ERROR(stream, "bytes overflow");

    if (size == 0)
    {
        /* As a special case, treat empty bytes string as all zeros for fixed_length_bytes. */
        memset(dest, 0, field->data_size);
        return true;
    }

    if (size != field->data_size)
        PB_RETURN_ERROR(stream, "incorrect fixed length bytes size");

    return pb_read(stream, (pb_byte_t*)dest, field->data_size);
}
