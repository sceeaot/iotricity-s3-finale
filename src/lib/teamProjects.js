import BuildProblem from '@/models/BuildProblem';

/**
 * Normalizes string for case-insensitive matching
 */
function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Get project requirements configuration for a team dynamically from MongoDB
 * @param {Object} team - The team object from DB or session
 * @returns {Promise<Object|null>}
 */
export async function getTeamProjectConfig(team) {
  let problem = null;
  if (team?.pathId) {
    problem = await BuildProblem.findOne({ pathId: team.pathId });
  }
  if (!problem) {
    problem = await BuildProblem.findOne();
  }
  if (!problem) {
    return null;
  }

  const componentIds = (problem.components || [])
    .map((c) => c.id)
    .filter(Boolean);
  const componentNames = (problem.components || [])
    .map((c) => c.name)
    .filter(Boolean);

  return {
    pathId: problem.pathId,
    projectName: problem.pathTitle,
    componentIds,
    componentNames,
  };
}

/**
 * Checks whether a component belongs to the team's assigned project in MongoDB
 * @param {Object} team - The team object from DB or session
 * @param {Object} component - The component object (with name, id, or _id)
 * @param {Object} [projectConfig] - Optional preloaded project config from getTeamProjectConfig
 * @returns {boolean}
 */
export function isComponentAllowedForTeam(team, component, projectConfig) {
  if (!component) return false;
  // If no project restriction configured in DB, allow access
  if (!projectConfig || !projectConfig.componentIds || projectConfig.componentIds.length === 0) {
    return true;
  }

  const compId = (component.id || '').toLowerCase().trim();
  const compNameNorm = normalize(component.name);

  // Check by ID
  if (compId && projectConfig.componentIds.some((id) => id.toLowerCase() === compId)) {
    return true;
  }

  // Check by exact normalized name
  if (projectConfig.componentNames.some((name) => normalize(name) === compNameNorm)) {
    return true;
  }

  // Check substring containment against project components from MongoDB
  for (const pName of projectConfig.componentNames) {
    const pNorm = normalize(pName);
    if (pNorm && (compNameNorm.includes(pNorm) || pNorm.includes(compNameNorm))) {
      return true;
    }
  }

  return false;
}
