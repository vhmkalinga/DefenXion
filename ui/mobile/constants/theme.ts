export const SharedStyles = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  }
};

export const darkTheme = {
  ...SharedStyles,
  isDark: true,
  colors: {
    background: '#0B0F19',
    surface: '#161B22',
    surfaceHighlight: '#1E242C', 
    primary: '#1F6FEB',
    primaryDim: 'rgba(31, 111, 235, 0.15)',
    danger: '#FF4D4D',
    dangerDim: 'rgba(255, 77, 77, 0.1)',
    warning: '#FFA657',
    warningDim: 'rgba(255, 166, 87, 0.1)',
    success: '#3FB950',
    successDim: 'rgba(63, 185, 80, 0.1)',
    text: '#E6EDF3',
    textMuted: '#7D8590',
    border: '#30363D',
  }
};

export const lightTheme = {
  ...SharedStyles,
  isDark: false,
  colors: {
    background: '#F6F8FA',
    surface: '#FFFFFF',
    surfaceHighlight: '#F3F4F6', 
    primary: '#0969DA',
    primaryDim: 'rgba(9, 105, 218, 0.15)',
    danger: '#CF222E',
    dangerDim: 'rgba(207, 34, 46, 0.1)',
    warning: '#9A6700',
    warningDim: 'rgba(154, 103, 0, 0.1)',
    success: '#1A7F37',
    successDim: 'rgba(26, 127, 55, 0.1)',
    text: '#1F2328',
    textMuted: '#656D76',
    border: '#D0D7DE',
  }
};

export type Theme = typeof darkTheme;
export default darkTheme;
