import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.assistive.seeingeyes',   // unique bundle ID
  appName: 'Seeing-Eyes',              // name on device
  webDir: 'out',                       // static export folder
  server: {
    androidScheme: 'https'             // allows secure requests from WebView
  }
};

export default config;
