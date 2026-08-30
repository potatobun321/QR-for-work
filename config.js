// 6-Day Fresher Orientation & Attendance Config

const CONFIG = {
    eventName: "Fresher Induction 2026",
    organization: "Extra Activities Cell",
    startDate: "2026-08-31", // Day 1
    endDate: "2026-09-05",   // Day 6
    // Active Google Apps Script Web App URL (Updated on deployment)
    googleScriptUrl: "",
    // Branches List
    branches: [
        "Artificial Intelligence",
        "Computer Science",
        "Civil Engineering"
    ]
};

const DAYS_DATA = [
    {
        day: 1,
        date: "2026-08-31",
        displayDate: "Aug 31",
        title: "The Grand Welcome",
        badge: "Day 1 of 6 • Welcome Freshers!",
        icon: "✨",
        bgColor: "#FFDE59",       // Electric Yellow
        accentColor: "#FFDE59",
        secondaryBg: "#FFF9C4",
        highlights: ["Registration & Badges", "Welcome Address by Seniors", "Campus Tour & Icebreakers"]
    },
    {
        day: 2,
        date: "2026-09-01",
        displayDate: "Sept 1",
        title: "Icebreakers & Vibe Check",
        badge: "Day 2 of 6 • Vibe Check",
        icon: "⚡",
        bgColor: "#FF66C4",       // Hot Pink
        accentColor: "#FF66C4",
        secondaryBg: "#FFE4F3",
        highlights: ["Team Bonding Games", "Clubs & Societies Teaser", "Interactive Q&A Session"]
    },
    {
        day: 3,
        date: "2026-09-02",
        displayDate: "Sept 2",
        title: "Deep Dive & Exploration",
        badge: "Day 3 of 6 • Mid-Week Sync",
        icon: "🔍",
        bgColor: "#00F0FF",       // Electric Cyan
        accentColor: "#00F0FF",
        secondaryBg: "#E0F7FA",
        highlights: ["Academic Roadmap", "Tech & Creative Showcase", "Mentorship Speed Dating"]
    },
    {
        day: 4,
        date: "2026-09-03",
        displayDate: "Sept 3",
        title: "Talent & Workshops",
        badge: "Day 4 of 6 • Spotlight",
        icon: "🌟",
        bgColor: "#70E000",       // Lime Green
        accentColor: "#70E000",
        secondaryBg: "#F1F8E9",
        highlights: ["Hands-on Skill Workshops", "Open Mic & Showcase", "Networking Lounge"]
    },
    {
        day: 5,
        date: "2026-09-04",
        displayDate: "Sept 4",
        title: "Culture & Celebration",
        badge: "Day 5 of 6 • Party Energy",
        icon: "🎉",
        bgColor: "#FF914D",       // Bright Orange
        accentColor: "#FF914D",
        secondaryBg: "#FFF3E0",
        highlights: ["Cultural Performances", "DJ Jam Session", "Surprise Guest Appearance"]
    },
    {
        day: 6,
        date: "2026-09-05",
        displayDate: "Sept 5",
        title: "Grand Finale & Farewell",
        badge: "Day 6 of 6 • Grand Finale",
        icon: "👑",
        bgColor: "#B57EDC",       // Vibrant Violet
        accentColor: "#B57EDC",
        secondaryBg: "#F3E5F5",
        highlights: ["Valedictory & Awards", "Memory Wall & Photo Ops", "Feedback & Final Cheer"]
    }
];

if (typeof window !== "undefined") {
    window.CONFIG = CONFIG;
    window.DAYS_DATA = DAYS_DATA;
}
