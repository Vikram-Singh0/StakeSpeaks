# TalkStake Frontend

A professional dark-themed frontend for TalkStake - a decentralized discussion platform that monetizes expert knowledge through staked conversations.

## 🚀 Features

### Landing Page
- **Professional Dark Theme**: Clean, modern design with gradient accents
- **Animated Hero Section**: Smooth animations with Framer Motion
- **Feature Showcase**: Highlighting key platform benefits  
- **Wallet Connection**: Mock wallet integration with loading states

### Home Dashboard
- **Session Management**: Browse live and upcoming sessions
- **Real-time Stats**: User balance, earnings, and activity tracking
- **Session Cards**: Detailed information about speakers, stakes, and yields
- **Search & Filter**: Find sessions by topic, speaker, or keywords

### UI Components
- **Custom Button**: Multiple variants (default, outline, gradient)
- **Glass Cards**: Backdrop blur effects with subtle borders
- **Logo Integration**: Custom SVG logo with gradient styling
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🎨 Design System

### Color Palette
- **Background**: Deep black (#0a0a0a) with gradient overlays
- **Primary**: Violet (#8b5cf6) to Blue (#3b82f6) gradients
- **Secondary**: Dark gray (#1f1f23) for cards and inputs
- **Accent**: Bright violet for CTAs and highlights

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom utilities
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React for consistent iconography

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   - Navigate to `http://localhost:3000` (or the port shown in terminal)
   - Experience the landing page
   - Click "Connect Wallet" to see the dashboard

## 🔗 Wallet Integration

Currently implements a mock wallet connection for demonstration:
- **Mock Address**: Generates a sample Ethereum-style address
- **LocalStorage**: Persists connection state across sessions
- **Loading States**: Shows professional loading animations
- **Navigation**: Automatically redirects between landing and dashboard

## 🎯 User Experience Flow

### New User Journey
1. **Land on Homepage**: Professional dark theme with clear value proposition
2. **Connect Wallet**: Simple one-click connection with loading feedback
3. **Dashboard Access**: Seamless transition to feature-rich dashboard
4. **Session Discovery**: Browse and filter available sessions
5. **Stake & Participate**: Join sessions with clear stake requirements

### Returning User Journey
1. **Auto-redirect**: Automatic login for returning users
2. **Dashboard Overview**: Immediate access to stats and active sessions
3. **Quick Actions**: Fast access to common tasks
4. **Session Management**: Track participated and upcoming sessions

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Friendly**: Adapts layouts for tablet screens
- **Desktop Enhanced**: Full feature set on desktop
- **Touch Interactions**: Proper touch targets and gestures

## 🚀 Deployment Ready

The frontend is ready for deployment to:
- **Vercel**: Optimized for Next.js applications
- **Netlify**: Static site deployment
- **AWS/GCP**: Cloud platform deployment
- **IPFS**: Decentralized hosting for Web3 alignment

---

Built with ❤️ for the decentralized future of knowledge sharing.
