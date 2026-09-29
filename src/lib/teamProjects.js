import BuildProblem from '@/models/BuildProblem';
import Component from '@/models/Component';

/**
 * Normalizes string for case-insensitive matching
 */
function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Maps required components in a BuildProblem directly to the actual Component dataset
 * @param {Object} buildProblem 
 * @returns {Promise<Object>}
 */
export async function populateBuildProblemComponents(buildProblem) {
  if (!buildProblem || !Array.isArray(buildProblem.components) || buildProblem.components.length === 0) {
    return buildProblem;
  }

  const dbComponents = await Component.find({}).lean();

  const mapped = buildProblem.components.map((pComp) => {
    const pNameNorm = normalize(pComp.name || pComp.id);
    const match = dbComponents.find((c) => {
      const cNameNorm = normalize(c.name);
      return (
        cNameNorm === pNameNorm ||
        cNameNorm.includes(pNameNorm) ||
        pNameNorm.includes(cNameNorm) ||
        (pComp.id && c._id.toString() === pComp.id.toString())
      );
    });

    if (match) {
      return {
        id: match._id.toString(),
        _id: match._id.toString(),
        name: match.name,
        cyberpunkName: match.cyberpunkName || match.name,
        cost: match.price,
        price: match.price,
        category: match.category,
        description: match.description,
        imageUrl: match.imageUrl,
        status: pComp.status || 'Mandatory',
      };
    }

    return pComp;
  });

  return {
    ...buildProblem,
    components: mapped,
  };
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

  const hasRestrictions = Boolean(
    (projectConfig?.componentIds && projectConfig.componentIds.length > 0) ||
    (projectConfig?.componentNames && projectConfig.componentNames.length > 0)
  );

  // If no project restriction configured in DB, allow access
  if (!hasRestrictions) {
    return true;
  }

  const compId = (component.id || component._id?.toString() || '').toLowerCase().trim();
  const compNameNorm = normalize(component.name);

  // Check by ID
  if (compId && projectConfig.componentIds?.some((id) => id.toLowerCase() === compId)) {
    return true;
  }

  // Check by exact normalized name
  if (projectConfig.componentNames?.some((name) => normalize(name) === compNameNorm)) {
    return true;
  }

  // Check substring containment against project components from MongoDB
  for (const pName of projectConfig.componentNames || []) {
    const pNorm = normalize(pName);
    if (pNorm && (compNameNorm === pNorm || compNameNorm.includes(pNorm) || pNorm.includes(compNameNorm))) {
      return true;
    }
  }

  return false;
}
