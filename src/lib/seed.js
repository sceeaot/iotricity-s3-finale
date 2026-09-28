import connectDB from './mongodb.js';
import Component from '../models/Component.js';
import Admin from '../models/Admin.js';
import BuildProblem from '../models/BuildProblem.js';
import Stage from '../models/Stage.js';
import Team from '../models/Team.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * Database Initialization Script
 * 
 * NOTE: As per system security architecture, no contest problem statements,
 * questions, answers, secret keys, or team credentials may be stored or
 * hardcoded in repository files. All contest operational data resides directly
 * in MongoDB.
 * 
 * This script ensures the base database collections, indexes, admin credentials,
 * and general electronics store catalog are initialized.
 * 
 * If an optional, untracked private seed file is supplied via:
 *   npx tsx src/lib/seed.js --file ./private/contest-data.json
 * or located at ./private/contest-data.json, it will be loaded into MongoDB.
 */
// Auto-load .env or .env.local if not already injected
if (typeof process.loadEnvFile === 'function') {
  try {
    if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
    else if (fs.existsSync('.env')) process.loadEnvFile('.env');
  } catch {
    // Ignore if already loaded
  }
}

async function seed() {
  await connectDB();

  // 1. Ensure Admin Account Exists
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    await Admin.create({
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    });
    console.log('✓ Default admin account initialized.');
  } else {
    console.log('✓ Admin account already present.');
  }

  // 2. Ensure General Electronic Components Catalog
  const componentsPath = new URL('../data/components.json', import.meta.url);
  if (fs.existsSync(componentsPath)) {
    const componentsRaw = fs.readFileSync(componentsPath, 'utf8');
    const componentsList = JSON.parse(componentsRaw);

    // Remove obsolete components not in components.json
    const validNames = componentsList.map((c) => c.name);
    await Component.deleteMany({ name: { $nin: validNames } });

    for (const c of componentsList) {
      await Component.updateOne(
        { name: c.name },
        {
          $set: {
            name: c.name,
            cyberpunkName: c.cyberpunkName || c.name,
            price: c.price,
            stock: typeof c.quantity === 'number' ? c.quantity : 1,
            description: c.description || '',
            category: c.category || 'Module',
            imageUrl: c.imageUrl || '',
          },
        },
        { upsert: true }
      );
    }
    console.log(`✓ Component catalog verified (${componentsList.length} items).`);
  }

  // 3. Optional loading from an untracked, private JSON file (if present)
  let privateFilePath = null;
  const fileArgIdx = process.argv.indexOf('--file');
  if (fileArgIdx !== -1 && process.argv[fileArgIdx + 1]) {
    privateFilePath = path.resolve(process.cwd(), process.argv[fileArgIdx + 1]);
  } else {
    const defaultPrivate = path.resolve(process.cwd(), 'private/contest-data.json');
    if (fs.existsSync(defaultPrivate)) {
      privateFilePath = defaultPrivate;
    }
  }

  if (privateFilePath && fs.existsSync(privateFilePath)) {
    console.log(`Loading contest data from untracked file: ${privateFilePath}...`);
    const content = JSON.parse(fs.readFileSync(privateFilePath, 'utf8'));

    if (Array.isArray(content.buildProblems)) {
      for (const bp of content.buildProblems) {
        await BuildProblem.updateOne({ pathId: bp.pathId }, { $set: bp }, { upsert: true });
        console.log(`  ✓ Synced BuildProblem: ${bp.pathId} ("${bp.pathTitle}")`);
      }
    }

    if (Array.isArray(content.stages)) {
      for (const st of content.stages) {
        await Stage.updateOne(
          { pathId: st.pathId, stageNumber: st.stageNumber },
          { $set: st },
          { upsert: true }
        );
      }
      console.log(`  ✓ Synced ${content.stages.length} stages into MongoDB.`);
    }

    if (Array.isArray(content.teams)) {
      for (const tm of content.teams) {
        await Team.updateOne({ teamCode: tm.teamCode }, { $set: tm }, { upsert: true });
        console.log(`  ✓ Synced Team: ${tm.teamCode} ("${tm.teamName}")`);
      }
    }
  } else {
    console.log('ℹ No private contest seed file provided.');
    console.log('ℹ Contest problem statements, stages, and teams are managed directly in MongoDB.');
  }

  console.log('\nSeed routine completed.');
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});