/**
 * ==============================================================================
 * QR-PORTAL-INFRA | CENTRAL CONFIGURATION (config.js)
 * ==============================================================================
 * Edit this single file to customize branding, color themes, form options,
 * social gates, and backend integration. No hardcoded markup required!
 * ==============================================================================
 */

const APP_CONFIG = {
  // --- BRANDING & METADATA ---
  branding: {
    appName: "QRGATE",
    tagline: "ACCESS & ATTENDANCE GATEWAY",
    // Set logoImage to a file path or URL (e.g., 'assets/logo.png'), or null to use the blocky monogram
    logoImage: null,
    monogram: "QG",
    footerText: "© Powered by QRGate Infrastructure • Open & Decoupled",
  },

  // --- BACKEND API CONFIGURATION ---
  backend: {
    // Default Google Apps Script Web App URL (Can also be updated live via the in-app Settings modal)
    defaultApiUrl: "https://script.google.com/macros/s/AKfycbzT1iHGKacgQ3EzfuycYp6X4AqknYB0H9UUH_InmSVLMNSWvvfnkQLQHvAzDdr9Kgzw/exec",
    // Sheet tab name to target in the spreadsheet
    sheetName: "Registrations",
    // Prevent submissions from other devices using the same phone number
    enableDeviceLocking: true,
  },

  // --- APPEARANCE & THEME TOKENS ---
  theme: {
    // Active palette name: 'obsidian-amber' | 'cyber-cyan' | 'emerald-tech' | 'deep-monochrome'
    activeTheme: "obsidian-amber",
    
    palettes: {
      "obsidian-amber": {
        "--bg-page": "#070F1E",
        "--bg-card": "#0B192C",
        "--card-surface": "#0F223D",
        "--brand-accent": "#EA580C",
        "--brand-accent-glow": "#F97316",
        "--brand-highlight": "#F59E0B",
        "--border-input": "#1E2E48",
        "--text-heading": "#FFFFFF",
        "--text-primary": "#CBD5E1",
        "--text-secondary": "#94A3B8"
      },
      "cyber-cyan": {
        "--bg-page": "#050811",
        "--bg-card": "#0A1124",
        "--card-surface": "#0F1C38",
        "--brand-accent": "#00F0FF",
        "--brand-accent-glow": "#38BDF8",
        "--brand-highlight": "#A855F7",
        "--border-input": "#1E293B",
        "--text-heading": "#FFFFFF",
        "--text-primary": "#E2E8F0",
        "--text-secondary": "#94A3B8"
      },
      "emerald-tech": {
        "--bg-page": "#04100D",
        "--bg-card": "#072019",
        "--card-surface": "#0B2C23",
        "--brand-accent": "#10B981",
        "--brand-accent-glow": "#34D399",
        "--brand-highlight": "#F59E0B",
        "--border-input": "#133E33",
        "--text-heading": "#FFFFFF",
        "--text-primary": "#D1FAE5",
        "--text-secondary": "#6EE7B7"
      },
      "deep-monochrome": {
        "--bg-page": "#0A0A0A",
        "--bg-card": "#141414",
        "--card-surface": "#1E1E1E",
        "--brand-accent": "#E5E5E5",
        "--brand-accent-glow": "#FFFFFF",
        "--brand-highlight": "#A3A3A3",
        "--border-input": "#2E2E2E",
        "--text-heading": "#FFFFFF",
        "--text-primary": "#D4D4D4",
        "--text-secondary": "#737373"
      }
    }
  },

  // --- STEPPER PIPELINE CONFIGURATION ---
  // You can set any step to enabled: false to skip it automatically!
  steps: {
    // STEP 1: Community Channel / Primary Gate
    step1: {
      enabled: true,
      title: "Community Channel",
      subtitle: "Join our primary updates channel to unlock the portal.",
      actionLabel: "JOIN COMMUNITY CHANNEL",
      url: "https://instagram.com",
      handle: "@community_updates",
      lockNote: "Please click the link above to unlock the next step.",
      successNote: "✓ Channel step completed! You may proceed."
    },

    // STEP 2: Network / Secondary Gate
    step2: {
      enabled: true,
      title: "Official Network",
      subtitle: "Connect with the organizing network for official updates.",
      actionLabel: "CONNECT ON NETWORK",
      url: "https://linkedin.com",
      handle: "Official Network Page",
      lockNote: "Please click the link above to unlock registration.",
      successNote: "✓ Network step completed! You may proceed to registration."
    },

    // STEP 3: Participant Intake Form
    step3: {
      title: "Participant Details",
      subtitle: "Fill in your details below to secure your verified entry credentials.",
      // Dropdown category options
      categories: [
        "General Attendee",
        "Student / Researcher",
        "Developer / Builder",
        "VIP / Delegate",
        "Organizer / Staff"
      ],
      // Academic / Class options (Optional)
      classes: [
        "Undergraduate (1st - 2nd Year)",
        "Undergraduate (3rd - 4th Year)",
        "Postgraduate / Masters",
        "Working Professional",
        "Other"
      ],
      submitButtonText: "GENERATE VERIFIED PASS"
    },

    // STEP 4: Confirmation & Dynamic Pass
    step4: {
      title: "Registration Confirmed!",
      badge: "VERIFIED ENTRY PASS",
      message: "Your registration has been securely synced to the database. Present this QR code at the check-in desk.",
      passPrefix: "PASS-26-",
      allowEdit: true
    }
  }
};

// Export to window object for zero-build HTML usage
if (typeof window !== "undefined") {
  window.APP_CONFIG = APP_CONFIG;
}
