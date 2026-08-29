// 6-Day Fresher Attendance & Orientation Config - Blocky Vibrant Theme

const CONFIG = {
    eventName: "Fresher Induction 2026",
    organization: "Extra Activities Cell",
    defaultTallyUrl: "https://tally.so/r/aQqlrq",
    startDate: "2026-08-31", // Day 1
    endDate: "2026-09-05",   // Day 6
    // Paste your Deployed Google Apps Script Web App URL below:
    googleScriptUrl: "https://script.google.com/macros/s/AKfycbyGOrgI8ZKjFJKouFgpN5WuufpoJnZL0UROHAOwTLL6Vkx9xMg5z34s0nFRPjWd01u-8A/exec",
    // Branches List (Exactly 3 Options as requested)
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
        cardBg: "#FFFFFF",
        accentColor: "#FFDE59",
        secondaryBg: "#FFF9C4",
        textColor: "#000000",
        quote: "Welcome to campus! Every journey of a thousand miles begins with a single bold step.",
        highlights: ["Registration & Badges", "Welcome Address by Seniors", "Campus Tour & Icebreakers"],
        energizers: ["🚀 Ready!", "🔥 Hyped!", "🎉 Excited!"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "MARK DAY 1 ATTENDANCE →"
    },
    {
        day: 2,
        date: "2026-09-01",
        displayDate: "Sept 1",
        title: "Icebreakers & Vibe Check",
        badge: "Day 2 of 6 • Vibe Check",
        icon: "⚡",
        bgColor: "#FF66C4",       // Hot Pink
        cardBg: "#FFFFFF",
        accentColor: "#FF66C4",
        secondaryBg: "#FFE4F3",
        textColor: "#000000",
        quote: "Make at least 3 new friends today! The people next to you might become lifelong buddies.",
        highlights: ["Team Bonding Games", "Clubs & Societies Teaser", "Interactive Q&A Session"],
        energizers: ["💬 Let's connect!", "⚡ Supercharged!", "🤝 Friendly vibes"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "MARK DAY 2 ATTENDANCE →"
    },
    {
        day: 3,
        date: "2026-09-02",
        displayDate: "Sept 2",
        title: "Deep Dive & Exploration",
        badge: "Day 3 of 6 • Mid-Week Sync",
        icon: "🔍",
        bgColor: "#00F0FF",       // Electric Cyan
        cardBg: "#FFFFFF",
        accentColor: "#00F0FF",
        secondaryBg: "#E0F7FA",
        textColor: "#000000",
        quote: "Mid-week milestone! You're officially settling into the rhythm of college life.",
        highlights: ["Academic Roadmap", "Tech & Creative Showcase", "Mentorship Speed Dating"],
        energizers: ["💡 Inspired!", "🧠 Curious mindset", "🚀 Full steam"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "MARK DAY 3 ATTENDANCE →"
    },
    {
        day: 4,
        date: "2026-09-03",
        displayDate: "Sept 3",
        title: "Talent & Workshops",
        badge: "Day 4 of 6 • Spotlight",
        icon: "🌟",
        bgColor: "#70E000",       // Lime Green
        cardBg: "#FFFFFF",
        accentColor: "#70E000",
        secondaryBg: "#F1F8E9",
        textColor: "#000000",
        quote: "Unleash your potential! Today is all about discovering what makes your skill set unique.",
        highlights: ["Hands-on Skill Workshops", "Open Mic & Showcase", "Networking Lounge"],
        energizers: ["🎨 Creative", "🌟 Ready to shine", "🎸 High energy"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "MARK DAY 4 ATTENDANCE →"
    },
    {
        day: 5,
        date: "2026-09-04",
        displayDate: "Sept 4",
        title: "Culture & Celebration",
        badge: "Day 5 of 6 • Party Energy",
        icon: "🎉",
        bgColor: "#FF914D",       // Bright Orange
        cardBg: "#FFFFFF",
        accentColor: "#FF914D",
        secondaryBg: "#FFF3E0",
        textColor: "#000000",
        quote: "Turn up the noise! Celebration day is where core college memories are created.",
        highlights: ["Cultural Performances", "DJ Jam Session", "Surprise Guest Appearance"],
        energizers: ["💃 Ready to dance!", "🎶 Music lovers", "🔥 Unstoppable"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "MARK DAY 5 ATTENDANCE →"
    },
    {
        day: 6,
        date: "2026-09-05",
        displayDate: "Sept 5",
        title: "Grand Finale & Farewell",
        badge: "Day 6 of 6 • Grand Finale",
        icon: "👑",
        bgColor: "#B57EDC",       // Vibrant Violet
        cardBg: "#FFFFFF",
        accentColor: "#B57EDC",
        secondaryBg: "#F3E5F5",
        textColor: "#000000",
        quote: "What an incredible week! This is only the beginning of your legendary college adventure.",
        highlights: ["Valedictory & Awards", "Memory Wall & Photo Ops", "Feedback & Final Cheer"],
        energizers: ["🎓 Proud fresher!", "💖 Unforgettable", "🏆 Victory mode"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "COMPLETE FINAL ATTENDANCE →"
    }
];

if (typeof window !== "undefined") {
    window.CONFIG = CONFIG;
    window.DAYS_DATA = DAYS_DATA;
}
