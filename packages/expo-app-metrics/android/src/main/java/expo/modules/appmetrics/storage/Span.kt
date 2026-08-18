// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.storage

import androidx.room.Dao
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Transaction
import java.util.concurrent.ThreadLocalRandom

/**
 * Persistence-layer representation of one trace span, mirroring the OTLP `Span` shape. Spans are
 * a generic signal: any producer (network requests today, navigation or custom spans later)
 * converts its domain event into a `Span` at record time, and `expo-observe` exports pending rows
 * to the OTLP traces endpoint without knowing what produced them. Mirrors the iOS `SpanRow`.
 */
@Entity(
  tableName = "spans",
  indices = [Index("sessionId")],
  foreignKeys = [
    ForeignKey(
      entity = Session::class,
      parentColumns = ["id"],
      childColumns = ["sessionId"],
      onDelete = ForeignKey.CASCADE
    )
  ]
)
data class Span(
  /**
   * Auto-incremented rowid. Unlike the other tables' UUID keys, spans use a monotonic id so the
   * export layer can chunk in insertion order and delete consumed prefixes with one query.
   */
  @PrimaryKey(autoGenerate = true) val id: Long = 0,
  val sessionId: String,

  /**
   * W3C trace/span identifiers as lowercase hex (32 and 16 characters). Generated once at
   * record time and persisted, so a redelivered row (export is at-least-once) reaches the
   * server byte-identical instead of becoming an untraceable duplicate.
   */
  val traceId: String = generateTraceId(),
  val spanId: String = generateSpanId(),

  /**
   * Parent span id for in-app hierarchies, or `null` for a root span. No producer sets this yet;
   * the column exists so adding nested spans later is not a schema change.
   */
  val parentSpanId: String? = null,

  /** Span name per the semantic conventions of the producer (the HTTP method for network spans). */
  val name: String,

  /** `SpanKind` per the OTLP proto (`CLIENT_KIND` for network requests). */
  val kind: Int = INTERNAL_KIND,

  /**
   * Unix-epoch milliseconds. Millisecond integers rather than the ISO strings the other tables
   * use: a span's duration is routinely sub-second, and the house ISO format carries no
   * fractional seconds, so a string timestamp would collapse every fast span to zero length.
   */
  val startTimestampMs: Long,
  val endTimestampMs: Long,

  /** OTLP status code (`STATUS_ERROR`), or `null` when the span completed without one (UNSET). */
  val statusCode: Int? = null,
  val statusMessage: String? = null,

  /**
   * JSON object of span attributes, keyed per the producer's semantic conventions. Stored as an
   * opaque blob — nothing queries individual attributes locally, and the export layer converts
   * them generically to the OTLP wire shape.
   */
  val attributes: String? = null,

  /** JSON array of span events (`[{name, timeMs?, attributes}]`), or `null` when there are none. */
  val events: String? = null
) {
  companion object {
    /** `SpanKind` values from the OTLP proto, for producers picking a `kind`. */
    const val INTERNAL_KIND = 1
    const val CLIENT_KIND = 3

    /** `Status.code` values from the OTLP proto. UNSET is expressed by a null `statusCode`. */
    const val STATUS_ERROR = 2

    /**
     * A new random 16-byte trace id as 32 lowercase hex characters. There is no trace-context
     * propagation yet, so every span starts its own trace.
     */
    fun generateTraceId(): String = generateHexId(words = 2)

    /** A new random 8-byte span id as 16 lowercase hex characters. */
    fun generateSpanId(): String = generateHexId(words = 1)

    /**
     * Random identifier built from 8-byte words, hex-encoded. The all-zero value is invalid per
     * the OTLP spec (the server rejects the span), so it redraws — a branch that is hit once per
     * 2^64 draws but keeps the invariant explicit.
     */
    private fun generateHexId(words: Int): String {
      while (true) {
        val drawn = List(words) { ThreadLocalRandom.current().nextLong() }
        if (drawn.all { it == 0L }) {
          continue
        }
        return drawn.joinToString(separator = "") { "%016x".format(it) }
      }
    }
  }
}

@Dao
interface SpanDao {
  companion object {
    /**
     * Maximum number of rows retained in `spans`. Span producers (network requests especially)
     * can outnumber metrics and logs by orders of magnitude, and when nothing consumes the rows
     * (`expo-observe` not installed, or dispatch disabled) the session-retention prune alone
     * would let a busy app accumulate a week of traffic. `insertCapped` prunes past the cap.
     */
    const val SPAN_CAP = 2_000
  }

  @Insert
  suspend fun insert(span: Span): Long

  /**
   * Inserts a span and prunes rows older than `SPAN_CAP` in the same transaction — ids are
   * monotonic, so "older" is simply everything at least `SPAN_CAP` ids behind the row just
   * inserted.
   */
  @Transaction
  suspend fun insertCapped(span: Span): Long {
    val insertedId = insert(span)
    deleteUpTo(insertedId - SPAN_CAP)
    return insertedId
  }

  /** All spans in ascending rowid (insertion) order. */
  @Query("SELECT * FROM spans ORDER BY id ASC")
  suspend fun getAll(): List<Span>

  /** The largest rowid currently in the table, or `null` when it's empty. */
  @Query("SELECT MAX(id) FROM spans")
  suspend fun getMaxId(): Long?

  /**
   * Deletes rows with `id <= rowId`. Called after a dispatch consumed (or deliberately dropped)
   * a batch: unlike metrics and logs, no per-session API reads spans back, so dispatched rows
   * are dead weight.
   */
  @Query("DELETE FROM spans WHERE id <= :rowId")
  suspend fun deleteUpTo(rowId: Long)
}
