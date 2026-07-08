// Mistral OCR (and other Markdown-emitting OCR models) can misread generic/
// template angle-bracket syntax as an HTML-like tag and echo a matching
// closing tag right after it, e.g. "#include <iostream>" comes back as
// "#include <iostream></iostream>". Only the exact, adjacent self-echo case
// is fixed here: it's unambiguous (the closing tag repeats the opening tag's
// own name with nothing in between) and safe to strip.
//
// A worse variant is NOT handled here: the model can hallucinate a tag name
// unrelated to the source (e.g. "</victor>" appearing near a "vector<...>"
// construct, sometimes fused with other garbled fragments). That isn't a
// wrapper around otherwise-correct text — the underlying transcription
// itself is wrong — so there is no safe regex fix; guessing what the correct
// text "should" be would silently fabricate content, which is worse than
// leaving the artifact visible for a human to spot.
const SELF_CLOSING_TAG_ECHO = /<(\w+)><\/\1>/g;

const HTML_ENTITIES = { "&gt;": ">", "&lt;": "<", "&amp;": "&", "&quot;": '"', "&#39;": "'" };
const HTML_ENTITY_PATTERN = /&(gt|lt|amp|quot|#39);/g;

export function cleanOcrText(text) {
  return text.replace(HTML_ENTITY_PATTERN, (match) => HTML_ENTITIES[match]).replace(SELF_CLOSING_TAG_ECHO, "<$1>");
}
