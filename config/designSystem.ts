export const DesignSystem = {
  // Color Palette - Vibrant and Modern
  colors: {
    // Primary Colors
    primary: '#6366F1', // Indigo
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    
    // Secondary Colors
    secondary: '#EC4899', // Pink
    secondaryLight: '#F472B6',
    secondaryDark: '#DB2777',
    
    // Accent Colors
    accent: '#10B981', // Emerald
    accentLight: '#34D399',
    accentDark: '#059669',
    
    // Warning & Error
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    success: '#10B981', // Emerald
    
    // Neutral Colors
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9', // Slate 100
    
    // Text Colors
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#475569', // Slate 600
    textTertiary: '#94A3B8', // Slate 400
    textInverse: '#FFFFFF',
    
    // Border Colors
    border: '#E2E8F0', // Slate 200
    borderLight: '#F1F5F9', // Slate 100
    borderDark: '#CBD5E1', // Slate 300
    
    // Gradient Colors - Subtle and Monochromatic
    gradients: {
      primary: ['#6366F1', '#4F46E5'], // Indigo gradient
      secondary: ['#475569', '#334155'], // Slate gradient
      accent: ['#10B981', '#059669'], // Emerald gradient
      surface: ['#FFFFFF', '#F8FAFC'],
      dark: ['#1E293B', '#334155'],
      warm: ['#F1F5F9', '#E2E8F0'], // Subtle warm gray
      cool: ['#F1F5F9', '#E2E8F0'], // Subtle cool gray
    },
    
    // Status Colors
    status: {
      online: '#10B981',
      offline: '#6B7280',
      processing: '#F59E0B',
      error: '#EF4444',
    }
  },
  
  // Typography
  typography: {
    // Font Sizes - Compact Scale
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 36,
    },
    
    // Font Weights
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    // Line Heights
    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    }
  },
  
  // Spacing - Compact Scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
  },
  
  // Border Radius - Rounded and Modern
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Component Styles
  components: {
    // Buttons
    button: {
      primary: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        minHeight: 44,
      },
      secondary: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        minHeight: 44,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        minHeight: 44,
      },
      icon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
      },
      // Action button variants with subtle styling
      action: {
        primary: {
          backgroundColor: '#6366F1',
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 48,
        },
        secondary: {
          backgroundColor: '#475569',
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 48,
        },
        accent: {
          backgroundColor: '#10B981',
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 48,
        },
        neutral: {
          backgroundColor: '#6B7280',
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 48,
        }
      }
    },
    
    // Cards
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    
    // Inputs
    input: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      minHeight: 44,
    },
    
    // Badges
    badge: {
      primary: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
      },
      secondary: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
      },
      success: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
      },
      warning: {
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
      },
      error: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
      },
    }
  },
  
  // Layout
  layout: {
    containerPadding: 20,
    sectionSpacing: 24,
    cardSpacing: 16,
  },
  
  // Animation
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    }
  }
};

// Helper functions for common styles
export const createGradientStyle = (colors: string[], direction: 'vertical' | 'horizontal' = 'vertical') => ({
  colors: colors as [string, string, ...string[]],
  start: direction === 'vertical' ? { x: 0, y: 0 } : { x: 0, y: 0 },
  end: direction === 'vertical' ? { x: 0, y: 1 } : { x: 1, y: 0 },
});

export const createTextStyle = (size: keyof typeof DesignSystem.typography.sizes, weight: keyof typeof DesignSystem.typography.weights = 'normal') => ({
  fontSize: DesignSystem.typography.sizes[size],
  fontWeight: DesignSystem.typography.weights[weight] as any,
  color: DesignSystem.colors.textPrimary,
});

export const createSpacingStyle = (vertical: number, horizontal: number) => ({
  paddingVertical: vertical,
  paddingHorizontal: horizontal,
});

export const createShadowStyle = (level: keyof typeof DesignSystem.shadows) => {
  return DesignSystem.shadows[level];
};