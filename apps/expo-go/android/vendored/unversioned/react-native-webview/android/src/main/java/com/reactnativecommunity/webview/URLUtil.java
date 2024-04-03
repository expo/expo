/*
 * Copyright (C) 2006 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * The source code is obtained from the Android SDK Sources (API level 31),
 * and modified by UNIDY2002 <UNIDY2002@outlook.com>.
 *
 * Change list:
 * - Remove all unused class members except guessFileName,
 *   CONTENT_DISPOSITION_PATTERN and parseContentDisposition
 * - Improve CONTENT_DISPOSITION_PATTERN and parseContentDisposition to add
 *   support for the "filename*" parameter in content disposition
 */

package com.reactnativecommunity.webview;

import android.net.Uri;
import android.webkit.MimeTypeMap;
import androidx.annotation.Nullable;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class URLUtil {
    /**
     * Guesses canonical filename that a download would have, using
     * the URL and contentDisposition. File extension, if not defined,
     * is added based on the mimetype
     * @param url Url to the content
     * @param contentDisposition Content-Disposition HTTP header or {@code null}
     * @param mimeType Mime-type of the content or {@code null}
     *
     * @return suggested filename
     */
    public static final String guessFileName(
            String url,
            @Nullable String contentDisposition,
            @Nullable String mimeType) {
        String filename = null;
        String extension = null;

        // If we couldn't do anything with the hint, move toward the content disposition
        if (filename == null && contentDisposition != null) {
            filename = parseContentDisposition(contentDisposition);
            if (filename != null) {
                int index = filename.lastIndexOf('/') + 1;
                if (index > 0) {
                    filename = filename.substring(index);
                }
            }
        }

        // If all the other http-related approaches failed, use the plain uri
        if (filename == null) {
            String decodedUrl = Uri.decode(url);
            if (decodedUrl != null) {
                int queryIndex = decodedUrl.indexOf('?');
                // If there is a query string strip it, same as desktop browsers
                if (queryIndex > 0) {
                    decodedUrl = decodedUrl.substring(0, queryIndex);
                }
                if (!decodedUrl.endsWith("/")) {
                    int index = decodedUrl.lastIndexOf('/') + 1;
                    if (index > 0) {
                        filename = decodedUrl.substring(index);
                    }
                }
            }
        }

        // Finally, if couldn't get filename from URI, get a generic filename
        if (filename == null) {
            filename = "downloadfile";
        }

        // Split filename between base and extension
        // Add an extension if filename does not have one
        int dotIndex = filename.indexOf('.');
        if (dotIndex < 0) {
            if (mimeType != null) {
                extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType);
                if (extension != null) {
                    extension = "." + extension;
                }
            }
            if (extension == null) {
                if (mimeType != null && mimeType.toLowerCase(Locale.ROOT).startsWith("text/")) {
                    if (mimeType.equalsIgnoreCase("text/html")) {
                        extension = ".html";
                    } else {
                        extension = ".txt";
                    }
                } else {
                    extension = ".bin";
                }
            }
        } else {
            if (mimeType != null) {
                // Compare the last segment of the extension against the mime type.
                // If there's a mismatch, discard the entire extension.
                int lastDotIndex = filename.lastIndexOf('.');
                String typeFromExt = MimeTypeMap.getSingleton().getMimeTypeFromExtension(
                        filename.substring(lastDotIndex + 1));
                if (typeFromExt != null && !typeFromExt.equalsIgnoreCase(mimeType)) {
                    extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType);
                    if (extension != null) {
                        extension = "." + extension;
                    }
                }
            }
            if (extension == null) {
                extension = filename.substring(dotIndex);
            }
            filename = filename.substring(0, dotIndex);
        }

        return filename + extension;
    }

    /** Regex used to parse content-disposition headers */
    private static final Pattern CONTENT_DISPOSITION_PATTERN =
            Pattern.compile("attachment(?:;\\s*filename\\s*=\\s*(\"?)([^\"]*)\\1)?(?:;\\s*filename\\s*\\*\\s*=\\s*([^']*)'[^']*'([^']*))?\\s*$",
            Pattern.CASE_INSENSITIVE);

    /**
     * Parse the Content-Disposition HTTP Header. The format of the header
     * is defined here: <a href="https://www.rfc-editor.org/rfc/rfc6266">RFC 6266</a>
     * This header provides a filename for content that is going to be
     * downloaded to the file system. We only support the attachment type.
     */
    static String parseContentDisposition(String contentDisposition) {
        try {
            // The regex attempts to match the following pattern:
            //     attachment; filename="(Group 2)"; filename*=(Group 3)'(lang)'(Group 4)
            // Group 4 refers to the percent-encoded filename, and the charset
            // is specified in Group 3.
            // Group 2 is the fallback filename.
            // Group 1 refers to the quotation marks around Group 2.
            //
            // Test cases can be found at http://test.greenbytes.de/tech/tc2231/
            // Examples can be found at https://www.rfc-editor.org/rfc/rfc6266#section-5
            // There are a few known limitations:
            // - any Content Disposition value that does not have parameters
            //   arranged in the order of "attachment...filename...filename*"
            //   or contains extra parameters shall fail to be parsed
            // - any filename that contains " shall fail to be parsed
            Matcher m = CONTENT_DISPOSITION_PATTERN.matcher(contentDisposition);
            if (m.find()) {
                if (m.group(3) != null && m.group(4) != null) {
                    try {
                        return URLDecoder.decode(m.group(4), m.group(3).isEmpty() ? "UTF-8" : m.group(3));
                    } catch (UnsupportedEncodingException e) {
                        // Skip the ext-parameter as the encoding is unsupported
                    }
                }
                return m.group(2);
            }
        } catch (IllegalStateException ex) {
             // This function is defined as returning null when it can't parse the header
        }
        return null;
    }
}
