// Static reference data used by the UI. Admin-managed content lives in Firestore;
// these are not seeded into the database — they are fallbacks/option lists only.

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
