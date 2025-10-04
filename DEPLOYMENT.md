# Production Deployment Guide

This guide covers deploying the Document Scanner app to production environments.

## Prerequisites

- Node.js 16+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g @eas/cli`)
- Apple Developer Account (for iOS)
- Google Play Console Account (for Android)

## Environment Setup

### 1. Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platforms
npm run ios
npm run android
npm run web
```

### 2. Production Build

#### Using EAS Build (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g @eas/cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS**
   ```bash
   eas build:configure
   ```

4. **Build for Android**
   ```bash
   eas build --platform android
   ```

5. **Build for iOS**
   ```bash
   eas build --platform ios
   ```

6. **Build for both platforms**
   ```bash
   eas build --platform all
   ```

#### Using Expo Build (Legacy)

1. **Build for Android**
   ```bash
   expo build:android
   ```

2. **Build for iOS**
   ```bash
   expo build:ios
   ```

## Configuration

### App Configuration

Update `app.json` for production:

```json
{
  "expo": {
    "name": "Document Scanner Pro",
    "slug": "document-scanner-pro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.documentscanner",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app needs access to camera to scan documents",
        "NSPhotoLibraryUsageDescription": "This app needs access to photo library to save scanned documents"
      }
    },
    "android": {
      "package": "com.yourcompany.documentscanner",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### Environment Variables

Create `.env` file for production:

```env
# OCR Configuration
OCR_ENGINE=tesseract
OCR_TIMEOUT=60000
OCR_MAX_RETRIES=3

# Image Processing
MAX_IMAGE_WIDTH=1200
MAX_IMAGE_HEIGHT=1600
IMAGE_QUALITY=0.8
IMAGE_COMPRESSION=0.8

# Storage
MAX_DOCUMENTS=1000
MAX_FILE_SIZE=10485760
CLEANUP_INTERVAL=86400000

# Performance
ENABLE_METRICS=true
ENABLE_CACHING=true
CACHE_SIZE=52428800

# Security
ENABLE_LOGGING=true
LOG_LEVEL=error
ENABLE_CRASH_REPORTING=false
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- App.test.tsx
```

### Linting
```bash
# Check for linting errors
npm run lint

# Fix linting errors
npm run lint:fix

# Type checking
npm run type-check
```

## Performance Optimization

### 1. Image Optimization
- Use appropriate image compression settings
- Implement lazy loading for document lists
- Cache processed images

### 2. Memory Management
- Clean up OCR workers when not in use
- Limit the number of stored documents
- Implement proper error boundaries

### 3. Bundle Size Optimization
- Use dynamic imports for heavy libraries
- Remove unused dependencies
- Optimize images and assets

## Security Considerations

### 1. Data Protection
- Images are processed locally (no cloud upload)
- OCR processing happens on-device
- No personal data is transmitted

### 2. Permissions
- Request only necessary permissions
- Provide clear permission descriptions
- Handle permission denials gracefully

### 3. Code Obfuscation
- Enable code obfuscation for production builds
- Remove debug information
- Use release builds only

## Monitoring and Analytics

### 1. Error Tracking
- Implement crash reporting (Sentry, Bugsnag)
- Log errors with context
- Monitor performance metrics

### 2. User Analytics
- Track feature usage
- Monitor app performance
- Collect user feedback

## Release Process

### 1. Pre-release Checklist
- [ ] All tests passing
- [ ] No linting errors
- [ ] Type checking passes
- [ ] Performance tests pass
- [ ] Security review completed
- [ ] Documentation updated

### 2. Version Management
- Update version in `package.json`
- Update version in `app.json`
- Create git tag
- Update changelog

### 3. Release Steps
1. Create release branch
2. Run full test suite
3. Build production version
4. Test on real devices
5. Deploy to app stores
6. Monitor for issues

## App Store Deployment

### iOS App Store

1. **Prepare for Submission**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Upload to App Store Connect**
   - Use Xcode or Application Loader
   - Fill out app information
   - Add screenshots and metadata
   - Submit for review

### Google Play Store

1. **Prepare for Submission**
   ```bash
   eas build --platform android --profile production
   ```

2. **Upload to Play Console**
   - Create app listing
   - Upload APK/AAB file
   - Fill out store listing
   - Submit for review

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check dependencies
   - Verify configuration
   - Review build logs

2. **Permission Issues**
   - Update permission descriptions
   - Test on real devices
   - Check platform-specific requirements

3. **Performance Issues**
   - Profile the app
   - Optimize image processing
   - Reduce memory usage

### Support

- Check Expo documentation
- Review React Native guides
- Use community forums
- Contact support team

## Maintenance

### Regular Tasks
- Update dependencies
- Monitor app performance
- Review user feedback
- Security updates
- Bug fixes

### Monitoring
- App crashes
- Performance metrics
- User engagement
- Error rates

---

**Note**: This is a production-ready document scanner app with comprehensive error handling, testing, and deployment capabilities. Make sure to test thoroughly before releasing to app stores.