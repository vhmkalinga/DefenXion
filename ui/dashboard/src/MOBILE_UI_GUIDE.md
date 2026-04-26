# CyberGuard AI - Mobile UI Guide

## Overview
The CyberGuard AI mobile application provides a comprehensive security monitoring experience optimized for mobile devices (iPhone 14 - 390 x 844px). The app automatically detects screen size and switches to mobile mode for screens under 768px wide.

## Design System

### Color Palette
- **Background**: `#0D1117` (Dark base)
- **Cards/Surfaces**: `#1E232B` (Elevated surfaces)
- **Borders**: `#30363D` (Subtle borders)
- **Primary Text**: `#E6EDF3` (High contrast)
- **Secondary Text**: `#C9D1D9` (Medium contrast)
- **Tertiary Text**: `#7D8590` (Low contrast)
- **Primary Accent**: `#1F6FEB` (Blue - active states)
- **Success**: `#3FB950` (Green)
- **Warning**: `#FFA657` (Orange)
- **Critical**: `#FF4D4D` (Red)
- **Info**: `#58A6FF` (Light blue)

### Typography
- **Titles**: Poppins Bold, 20-24px, `#E6EDF3`
- **Body Text**: Poppins Regular, 14-16px, `#C9D1D9`
- **Card Titles**: Inter SemiBold, 16px, `#58A6FF`

## Mobile Screens

### 1. Home Screen
**Path**: `/components/MobileHome.tsx`

**Features**:
- App header with "CyberGuard AI" branding
- Live status indicator (green "Active" chip with pulse animation)
- Three stacked metric cards:
  - Total Attacks Detected (with trend indicator)
  - Avg Detection Time (with trend indicator)
  - Auto Responses Executed (with trend indicator)
- Quick action buttons (3-column grid):
  - Defense toggle
  - Analytics
  - Settings
- Recent activity timeline

**Animations**:
- Staggered fade-in on mount
- Smooth card hover effects
- Pulsing status indicator

### 2. Alerts Screen
**Path**: `/components/MobileAlerts.tsx`

**Features**:
- "Active Alerts" header
- Scrollable alert cards with severity-based styling:
  - Critical: Red background/border
  - High: Orange background/border
  - Medium: Blue background/border
- Each alert card displays:
  - Threat type with icon
  - Time since detection
  - Severity badge
  - Source IP address
  - Confidence score with progress bar
  - "View Details" action button
- Bottom sheet modal for detailed alert information
  - Full threat description
  - Network details (IP, port)
  - Status and actions
  - Download report option

**Animations**:
- Staggered card entrance
- Bottom sheet slide-up animation
- Card scale on tap

### 3. Analytics Screen
**Path**: `/components/MobileAnalytics.tsx`

**Features**:
- Three visualization cards:
  1. **Threat Distribution** (Pie Chart)
     - Interactive donut chart
     - Color-coded threat types
     - Legend with threat counts
  2. **Attack Frequency** (Line Chart)
     - 24-hour attack timeline
     - Smooth line graph
  3. **Avg Response Time** (Gauge Chart)
     - Custom SVG gauge
     - Performance indicator
     - Color-coded rating

**Charts**: Powered by Recharts library

### 4. Reports Screen
**Path**: `/components/MobileReports.tsx`

**Features**:
- Time range selector dropdown:
  - Last 24 hours
  - Last 7 days
  - Last 30 days
  - Last 90 days
- Summary cards with icons:
  - Total Threats (with trend)
  - Top Source IP
  - Avg Response Time
- Threat breakdown by type
- "Generate PDF Report" action button
- Recent reports list with download options

### 5. Settings Screen
**Path**: `/components/MobileSettings.tsx`

**Features**:
- User profile section with avatar
- Notification preferences:
  - Critical Threats toggle
  - System Alerts toggle
  - Weekly Reports toggle
- System settings:
  - Sync Data button
  - Manage Users navigation
  - Dark Mode toggle (always on)
- Security options:
  - Change Password
  - Two-Factor Authentication
- About section:
  - App version
  - Last update date
  - Build number
- Sign Out button

### 6. Bottom Navigation
**Path**: `/components/MobileNav.tsx`

**Features**:
- Fixed bottom navigation bar
- Five navigation tabs:
  1. Home
  2. Alerts
  3. Analytics
  4. Reports
  5. Settings
- Active tab indicator:
  - Blue background highlight
  - Scale animation
  - Bottom dot indicator
- Smooth tab switching with Motion layout animations

### 7. Mobile Authentication
**Path**: `/components/auth/MobileLogin.tsx`

**Features**:
- Gradient shield logo with spring animation
- Large, touch-friendly input fields (56px height)
- Email and password inputs with icons
- Show/hide password toggle
- Remember me checkbox
- Forgot password link
- Gradient sign-in button with loading state
- Sign-up link at bottom
- Optimized for one-handed use

## Responsive Behavior

### Breakpoints
- Mobile: < 768px
- Desktop: ≥ 768px

### Auto-Detection
The app automatically detects screen size using a resize listener:
```typescript
useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

## Animations & Interactions

### Motion Framework
All animations use `motion/react` (Framer Motion) for smooth, performant animations.

**Common Patterns**:
- **Entrance**: Staggered fade-in with Y-axis translation
- **Exit**: Fade-out with scale reduction
- **Transitions**: Spring physics for natural feel
- **Gestures**: Touch-optimized tap and swipe

### Key Animations
1. **Staggered List Entry**:
   ```tsx
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ delay: index * 0.1 }}
   ```

2. **Bottom Sheet**:
   ```tsx
   initial={{ y: '100%' }}
   animate={{ y: 0 }}
   exit={{ y: '100%' }}
   transition={{ type: 'spring', damping: 25 }}
   ```

3. **Active Tab Indicator**:
   ```tsx
   <motion.div layoutId="activeTab" />
   ```

## Touch Optimization

### Button Sizes
- Minimum touch target: 44x44px
- Primary buttons: 56px height
- Icon buttons: 40x40px minimum

### Spacing
- Padding around interactive elements: 16px
- Bottom navigation safe area: 24px bottom padding
- Card spacing: 16px gaps

### Gestures
- Tap: Primary interaction
- Swipe: Navigation between tabs
- Pull-to-refresh: On list views
- Bottom sheet drag: On modals

## Real-Time Features

### Threat Notifications
**Path**: `/components/ThreatNotificationSystem.tsx`

- Automatic threat detection every 8 seconds
- Toast notifications with severity-based styling
- Floating notification cards
- Auto-dismiss after 3 seconds

### Live Data Updates
- Analytics charts update in real-time
- Alert counts auto-increment
- Status indicators pulse

## Performance Optimizations

1. **Lazy Loading**: Components load on-demand
2. **Memoization**: Prevent unnecessary re-renders
3. **Virtual Lists**: For long alert lists
4. **Optimized Charts**: Recharts with responsive containers
5. **Motion**: Hardware-accelerated animations

## Accessibility

1. **Touch Targets**: 44px minimum
2. **Color Contrast**: WCAG AA compliant
3. **Focus States**: Visible keyboard navigation
4. **Screen Reader**: Semantic HTML
5. **Reduced Motion**: Respects user preferences

## Future Enhancements

- [ ] Pull-to-refresh on lists
- [ ] Offline mode support
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Haptic feedback
- [ ] Dark/Light theme toggle
- [ ] Custom alert sounds
- [ ] Widget support

## Testing on Mobile

### iOS Safari
1. Open Developer Tools
2. Enter Responsive Design Mode
3. Select iPhone 14 (390 x 844)
4. Test touch interactions

### Android Chrome
1. Open DevTools
2. Toggle device toolbar
3. Select Pixel 5 or similar
4. Enable touch emulation

### Real Device Testing
1. Deploy to hosting service
2. Access via mobile browser
3. Add to home screen for PWA experience
4. Test in portrait and landscape

## File Structure

```
components/
├── auth/
│   ├── Login.tsx              # Desktop login
│   ├── Signup.tsx             # Desktop signup
│   └── MobileLogin.tsx        # Mobile login
├── MobileHome.tsx             # Mobile home screen
├── MobileAlerts.tsx           # Mobile alerts screen
├── MobileAnalytics.tsx        # Mobile analytics screen
├── MobileReports.tsx          # Mobile reports screen
├── MobileSettings.tsx         # Mobile settings screen
├── MobileNav.tsx              # Bottom navigation
└── ThreatNotificationSystem.tsx # Real-time notifications
```

## Development

### Adding a New Mobile Screen
1. Create component in `/components/Mobile{ScreenName}.tsx`
2. Add route to mobile navigation in `MobileNav.tsx`
3. Add conditional render in `App.tsx`
4. Add animations with Motion
5. Test on mobile viewport

### Styling Guidelines
- Use Tailwind utility classes
- Follow dark theme color scheme
- Maintain consistent spacing (4px grid)
- Use rounded corners (8px, 12px, 16px)
- Add hover states for interactive elements

---

Built with ❤️ by the CyberGuard AI Team
