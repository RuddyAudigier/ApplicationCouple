package com.nanamoureux.widget

object WidgetUrls {
  fun normalizeBaseUrl(input: String): String {
    var s = input.trim()
    if (s.isBlank()) return ""

    // Remove query/fragment if the user pasted a full URL.
    s = s.substringBefore("?").substringBefore("#").trim()

    // Normalize trailing slashes.
    s = s.removeSuffix("/")

    // Users often paste the "widget page" route instead of the API base.
    // Accept:
    // - https://example.com
    // - https://example.com/
    // - https://example.com/poesie-widget
    // - https://example.com/api/poesie-widget
    // - https://example.com/api
    when {
      s.endsWith("/api/poesie-widget") -> s = s.removeSuffix("/api/poesie-widget")
      s.endsWith("/poesie-widget") -> s = s.removeSuffix("/poesie-widget")
    }

    if (s.endsWith("/api")) s = s.removeSuffix("/api")

    return s.removeSuffix("/")
  }
}

