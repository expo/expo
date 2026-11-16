# Renders the Claude Code stream-json transcript into a readable Actions log.
#
# The log is the thing a maintainer opens from the announce comment, so it has
# to read like a narrative, not a dump. Rules learned from the first real run:
#   - Never print raw JSON wrappers ([{"type":"text",...}]).
#   - Never print a tool's bulk payload: file contents, comment bodies, and
#     especially screenshot base64, which drowned everything around it.
#   - Print only the FIRST line of a tool result. Boilerplate the agent needs
#     (session ids, channel names, working directory, next-step advice) lives
#     on later lines and belongs in the agent's context, not in a human log.
#   - Keep session ids out entirely: they identify a sandbox that is destroyed
#     minutes later and mean nothing to a reader.
#
# Usage: jq -rf .github/verify/render.jq   (fed the stream on stdin)

def clip($n): if (. | length) > $n then .[0:$n] + "…" else . end;
def oneline: gsub("\\s+"; " ") | sub("^ +"; "") | sub(" +$"; "");

# Text out of a tool_result's content, which may be a string or a block array.
# Image and other non-text blocks are dropped, not stringified.
def result_text:
  if (.content | type) == "array"
  then [.content[]? | select(.type == "text") | .text] | join(" ")
  elif (.content | type) == "string" then .content
  else "" end;

# A tool call's arguments, reduced to the few keys that say what is happening.
# Anything not listed here is omitted by design — that is what keeps file
# contents, comment bodies, and evidence blobs out of the log.
def call_args:
  . as $in
  | [ "mode", "simulatorPlatform", "command", "path", "packages", "project",
      "repo", "issueNumber", "platform", "profile", "buildId", "runId",
      "target", "action", "launches", "settleSeconds", "waitSeconds",
      "appName", "projectSlug", "oldString" ]
  | map(
      . as $k
      | if ($in | has($k))
        then "\($k)=\(($in[$k] | tostring | oneline | clip(90)))"
        else empty end
    )
  | join(" ");

if .type == "system" and .subtype == "init" then
  "▶ agent session started — model \(.model // "?")"

elif .type == "assistant" then
  ( .message.content[]?
    | if .type == "text" and ((.text // "") | gsub("\\s"; "") | length) > 0
      then "\n\(.text)\n"
      elif .type == "tool_use"
      then "  → \(.name | sub("^mcp__sandbox__"; "")) \((.input // {}) | call_args)"
      else empty end )

elif .type == "user" then
  ( .message.content[]?
    | select(.type == "tool_result")
    | (result_text) as $t
    | if .is_error == true
      then "    ✗ \($t | oneline | clip(300))"
      else
        ( $t | split("\n") | map(select(length > 0)) | first // "" ) as $head
        | if ($head | length) == 0 then empty
          else "    ← \($head | oneline | clip(150))" end
      end )

elif .type == "result" then
  "\n────────────────────────────────────────\n" +
  "✔ finished in \(((.duration_ms // 0) / 1000) | floor)s over \(.num_turns // "?") turns\n" +
  "────────────────────────────────────────\n\n" +
  "\(.result // "(no final message)")"

else empty end
