/**
 * Team Project Hardware Mapping & Anti-Cheat Validation
 * Ensures teams can only view by default and purchase components required for their assigned project.
 */

export const TEAM_PROJECT_CONFIG = {
  TEAM01: {
    pathId: 'path-01',
    projectName: 'The Silent Watcher (Perimeter Anomaly Detection)',
    componentIds: ['esp8266', 'proximity-sensor', 'led'],
    componentNames: [
      'ESP8266 (NodeMCU CP2102)',
      'Inductive Proximity Sensor',
      'LED 5mm Pack',
    ],
  },
  // Additional teams/paths can be mapped here as the event expands
};

/**
 * Normalizes string for case-insensitive matching
 */
function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Get project requirements configuration for a team
 */
export function getTeamProjectConfig(team) {
  const code = (team?.teamCode || '').toUpperCase().trim();
  if (TEAM_PROJECT_CONFIG[code]) {
    return TEAM_PROJECT_CONFIG[code];
  }

  // Fallback to path-01 / TEAM01 default if team is unmapped
  return TEAM_PROJECT_CONFIG.TEAM01;
}

/**
 * Checks whether a component belongs to the team's assigned project
 * @param {Object} team - The team object from DB or session
 * @param {Object} component - The component object (with name, id, or _id)
 * @returns {boolean}
 */
export function isComponentAllowedForTeam(team, component) {
  if (!component) return false;
  const config = getTeamProjectConfig(team);
  if (!config) return true;

  const compId = (component.id || '').toLowerCase().trim();
  const compNameNorm = normalize(component.name);

  // Check by ID
  if (compId && config.componentIds.some(id => id.toLowerCase() === compId)) {
    return true;
  }

  // Check by name
  if (config.componentNames.some(name => normalize(name) === compNameNorm)) {
    return true;
  }

  // Also check if component name contains key identifiers (e.g. inductive proximity, esp8266, led 5mm)
  if (config.componentIds.includes('proximity-sensor') && compNameNorm.includes('inductiveproximity')) {
    return true;
  }
  if (config.componentIds.includes('esp8266') && compNameNorm.includes('esp8266')) {
    return true;
  }
  if (config.componentIds.includes('led') && compNameNorm.includes('led5mm')) {
    return true;
  }

  return false;
}
