// Default seed data for PCP churches and content
// NOTE: Replace placeholder values with real data via environment variables or admin panel

export const defaultChurches = [
    {
        id: '1',
        name: 'Sample Church HQ',
        address: '123 Main St., Sample City',
        region: 'NCR',
        province: 'Metro Manila',
        serviceTime: 'Sundays 9:00 AM & 11:00 AM',
        pastor: 'Pastor Name',
        phone: '(02) XXXX-XXXX',
        email: 'info@yourchurch.org',
        mapLink: 'https://maps.google.com/?q=Your+Church+Address',
    },
    {
        id: '2',
        name: 'Sample Church Branch 1',
        address: '456 Sample Ave., Sample City',
        region: 'NCR',
        province: 'Metro Manila',
        serviceTime: 'Sundays 10:00 AM',
        pastor: 'Rev. Sample Name',
        phone: '(02) XXXX-XXXX',
        email: 'branch1@yourchurch.org',
        mapLink: 'https://maps.google.com/?q=Your+Church+Address',
    },
];

export const defaultSermons = [
    {
        id: '1',
        title: 'Finding Peace in Chaos',
        speaker: 'Pastor Name',
        date: '2026-02-23',
        duration: '45 min',
        videoUrl: '',
        description: 'In a world filled with uncertainty, discover how faith anchors the soul in the midst of any storm.',
    },
    {
        id: '2',
        title: 'The Power of Community',
        speaker: 'Rev. Dr. Sample Name',
        date: '2026-02-16',
        duration: '38 min',
        videoUrl: '',
        description: 'Why we were never meant to walk the journey of faith alone, and how we find strength in one another.',
    },
    {
        id: '3',
        title: 'Grace That Transforms',
        speaker: 'Rev. Sample Name',
        date: '2026-02-09',
        duration: '42 min',
        videoUrl: '',
        description: 'Understanding the radical, life-altering love of God and how it shapes our purpose.',
    },
];

export const defaultHeroContent = {
    heading: 'Welcome Home.',
    subtitle: 'Presbyterian Church of the Philippines — where faith and community meet.',
    ctaText: 'Join Us Sunday',
    serviceTimes: 'Sunday Worship · 9:00 AM & 11:00 AM',
};

export const defaultDonationContent = {
    heading: 'Give Generously.',
    subtitle: 'Your generosity helps us serve the community, spread the Gospel, and build a place of hope for everyone.',
    scriptureText: 'Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.',
    scriptureRef: '2 Corinthians 9:7',
    methods: [
        {
            id: '1',
            title: 'Bank Transfer',
            details: 'BDO Savings Account\nYour Church Name\nAccount #: XXXX-XXXX-XXXX',
            icon: 'Coins'
        },
        {
            id: '2',
            title: 'GCash',
            details: 'Send to: 09XX-XXX-XXXX\nName: Church Treasury',
            icon: 'Diamond'
        },
        {
            id: '3',
            title: 'In-Person',
            details: 'Offering during Sunday worship\nChurch office (Mon–Fri, 9AM–5PM)',
            icon: 'Church'
        },
    ],
    contactEmail: 'give@yourchurch.org',
};

export const defaultLibraryResources = [
    {
        id: '1',
        title: 'Weekly Bulletin - Sample Date',
        description: 'Order of service, announcements, and prayer requests for this week.',
        category: 'Bulletins',
        fileUrl: '#',
        fileType: 'PDF'
    },
    {
        id: '2',
        title: 'Monthly Newsletter: Sample',
        description: 'Monthly newsletter featuring mission updates and community stories.',
        category: 'Newsletters',
        fileUrl: '#',
        fileType: 'PDF'
    },
    {
        id: '3',
        title: 'Membership Application Form',
        description: 'Official form for individuals wishing to join the church family.',
        category: 'Forms',
        fileUrl: '#',
        fileType: 'DOCX'
    }
];

export const regions = ['NCR', 'CAR', 'Visayas', 'Mindanao', 'Luzon'];

export const defaultPresbyteries = [
    { id: '1', name: 'Northern Luzon Presbytery', region: 'Luzon', officers: [], description: 'Regional council overseeing Presbyterian churches in Northern Luzon.' },
    { id: '2', name: 'Central Luzon North Presbytery', region: 'Luzon', officers: ['Elder Sample Name'], description: 'Serving the Northern parts of Central Luzon.' },
    { id: '3', name: 'Central Luzon Presbytery', region: 'Luzon', officers: ['Elder Sample Name'], description: 'The main regional council for Central Luzon.' },
    { id: '4', name: 'Western Luzon Presbytery', region: 'Luzon', officers: ['Elder Sample Name'], description: 'Overseeing churches across Western Luzon.' },
    { id: '5', name: 'NCR Presbytery - North Metro', region: 'NCR', officers: ['Elder Sample Name'], description: 'Serving churches in the Northern Metro Manila area.' },
    { id: '6', name: 'Rizal Presbytery', region: 'Luzon', officers: [], description: 'Serving the province of Rizal and surrounding areas.' },
    { id: '7', name: 'NCR Presbytery - South Metro', region: 'NCR', officers: ['Elder Sample Name'], description: 'Serving churches in the Southern Metro Manila area.' },
    { id: '8', name: 'Cavite Presbytery', region: 'Luzon', officers: ['Elder Sample Name'], description: 'The regional body for churches in Cavite.' },
    { id: '9', name: 'Southern Luzon Presbytery', region: 'Luzon', officers: ['Elder Sample Name'], description: 'Overseeing Presbyterian works in Southern Luzon.' },
    { id: '10', name: 'Bicol Presbytery', region: 'Luzon', officers: ['Elder Sample Name'], description: 'The regional council for the Bicol region.' },
    { id: '11', name: 'Visayas Presbytery', region: 'Visayas', officers: ['Elder Sample Name'], description: 'Serving the regional network of churches in Visayas.' },
    { id: '12', name: 'Western Visayas Presbytery', region: 'Visayas', officers: [], description: 'Expanding mission in Western Visayas.' },
    { id: '13', name: 'Southern Visayas Presbytery', region: 'Visayas', officers: [], description: 'Serving Southern Visayas communities.' },
    { id: '14', name: 'Mindanao Presbytery', region: 'Mindanao', officers: [], description: 'The regional body overseeing the mission in Mindanao.' },
];
