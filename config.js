// 6-Day Fresher Attendance & Orientation Config

const CONFIG = {
    eventName: "Fresher Induction 2026",
    organization: "Extra Activities Cell",
    defaultTallyUrl: "https://tally.so/r/aQqlrq",
    startDate: "2026-08-31", // Day 1
    endDate: "2026-09-05",   // Day 6
};

const DAYS_DATA = [
    {
        day: 1,
        date: "2026-08-31",
        displayDate: "Aug 31",
        title: "The Grand Welcome",
        badge: "Day 1 of 6 • Welcome Freshers!",
        icon: "✨",
        accentColor: "#6366f1",
        quote: "Welcome to campus! Every journey of a thousand miles begins with a single bold step.",
        highlights: ["Registration & Badges", "Welcome Address by Seniors", "Campus Tour & Icebreakers"],
        energizers: ["🚀 Ready to launch!", "🔥 Super hyped!", "🎉 Excited!"],
        tallyUrl: "https://tally.so/r/aQqlrq", // Override per day if needed
        ctaText: "Mark Day 1 Attendance →"
    },
    {
        day: 2,
        date: "2026-09-01",
        displayDate: "Sept 1",
        title: "Icebreakers & Vibe Check",
        badge: "Day 2 of 6 • Vibe Check",
        icon: "⚡",
        accentColor: "#ec4899",
        quote: "Make at least 3 new friends today. The people next to you might just become lifelong buddies!",
        highlights: ["Team Bonding Games", "Clubs & Societies Teaser", "Interactive Q&A Session"],
        energizers: ["💬 Let's connect!", "⚡ Supercharged!", "🤝 Friendly vibes"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "Mark Day 2 Attendance →"
    },
    {
        day: 3,
        date: "2026-09-02",
        displayDate: "Sept 2",
        title: "Deep Dive & Exploration",
        badge: "Day 3 of 6 • Mid-Week Sync",
        icon: "🔍",
        accentColor: "#8b5cf6",
        quote: "Mid-week milestone! You're officially settling into the rhythm of college life.",
        highlights: ["Academic Roadmap", "Tech & Creative Showcase", "Mentorship Speed Dating"],
        energizers: ["💡 Inspired!", "🧠 Curious mindset", "🚀 Full steam ahead"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "Mark Day 3 Attendance →"
    },
    {
        day: 4,
        date: "2026-09-03",
        displayDate: "Sept 3",
        title: "Talent & Workshops",
        badge: "Day 4 of 6 • Spotlight",
        icon: "🌟",
        accentColor: "#10b981",
        quote: "Unleash your potential! Today is all about discovering what makes your skill set unique.",
        highlights: ["Hands-on Skill Workshops", "Open Mic & Showcase", "Networking Lounge"],
        energizers: ["🎨 Feeling creative", "🌟 Ready to shine", "🎸 Full energy"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "Mark Day 4 Attendance →"
    },
    {
        day: 5,
        date: "2026-09-04",
        displayDate: "Sept 4",
        title: "Culture & Celebration",
        badge: "Day 5 of 6 • Party Energy",
        icon: "🎉",
        accentColor: "#f59e0b",
        quote: "Turn up the noise! Celebration day is where core college memories are created.",
        highlights: ["Cultural Performances", "DJ Jam Session", "Surprise Guest Appearance"],
        energizers: ["💃 Ready to dance!", "🎶 Music lovers", "🔥 Unstoppable"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "Mark Day 5 Attendance →"
    },
    {
        day: 6,
        date: "2026-09-05",
        displayDate: "Sept 5",
        title: "Grand Finale & Farewell",
        badge: "Day 6 of 6 • Grand Finale",
        icon: "👑",
        accentColor: "#3b82f6",
        quote: "What an incredible week! This is only the beginning of your legendary college adventure.",
        highlights: ["Valedictory & Awards", "Memory Wall & Photo Ops", "Feedback & Final Cheer"],
        energizers: ["🎓 Proud fresher!", "💖 Unforgettable week", "🏆 Victory mode"],
        tallyUrl: "https://tally.so/r/aQqlrq",
        ctaText: "Complete Final Attendance →"
    }
];

if (typeof window !== "undefined") {
    window.CONFIG = CONFIG;
    window.DAYS_DATA = DAYS_DATA;
}
