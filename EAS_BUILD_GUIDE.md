# EAS Build Guide for Document Scanner

## 🚀 **EAS Configuration Complete**

Your Document Scanner project is now properly configured for EAS (Expo Application Services) builds. The `eas.json` file has been created with the following build profiles:

---

## 📱 **Build Profiles**

### **1. Development Build**
```bash
npx eas build --profile development
```
- **Purpose**: Development and testing
- **iOS**: Simulator build (Debug configuration)
- **Android**: APK file (Debug build)
- **Distribution**: Internal

### **2. Preview Build**
```bash
npx eas build --profile preview
```
- **Purpose**: Internal testing and preview
- **iOS**: Device build (Release configuration)
- **Android**: APK file (Release build)
- **Distribution**: Internal

### **3. Production Build**
```bash
npx eas build --profile production
```
- **Purpose**: App Store and Play Store submission
- **iOS**: App Store build (Release configuration)
- **Android**: App Bundle (AAB) for Play Store
- **Distribution**: App stores

---

## 🔧 **Project Configuration**

### **App Configuration (`app.json`)**
- **Bundle ID**: `com.nazelahi.docscannerpro`
- **Version**: `1.0.0`
- **Build Number**: `1` (iOS)
- **Version Code**: `1` (Android)
- **Owner**: `nazelahi`
- **Project ID**: `eca517c9-4c48-4f0e-a789-7d4e8a2bbc1b`

### **Permissions Configured**
- **Camera**: Document scanning
- **Photo Library**: Save scanned documents
- **Storage**: Read/write access
- **Media**: Access to images and videos

---

## 🛠 **Build Commands**

### **Start a Build**
```bash
# Development build
npx eas build --profile development --platform ios
npx eas build --profile development --platform android

# Preview build
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android

# Production build
npx eas build --profile production --platform ios
npx eas build --profile production --platform android

# Build for both platforms
npx eas build --profile production --platform all
```

### **Monitor Build Status**
```bash
# List all builds
npx eas build:list

# View specific build
npx eas build:view [BUILD_ID]

# Download build
npx eas build:download [BUILD_ID]
```

---

## 📋 **Pre-Build Checklist**

### **Required Setup**
- [ ] **EAS CLI Installed**: `npm install -g @expo/eas-cli`
- [ ] **Expo Account**: Logged in with `npx eas login`
- [ ] **Project Linked**: `npx eas project:init` (if needed)
- [ ] **API Keys**: Google Cloud Vision API key configured

### **Environment Variables**
Create a `.env` file in your project root:
```env
OCR_API_KEY=your_google_cloud_vision_api_key_here
```

### **Dependencies Check**
Ensure all required packages are installed:
```bash
npm install
# or
yarn install
```

---

## 🎯 **Build Process**

### **1. Development Build (Recommended First)**
```bash
# Build for Android (faster)
npx eas build --profile development --platform android

# Or build for iOS simulator
npx eas build --profile development --platform ios
```

### **2. Preview Build (Internal Testing)**
```bash
# Build for both platforms
npx eas build --profile preview --platform all
```

### **3. Production Build (App Store Ready)**
```bash
# Production build for both platforms
npx eas build --profile production --platform all
```

---

## 📱 **Platform-Specific Notes**

### **iOS Builds**
- **Simulator**: Development builds include simulator support
- **Device**: Preview and production builds are device-ready
- **App Store**: Production builds are ready for App Store submission
- **Bundle ID**: `com.nazelahi.docscannerpro`

### **Android Builds**
- **APK**: Development and preview builds generate APK files
- **AAB**: Production builds generate Android App Bundle (AAB)
- **Package Name**: `com.nazelahi.docscannerpro`
- **Play Store**: AAB files are required for Play Store submission

---

## 🔐 **API Keys Configuration**

### **Google Cloud Vision API**
1. **Get API Key**: From Google Cloud Console
2. **Set Environment Variable**: `OCR_API_KEY=your_key_here`
3. **Test**: Verify OCR functionality works

### **Optional: Additional OCR Providers**
- **AWS Textract**: Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- **Azure Computer Vision**: Set `AZURE_VISION_KEY` and `AZURE_VISION_ENDPOINT`

---

## 🚀 **Deployment Options**

### **Internal Distribution**
- **Development**: For team testing
- **Preview**: For beta testing
- **Distribution**: Via EAS internal distribution

### **App Store Distribution**
- **iOS**: Submit to App Store Connect
- **Android**: Upload AAB to Google Play Console

### **Direct Installation**
- **APK**: Install directly on Android devices
- **IPA**: Install via TestFlight or direct installation

---

## 📊 **Build Monitoring**

### **EAS Dashboard**
- **URL**: https://expo.dev/accounts/nazelahi/projects/docscannerpro
- **Features**: Build history, logs, downloads
- **Status**: Real-time build progress

### **Build Logs**
```bash
# View build logs
npx eas build:view [BUILD_ID]

# Follow build progress
npx eas build:view [BUILD_ID] --follow
```

---

## 🛠 **Troubleshooting**

### **Common Issues**
1. **Build Fails**: Check build logs for specific errors
2. **API Key Missing**: Ensure environment variables are set
3. **Permissions**: Verify all required permissions are in `app.json`
4. **Dependencies**: Run `npm install` to ensure all packages are installed

### **Build Optimization**
- **Clean Build**: Use `--clear-cache` flag if needed
- **Local Build**: Use `--local` flag for faster iteration
- **Incremental**: EAS automatically handles incremental builds

---

## 📈 **Next Steps**

### **Immediate Actions**
1. **Test Development Build**: Start with development build
2. **Verify Features**: Test camera, OCR, and document scanning
3. **API Integration**: Ensure Google Cloud Vision works
4. **Performance**: Test on real devices

### **Production Preparation**
1. **App Store Assets**: Prepare screenshots and descriptions
2. **Privacy Policy**: Required for app stores
3. **Terms of Service**: If applicable
4. **App Store Optimization**: Keywords and metadata

---

## 🎉 **Ready to Build!**

Your Document Scanner is now fully configured for EAS builds with:
- ✅ **Real Implementations**: All simulation methods replaced
- ✅ **Production Ready**: Real OCR and ML algorithms
- ✅ **EAS Configured**: All build profiles set up
- ✅ **App Store Ready**: Proper bundle IDs and permissions

**Start building with:**
```bash
npx eas build --profile development --platform android
```

---

*Generated for Document Scanner v1.0.0*
*EAS Configuration Complete ✅*
