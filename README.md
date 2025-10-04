# Document Scanner App

A powerful React Native Expo document scanner app with advanced image processing capabilities, built with TypeScript and modern UI components.

## Features

### 🔍 Document Detection
- **Automatic Edge Detection**: Automatically recognizes document boundaries even on busy backgrounds
- **Real-time Preview**: Live camera feed with document outline overlay
- **Smart Cropping**: Precisely crops out background, leaving only the document

### 📐 Perspective Correction
- **Dewarping**: Corrects skew and distortion from angled shots
- **Auto-straightening**: Makes documents look like they were scanned on a flatbed scanner
- **Corner Detection**: Identifies document corners for perfect alignment

### 🎨 Image Enhancement
- **Binarization**: Pure black-and-white conversion for text documents
- **Color Correction**: Automatic color balance adjustment
- **Contrast Enhancement**: Improves readability and sharpness
- **Shadow Removal**: Eliminates shadows and uneven lighting
- **De-blurring**: Sharpens blurry text and images
- **Auto-Color Detection**: Intelligently chooses between Color, Grayscale, or B&W mode

### 📱 Smart Capture
- **Auto-Capture**: Automatically takes photos when document is steady and in frame
- **Manual Capture**: Tap to capture manually
- **Flash Control**: Toggle flash on/off/auto
- **Camera Switching**: Switch between front and back cameras

### 📄 Multi-Page Scanning
- **Batch Processing**: Scan multiple pages into a single document
- **Document Management**: View, organize, and manage scanned documents
- **PDF Creation**: Combine multiple scans into PDF documents

### 🔤 OCR Integration
- **Text Recognition**: Extract text from scanned documents
- **Searchable PDFs**: Convert scans to searchable PDF files
- **Text Editing**: Edit and modify extracted text

## Installation

1. **Prerequisites**
   - Node.js (v16 or higher)
   - npm or yarn
   - Expo CLI (`npm install -g @expo/cli`)
   - iOS Simulator (for iOS development) or Android Studio (for Android development)

2. **Clone and Install**
   ```bash
   cd DocumentScanner
   npm install
   ```

3. **Run the App**
   ```bash
   # Start the development server
   npm start
   
   # Run on iOS simulator
   npm run ios
   
   # Run on Android emulator
   npm run android
   
   # Run on web
   npm run web
   ```

## Usage

### Basic Scanning
1. **Open the App**: Launch the app and grant camera permissions
2. **Position Document**: Place your document in the camera viewfinder
3. **Auto-Capture**: The app will automatically detect the document and capture when ready
4. **Manual Capture**: Tap the capture button to take a photo manually

### Document Enhancement
1. **Preview**: After capturing, you'll see the document preview
2. **Enhance**: Tap the options button to access enhancement tools
3. **Choose Enhancement**:
   - **Original**: No modifications
   - **Grayscale**: Convert to grayscale
   - **B&W**: Pure black and white for text documents
   - **Enhanced**: Automatic color and contrast improvement
   - **Contrast**: Increase contrast for better readability
   - **Sharpen**: Apply sharpening filter

### Document Management
1. **Save**: Tap "Save" to save the document to your gallery
2. **View Documents**: Access the document list to view all scanned documents
3. **Multi-Select**: Long press to select multiple documents
4. **Delete**: Select documents and delete them
5. **Share**: Share individual documents

## Technical Features

### Image Processing
- **Real-time Processing**: Fast image manipulation using Expo ImageManipulator
- **Multiple Formats**: Support for JPEG, PNG, and other formats
- **Quality Control**: Configurable compression and quality settings
- **Memory Efficient**: Optimized for mobile devices

### Camera Integration
- **Expo Camera**: Native camera integration with full feature support
- **Flash Control**: Automatic and manual flash control
- **Focus Management**: Automatic focus for sharp images
- **Orientation Support**: Works in both portrait and landscape modes

### UI/UX
- **Modern Design**: Clean, intuitive interface
- **Smooth Animations**: Fluid transitions and feedback
- **Accessibility**: Screen reader support and accessibility features
- **Responsive**: Adapts to different screen sizes

## Dependencies

### Core Dependencies
- `expo-camera`: Camera functionality
- `expo-image-manipulator`: Image processing
- `expo-media-library`: Save to gallery
- `expo-file-system`: File operations
- `expo-linear-gradient`: UI gradients
- `@expo/vector-icons`: Icons

### UI Dependencies
- `react-native-paper`: Material Design components
- `react-native-reanimated`: Smooth animations
- `react-native-gesture-handler`: Touch gestures

## Project Structure

```
DocumentScanner/
├── components/
│   ├── DocumentScanner.tsx    # Main camera component
│   ├── ImagePreview.tsx       # Document preview and enhancement
│   └── DocumentList.tsx       # Document management
├── utils/
│   └── imageProcessing.ts     # Image processing utilities
├── App.tsx                    # Main app component
├── app.json                   # Expo configuration
└── package.json               # Dependencies
```

## Configuration

### Permissions
The app requires the following permissions:
- **Camera**: To capture document images
- **Photo Library**: To save scanned documents
- **Storage**: To access and manage files

### Camera Settings
- **Quality**: 0.8 (80% quality for optimal file size)
- **Format**: JPEG for compatibility
- **Resolution**: 1200px width for processing

## Troubleshooting

### Common Issues

1. **Camera Permission Denied**
   - Go to device settings and enable camera permission
   - Restart the app after granting permission

2. **Poor Document Detection**
   - Ensure good lighting
   - Keep document flat and well-positioned
   - Avoid shadows and reflections

3. **Image Quality Issues**
   - Use the enhancement tools in preview mode
   - Try different enhancement options
   - Ensure stable camera positioning

4. **App Crashes**
   - Check device storage space
   - Restart the app
   - Update to latest version

### Performance Tips

1. **Memory Management**
   - Close other apps before scanning
   - Process images in smaller batches
   - Clear document list periodically

2. **Battery Optimization**
   - Use auto-capture to reduce manual tapping
   - Close camera when not in use
   - Use appropriate flash settings

## Future Enhancements

- [ ] Cloud storage integration
- [ ] Advanced OCR with multiple languages
- [ ] Document templates and forms
- [ ] Batch processing improvements
- [ ] AI-powered document classification
- [ ] Export to various formats (PDF, Word, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ using React Native and Expo**