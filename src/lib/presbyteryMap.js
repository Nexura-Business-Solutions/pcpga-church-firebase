// Presbytery → colour, and SVG province id → presbytery. Kept in a plain module
// (not the map component) so both the map and the homepage legend can import them
// without breaking React Fast Refresh.

// Region-coherent palette: Luzon greens, NCR blue, Visayas ambers, Mindanao violet.
export const PRESBYTERY_COLOR = {
  'NCR Presbytery - North Metro': '#2f6db0',
  'NCR Presbytery - South Metro': '#5fa8d3',
  'Northern Luzon Presbytery': '#1d7a46',
  'Central Luzon North Presbytery': '#34a05f',
  'Central Luzon Presbytery': '#57b97f',
  'Western Luzon Presbytery': '#7cc79a',
  'Bulacan Presbytery': '#0f8f73',
  'Rizal Presbytery': '#46b08f',
  'Cavite Presbytery': '#2aa198',
  'Southern Luzon Presbytery': '#3fb0a4',
  'Bicol Presbytery': '#66c2b3',
  'Visayas Presbytery': '#d98a3d',
  'Southern Visayas Presbytery': '#e6a95c',
  'Mindanao Presbytery': '#8a5fb0',
};

// Which PCP presbytery gathers the churches of each province (by the SVG path id).
export const PROVINCE_TO_PRESBYTERY = {
  'PH-MNL': 'NCR Presbytery - North Metro',
  'PH-QUI': 'Northern Luzon Presbytery', 'PH-NUV': 'Northern Luzon Presbytery', 'PH-ISA': 'Northern Luzon Presbytery', 'PH-BEN': 'Northern Luzon Presbytery',
  'PH-TAR': 'Central Luzon North Presbytery', 'PH-PAN': 'Central Luzon North Presbytery', 'PH-NUE': 'Central Luzon North Presbytery',
  'PH-PAM': 'Central Luzon Presbytery', 'PH-BAN': 'Central Luzon Presbytery',
  'PH-ZMB': 'Western Luzon Presbytery',
  'PH-BUL': 'Bulacan Presbytery',
  'PH-RIZ': 'Rizal Presbytery',
  'PH-CAV': 'Cavite Presbytery',
  'PH-LAG': 'Southern Luzon Presbytery', 'PH-QUE': 'Southern Luzon Presbytery', 'PH-BTG': 'Southern Luzon Presbytery', 'PH-MDR': 'Southern Luzon Presbytery', 'PH-PLW': 'Southern Luzon Presbytery',
  'PH-ALB': 'Bicol Presbytery', 'PH-CAS': 'Bicol Presbytery', 'PH-CAN': 'Bicol Presbytery', 'PH-SOR': 'Bicol Presbytery', 'PH-MAS': 'Bicol Presbytery', 'PH-CAT': 'Bicol Presbytery',
  'PH-CEB': 'Visayas Presbytery', 'PH-BOH': 'Visayas Presbytery',
  'PH-NER': 'Southern Visayas Presbytery',
  'PH-DAS': 'Mindanao Presbytery', 'PH-DAV': 'Mindanao Presbytery', 'PH-DAO': 'Mindanao Presbytery', 'PH-COM': 'Mindanao Presbytery', 'PH-BUK': 'Mindanao Presbytery', 'PH-SUN': 'Mindanao Presbytery', 'PH-SUR': 'Mindanao Presbytery', 'PH-AGN': 'Mindanao Presbytery', 'PH-AGS': 'Mindanao Presbytery', 'PH-NCO': 'Mindanao Presbytery', 'PH-SAR': 'Mindanao Presbytery', 'PH-SCO': 'Mindanao Presbytery', 'PH-SUK': 'Mindanao Presbytery',
};
