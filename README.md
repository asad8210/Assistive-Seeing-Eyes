# Assistive SeeingEyes 👁️‍🗨️🔊
Deployment Link: [Assistive-SeeingEyes](https://assistive-seeing-eyes.vercel.app/)

**Assistive SeeingEyes** is an innovative application designed to empower visually impaired individuals by providing real-time auditory feedback about their surroundings and a voice-activated personal assistant. Built with modern web technologies and powered by AI, it aims to enhance independence, safety, and reduce the daily challenges faced by visually impaired people.

## 🌟 SeeingEyes

To create an intuitive, reliable, and accessible digital companion that bridges the visual gap for users, fostering greater confidence, interaction with the world, and ultimately working to **reduce the hardness of life for those who are visually impaired.**

## ✨ Core Features & Process Explanation

The application revolves around a few key user interactions and AI-driven processes:

1.  **Auditory Welcome**:
    *   **Process**: Upon loading the application (specifically the home page), a pre-defined welcome message is synthesized into speech and played automatically.
    *   **Goal**: Provides immediate auditory feedback, confirming the app is active and ready.

2.  **Real-time Object & Scene Description**:
    *   **Activation**: User performs a **double-tap** gesture on the main screen.
    *   **Process**:
        1.  The application requests access to the device's camera.
        2.  Once permission is granted, the camera feed starts.
        3.  Periodically (e.g., every few seconds), a frame is captured from the video stream.
        4.  This image frame is converted into a base64 encoded data URI.
        5.  The data URI is sent via an HTTP POST request to the deployed Genkit backend, specifically to the `describeDetailedSceneFlow` endpoint (e.g., `https://assistive-api.vercel.app/api/assistive/describe-detailed-scene`).
        6.  The `describeDetailedSceneFlow` (an AI flow) processes the image using a multimodal AI model (like Gemini) to generate a textual description of the scene, objects, and their spatial relationships. It can optionally consider the previous description to provide a more continuous narrative.
        7.  The AI-generated text description is returned to the frontend.
        8.  The frontend uses the device's Text-to-Speech (TTS) capabilities to speak the description aloud.
    *   **Deactivation**: User performs another **double-tap**. This stops the camera feed, halts periodic frame capture, and silences further descriptions.
    *   **Goal**: Offers continuous, real-time awareness of the visual environment.

3.  **Voice-Activated Personal Assistant**:
    *   **Activation**: User performs a **tap-and-hold** (long press) gesture on the main screen.
    *   **Process**:
        1.  The application requests access to the device's microphone.
        2.  Once permission is granted, speech recognition (Speech-to-Text, STT) is initiated. The app listens for user voice input.
        3.  As the user speaks, their speech is transcribed into text in real-time (or upon pause).
        4.  The transcribed text, along with optional location data (if permission is granted and the feature is enabled), is sent via an HTTP POST request to the `personalAssistantFlow` endpoint on the Genkit backend (e.g., `https://assistive-api.vercel.app/api/assistive/personal-assistant`).
        5.  The `personalAssistantFlow` processes the text using a large language model (LLM). It can perform various tasks like answering questions, providing information, or engaging in conversation. Location data can be used to provide contextually relevant responses (e.g., "What's the weather like here?").
        6.  The AI-generated textual response is returned to the frontend.
        7.  The frontend uses TTS to speak the assistant's response aloud.
        8.  The assistant typically continues to listen for follow-up commands or questions until explicitly deactivated.
    *   **Deactivation**: User performs another **tap-and-hold**. This stops microphone input and deactivates the assistant mode.
    *   **Goal**: Provides hands-free access to information and assistance through natural language.

4.  **Content Relevance Tool (Internal AI Flow)**:
    *   **Process**: This is not a user-facing feature directly but an AI capability used by other flows or potentially for future features.
    *   The `contentRelevanceFlow` takes a user query (or topic) and a piece of content (e.g., text from a webpage, a document snippet) as input. It would be invoked via its Genkit endpoint (e.g., `https://assistive-api.vercel.app/api/assistive/content-relevance`).
    *   It uses an LLM to evaluate how relevant the provided content is to the query.
    *   **Output**: Returns a boolean indicating relevance and a reason for the determination.
    *   **Goal**: Enables the system to filter or prioritize information, ensuring that what's presented to the user (e.g., in assistant responses or search results) is pertinent and useful.

5.  **Intuitive Gesture Navigation**:
    *   **Double Tap**: Toggles the Real-time Object/Scene Description.
    *   **Tap and Hold**: Toggles the Voice-Activated Personal Assistant.
    *   *(Future gestures could be added for more functionalities, like swipe gestures for specific commands).*

6.  **Responsive Design**:
    *   The UI is built to adapt to various screen sizes, ensuring usability on both desktop and mobile devices (especially when deployed as a web app or via Capacitor).

## 🏗️ Architecture Overview

Assistive SeeingEyes employs a client-server architecture:

*   **Frontend (Client)**:
    *   Built with Next.js (React) and TypeScript.
    *   Handles user interface, gesture detection, and interaction logic.
    *   Manages device hardware access (camera, microphone) via browser APIs or Capacitor plugins.
    *   Communicates with the Genkit backend via HTTP API calls.
    *   Uses ShadCN UI for components and Tailwind CSS for styling.
*   **Backend (Genkit Flows)**:
    *   Developed using Genkit (TypeScript).
    *   Hosts the AI-powered flows (`describeDetailedSceneFlow`, `personalAssistantFlow`, `contentRelevanceFlow`).
    *   These flows orchestrate calls to underlying AI models (e.g., Google's Gemini for multimodal and language tasks).
    *   Exposed as HTTP endpoints, typically deployed on a serverless platform (like Vercel, Google Cloud Run).
    *   The project's Genkit flows are assumed to be deployed and accessible at a base URL like `https://assistive-api.vercel.app/api/assistive`.

**Data Flow Example (Scene Description):**
`User Double Taps -> Frontend Captures Frame -> Frontend sends Image to Genkit API (e.g., /describe-detailed-scene) -> Genkit 'describeDetailedSceneFlow' processes with AI Model -> Genkit returns Text -> Frontend speaks Text`

## 🚀 Tech Stack

*   **Frontend**:
    *   [Next.js](https://nextjs.org/): React framework. Chosen for its robust features like server components, efficient client-side navigation, and ease of building production-ready applications.
    *   [React](https://reactjs.org/): JavaScript library. The standard for building dynamic UIs with a component-based architecture.
    *   [TypeScript](https://www.typescriptlang.org/): Superset of JavaScript. Adds static typing for improved code quality, maintainability, and developer experience.
*   **UI Components & Styling**:
    *   [ShadCN UI](https://ui.shadcn.com/): Pre-built, accessible components. Speeds up development and ensures a consistent, modern look and feel.
    *   [Tailwind CSS](https://tailwindcss.com/): Utility-first CSS framework. Allows for rapid styling directly in the markup, promoting consistency and reducing custom CSS.
    *   [Lucide React](https://lucide.dev/): Clean and clear open-source icons.
*   **Artificial Intelligence (AI)**:
    *   [Genkit (by Google)](https://firebase.google.com/docs/genkit): An open-source framework. Simplifies building, deploying, and managing AI-powered application features. Provides tools for defining flows, prompts, and integrating with models.
    *   **AI Models**: Underlying models like Google Gemini are leveraged by Genkit for their advanced capabilities in image understanding and natural language processing.
*   **Mobile Deployment (Cross-Platform)**:
    *   [Capacitor](https://capacitorjs.com/): Native runtime. Enables deploying the web application as a native mobile app (iOS, Android) with access to native device features, offering a path to app stores.
*   **Styling Philosophy**:
    *   Adherence to specific color guidelines (e.g., calming blue `#4A8FE7`, neutral gray `#808080`, gentle green `#68B984`) to ensure high contrast, readability, and a user-friendly experience, particularly important for accessibility.

## 📂 Project Structure

Here's an overview of the key directories and files in the project:

```
.
├── ai/                     # Genkit AI flows and configuration
│   ├── flows/              # Individual AI flow implementations
│   │   ├── describe-detailed-scene-flow.ts
│   │   ├── personal-assistant.ts
│   │   └── content-relevance.ts
│   ├── genkit.ts           # Genkit initialization and core AI setup
│   └── dev.ts              # Genkit development server configuration
├── app/                    # Next.js App Router directory
│   ├── api/                # API routes, including Genkit flow endpoints
│   │   └── assistive/
│   │       └── [...flow]/
│   │           └── route.ts
│   ├── (main)/             # Main application routes and layout
│   │   ├── layout.tsx      # Root layout for the main app
│   │   └── page.tsx        # Home page component
│   ├── globals.css         # Global styles and Tailwind CSS base
│   └── layout.tsx          # Root layout for the entire application
├── components/             # Reusable React components
│   ├── ui/                 # ShadCN UI components (e.g., button, toast)
│   └── assistive-home.tsx  # Main interactive component for the app
├── hooks/                  # Custom React hooks
│   ├── useAssistiveLogic.tsx # Core logic for assistive features (Web specific parts)
│   └── useToast.ts         # Hook for displaying toast notifications
├── libs/                   # Utility functions and libraries
│   ├── speech.ts           # Text-to-Speech and Speech-to-Text utilities
│   └── utils.ts            # General utility functions
├── public/                 # Static assets (images, fonts, etc.)
│   └── favicon.ico
├── android/                # Capacitor Android native project (generated)
├── ios/                    # Capacitor iOS native project (generated, if platform added)
├── .env.local              # Local environment variables (API keys, etc.) - DO NOT COMMIT
├── .eslintrc.json          # ESLint configuration
├── .gitignore              # Files and directories to ignore for Git
├── capacitor.config.ts     # Capacitor project configuration
├── next.config.js          # Next.js configuration (or .mjs / .ts)
├── package.json            # Project dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration (for Tailwind CSS)
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

*   **`ai/`**: Contains all Genkit related code.
    *   `flows/`: Specific AI functionalities are defined here as Genkit flows.
    *   `genkit.ts`: Initializes and configures Genkit, plugins, and models.
    *   `dev.ts`: Used for running Genkit flows locally during development.
*   **`app/`**: The heart of the Next.js application, using the App Router.
    *   `api/assistive/[...flow]/route.ts`: Exposes Genkit flows as API endpoints.
    *   `(main)/page.tsx`: The main landing page of the application.
    *   `globals.css`: Global styles, including Tailwind CSS directives and theme customizations.
    *   `layout.tsx`: Defines the root HTML structure for pages.
*   **`components/`**: Contains all React components.
    *   `ui/`: Houses the ShadCN UI components.
    *   `assistive-home.tsx`: The primary component orchestrating the assistive features.
*   **`hooks/`**: Custom React Hooks for managing stateful logic and side effects.
    *   `useAssistiveLogic.tsx`: Contains the core logic for camera, microphone, AI interactions, and gesture handling, primarily for the web. It might need adaptation or be complemented by native modules for Capacitor.
*   **`libs/`**: Helper modules and utility functions.
    *   `speech.ts`: Wrappers for browser Web Speech API (TTS/STT).
*   **`public/`**: Stores static files served directly by the web server.
*   **`android/` & `ios/`**: Native project folders generated by Capacitor when you add these platforms.
*   **Configuration Files**:
    *   `.env.local`: For storing environment-specific variables like API keys. **Crucially, this file should be in `.gitignore` and not committed to version control.**
    *   `capacitor.config.ts`: Configuration for your Capacitor project (app ID, name, web directory).
    *   `next.config.js` (or `.mjs`): Next.js specific configurations, including `output: 'export'` for Capacitor.
    *   `package.json`: Lists project dependencies, scripts (like `dev`, `build`, `start`).
    *   `tailwind.config.ts`: Configuration for Tailwind CSS.
    *   `tsconfig.json`: TypeScript compiler options.

## 🛠️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 18.x or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) (comes with Node.js)
*   Git

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/asad8210/Assistive-Seeing-Eyes.git
    cd Assistive-Seeing-Eyes
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up Environment Variables**:
    Create a `.env.local` file in the root of your project. This file is crucial for configuring API endpoints and other sensitive information.
    ```env
    # .env.local

    # This is the base URL for your deployed Genkit AI flows.
    # The application is configured to use this for making API calls.
    # Example: NEXT_PUBLIC_GENKIT_API_BASE_URL=https://your-genkit-api-deployment.vercel.app/api/assistive
    # For this project, the example backend is:
    NEXT_PUBLIC_GENKIT_API_BASE_URL=https://assistive-api.vercel.app/api/assistive

    # Add any other environment variables required by your Genkit flows
    # or other services (e.g., API keys for Google AI Studio if Genkit uses them directly).
    # Example: GOOGLE_API_KEY=YOUR_GOOGLE_AI_STUDIO_API_KEY
    ```
    *   **Important**: The application's frontend logic (e.g., in `hooks/useAssistiveLogic.tsx` or API call utilities) will use `process.env.NEXT_PUBLIC_GENKIT_API_BASE_URL` to connect to the backend. Ensure this is set correctly if you deploy your own backend.

### Running the Development Server (Web)

To run the Next.js development server for web-based testing:
```bash
npm run dev
# or
# yarn dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production (Web)

To build the Next.js application for a web production deployment:
```bash
npm run build
# or
# yarn build
```
This will create an optimized build in the `.next` folder (or `out` folder if `output: 'export'` is set for static sites). To run the production build locally (if not a static export):
```bash
npm run start
# or
# yarn start
```

## 📱 Mobile App Development with Capacitor

Capacitor allows you to take your web application and build native mobile apps for Android and iOS.

### 1. Initial Capacitor Setup (if not already done in the project)

*   Install Capacitor CLI globally (optional, but can be helpful):
    ```bash
    npm install -g @capacitor/cli
    ```
*   Initialize Capacitor in your project (answer prompts as needed):
    ```bash
    npx cap init "Assistive SeeingEyes" "com.assistiveseeingeyes.app"
    ```
    (Replace `"com.assistiveseeingeyes.app"` with your desired app ID)
*   Install necessary Capacitor platforms:
    ```bash
    npm install @capacitor/android @capacitor/ios
    # or
    # yarn add @capacitor/android @capacitor/ios

    npx cap add android
    npx cap add ios # (Requires macOS and Xcode)
    ```

### 2. Configure `next.config.js` (or `next.config.mjs`) for Static Export

For Capacitor to work correctly with Next.js, your app needs to be statically exported. Ensure your Next.js configuration includes `output: 'export'`:

```javascript
// next.config.js or next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Critical for Capacitor: generates static HTML/CSS/JS
  // Required for static export if using next/image for external URLs in a static site
  images: {
    unoptimized: true,
  },
  // If you encounter build errors related to TypeScript or ESLint with Genkit or other dependencies:
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
  // ... other configurations
};

module.exports = nextConfig;
```

### 3. Build Your Next.js App for Static Export

```bash
npm run build
# or
# yarn build
```
This command (with `output: 'export'` in Next.js config) will generate the static assets in the `out` directory.

### 4. Sync with Capacitor

Sync your web build (from the `out` directory) into your native Capacitor projects:
```bash
npx cap sync
```
This command copies the web assets and updates native project configurations.

### 5. Open Native IDE

*   **For Android**:
    ```bash
    npx cap open android
    ```
    This opens your project in Android Studio. From there, you can:
    *   Build the APK or App Bundle.
    *   Run on an emulator or a physical device.
    *   Configure native permissions in `android/app/src/main/AndroidManifest.xml`.
    *   Add any necessary Capacitor plugins or custom native code.

*   **For iOS** (requires macOS and Xcode):
    ```bash
    npx cap open ios
    ```
    This opens your project in Xcode. From there, you can:
    *   Build and run on an emulator or physical device.
    *   Configure native permissions in `ios/App/App/Info.plist`.
    *   Manage signing and capabilities.

### Important Considerations for Mobile:

*   **Permissions**:
    *   **Android**: You *must* declare permissions for `CAMERA`, `RECORD_AUDIO`, and `INTERNET` (and potentially `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` if using location features) in `android/app/src/main/AndroidManifest.xml`. The frontend will also need to request these permissions at runtime using Capacitor APIs or web APIs where appropriate.
        ```xml
        <!-- Example in android/app/src/main/AndroidManifest.xml -->
        <uses-permission android:name="android.permission.INTERNET" />
        <uses-permission android:name="android.permission.CAMERA" />
        <uses-permission android:name="android.permission.RECORD_AUDIO" />
        <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" /> <!-- Often needed for speech synthesis/recognition control -->
        <!-- For location (optional) -->
        <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
        <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
        ```
    *   **iOS**: Add keys like `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, (and `NSLocationWhenInUseUsageDescription` or `NSLocationAlwaysUsageDescription`) to `ios/App/App/Info.plist` with user-facing reasons for requesting these permissions.
*   **Native APIs vs. Web APIs**:
    *   For features like Text-to-Speech (TTS) and Speech-to-Text (STT), using Capacitor plugins can offer better performance, reliability, and background capabilities compared to relying solely on web APIs (which can be inconsistent across mobile web views).
    *   Consider plugins like:
        *   `@capacitor/text-to-speech`
        *   `@capacitor-community/speech-recognition` (or other community voice recognition plugins)
        *   `@capacitor/camera` (for more control over the camera if needed beyond basic media stream)
        *   `@capacitor/geolocation`
    *   The application's core logic (e.g., `AssistiveHomeLogicAdapter.tsx` or a similar hook) might need adaptation to use Capacitor plugin APIs when running in a native context, while falling back to Web APIs for web browsers.
*   **API Calls & CORS**: Ensure your deployed Genkit API backend is accessible from the mobile device. If your API is hosted on a different domain, you might need to configure CORS (Cross-Origin Resource Sharing) on your backend to allow requests from `capacitor://localhost` and `http://localhost` (common origins for Capacitor apps).
*   **Offline Support**: Consider strategies for offline functionality if needed (e.g., caching, storing essential data locally).

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

## 📜 License

This project is currently unlicensed and in the public domain by default. You are free to use, modify, and distribute the code as you see fit.

If you wish to formally license it, the [MIT License](https://opensource.org/licenses/MIT) or [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) are good choices for open-source projects.

**To formally add a license:**
1.  Choose a license (e.g., MIT).
2.  Create a `LICENSE` file in the root of your project.
3.  Copy the text of your chosen license into this file.
4.  Update this section in the README to reflect your chosen license and link to the `LICENSE` file.

## 📧 Contact

Asad/IIT-BHU Intern-Project - beingasad47@gmail.com

Project Link: [GitHub](https://github.com/asad8210/Assistive-Seeing-Eyes)

## 🙏 Acknowledgements

*   Prof. Sanjay Kumar Singh Sir (IIT BHU) and Ankita Chand Ma'am (Phd. Scholar IIT BHU) who helped and inspired me for this project during my internship. Their guidance was invaluable.
*   This project aims to leverage technology to be particularly helpful for visually impaired individuals by providing tools that can enhance their interaction with the world. (If you have specific links to resources that were helpful in understanding the needs or existing solutions, you can add them here.)
*   Shoutout to the open-source community for the tools and libraries that make projects like this possible.

---

This README provides a solid foundation for your open-source project. Good luck with Assistive SeeingEyes!
