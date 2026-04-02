package com.nanamoureux.widget

object WidgetUrls {
  fun normalizeBaseUrl(input: String): String {
    var s = input.trim()
    if (s.isBlank()) return ""

    s = s.substringBefore("?").substringBefore("#").trim()
    s = s.removeSuffix("/")

    when {
      s.endsWith("/api/poesie-widget") -> s = s.removeSuffix("/api/poesie-widget")
      s.endsWith("/poesie-widget") -> s = s.removeSuffix("/poesie-widget")
    }

    if (s.endsWith("/api")) s = s.removeSuffix("/api")

    return s.removeSuffix("/")
  }
}

