plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

android {
  namespace = "com.nanamoureux.widget"
  compileSdk = 35

  defaultConfig {
    // Même applicationId que l'ancien prototype "widget" -> une seule app sur le téléphone (mise à jour au lieu d'installer une 2e).
    applicationId = "com.nanamoureux.widget"
    minSdk = 26
    targetSdk = 35
    versionCode = 1
    versionName = "1.0"

    // URL par défaut de l’app web (modifiable dans l’écran Réglages)
    buildConfigField("String", "DEFAULT_APP_URL", "\"https://application-couple.vercel.app\"")
  }

  buildTypes {
    release {
      isMinifyEnabled = false
    }
  }

  buildFeatures {
    buildConfig = true
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.13.1")
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("com.google.android.material:material:1.12.0")
  implementation("androidx.work:work-runtime-ktx:2.9.1")
}
