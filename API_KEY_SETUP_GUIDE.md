# Google Cloud Vision API Key Setup Guide

## 🔑 **Step-by-Step API Key Configuration**

### **Step 1: Get Google Cloud Vision API Key**

#### **1.1 Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `Document Scanner OCR`
4. Click "Create"

#### **1.2 Enable Vision API**
1. In the project dashboard, go to "APIs & Services" → "Library"
2. Search for "Cloud Vision API"
3. Click on "Cloud Vision API"
4. Click "Enable"

#### **1.3 Create API Key**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key (starts with `AIza...`)
4. **Important**: Click "Restrict Key" and add restrictions:
   - **API restrictions**: Select "Cloud Vision API"
   - **Application restrictions**: Choose appropriate option

### **Step 2: Configure API Key in Your App**

#### **2.1 Create Environment File**
Create a `.env` file in your project root:

```bash
# Create .env file
touch .env
```

#### **2.2 Add API Key to .env File**
```env
# Google Cloud Vision API Key
OCR_API_KEY=AIzaSyYour_Actual_API_Key_Here

# Optional: Other configurations
APP_ENV=production
DEBUG_MODE=false
```

#### **2.3 Update .gitignore**
Make sure `.env` is in your `.gitignore`:
```gitignore
# Environment variables
.env
.env.local
.env.production
```

### **Step 3: Update App Configuration**

#### **3.1 Install Environment Variables Package**
```bash
npm install react-native-dotenv
# or
yarn add react-native-dotenv
```

#### **3.2 Update babel.config.js**
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
```

#### **3.3 Update TypeScript Types**
Create `types/env.d.ts`:
```typescript
declare module '@env' {
  export const OCR_API_KEY: string;
  export const APP_ENV: string;
  export const DEBUG_MODE: string;
}
```

### **Step 4: Update OCR Configuration**

#### **4.1 Update OCR Engine Creation**
In your OCR files, update the API key usage:

```typescript
import { OCR_API_KEY } from '@env';

// In your OCR engine creation
const engine = createAdvancedOCREngine({
  provider: 'google',
  apiKey: OCR_API_KEY || 'YOUR_GOOGLE_VISION_API_KEY'
});
```

#### **4.2 Update All OCR Instances**
Update these files to use the environment variable:
- `components/AdvancedOCRPreview.tsx`
- `utils/ocr.ts`
- `utils/advancedOCR.ts`

### **Step 5: Test Configuration**

#### **5.1 Verify API Key Loading**
Add this to your app to test:
```typescript
import { OCR_API_KEY } from '@env';

console.log('API Key loaded:', OCR_API_KEY ? 'Yes' : 'No');
console.log('API Key length:', OCR_API_KEY?.length || 0);
```

#### **5.2 Test OCR Functionality**
1. Start your app: `npx expo start`
2. Open camera screen
3. Scan a document
4. Check console for OCR results

### **Step 6: Production Deployment**

#### **6.1 EAS Build Configuration**
For EAS builds, add environment variables:

```bash
# Set environment variable for EAS
npx eas secret:create --scope project --name OCR_API_KEY --value "your_api_key_here"
```

#### **6.2 App Store Configuration**
- **iOS**: Add API key to Info.plist or use secure storage
- **Android**: Add to build.gradle or use secure storage

### **Step 7: Security Best Practices**

#### **7.1 API Key Restrictions**
1. **Restrict by API**: Only allow Cloud Vision API
2. **Restrict by IP**: Add your server IPs
3. **Restrict by App**: Add your app bundle ID
4. **Set Quotas**: Limit daily usage

#### **7.2 Environment Security**
- Never commit `.env` files to git
- Use different keys for development/production
- Rotate keys regularly
- Monitor usage in Google Cloud Console

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Issue 1: API Key Not Loading**
```bash
# Check if .env file exists
ls -la .env

# Check if babel config is correct
cat babel.config.js
```

#### **Issue 2: OCR Not Working**
```bash
# Check API key format
echo $OCR_API_KEY

# Test API key with curl
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  https://vision.googleapis.com/v1/images:annotate
```

#### **Issue 3: Build Errors**
```bash
# Clear cache and rebuild
npx expo start --clear
rm -rf node_modules
npm install
```

### **Verification Commands**

```bash
# Check environment variables
npx expo start --clear

# Test OCR functionality
# Open app → Camera → Scan document → Check console

# Verify API key in logs
# Look for "API Key loaded: Yes" in console
```

---

## 📋 **Quick Setup Checklist**

- [ ] **Google Cloud Project Created**
- [ ] **Vision API Enabled**
- [ ] **API Key Generated**
- [ ] **API Key Restricted**
- [ ] **`.env` File Created**
- [ ] **API Key Added to `.env`**
- [ ] **`react-native-dotenv` Installed**
- [ ] **`babel.config.js` Updated**
- [ ] **TypeScript Types Created**
- [ ] **OCR Files Updated**
- [ ] **App Tested**
- [ ] **Environment Variables Secured**

---

## 🎯 **Next Steps**

1. **Follow the steps above** to set up your API key
2. **Test the OCR functionality** with a real document
3. **Deploy to production** using EAS builds
4. **Monitor usage** in Google Cloud Console

---

*Your Document Scanner will have full OCR capabilities once the API key is configured! 🚀*
