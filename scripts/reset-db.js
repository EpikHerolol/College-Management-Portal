import readline from 'readline';
import { initDatabase } from './init-db.js';
import { seedDatabase } from './seed-db.js';

async function reset() {
  const target = process.env.DB_NAME || 'college_mgmt';

  // Check if force flag is passed
  const isForced = process.argv.includes('--yes') || process.argv.includes('-y') || process.env.CI;

  if (!isForced) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n============================================================');
    console.log('⚠️  WARNING: DESTRUCTIVE DATABASE RESET');
    console.log(`This will completely wipe and recreate the database: ${target}`);
    console.log('All current data will be permanently deleted and replaced with demo seeds.');
    console.log('============================================================\n');

    const confirmed = await new Promise((resolve) => {
      rl.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() === 'yes' || answer.trim().toLowerCase() === 'y');
      });
    });

    if (!confirmed) {
      console.log('Database reset aborted by user.');
      process.exit(0);
    }
  }

  console.log(`[RESET] Resetting database "${target}"...`);
  await initDatabase(target);
  await seedDatabase(target);
  console.log(`[RESET] Database "${target}" reset and reseeded successfully!`);
  process.exit(0);
}

reset().catch((err) => {
  console.error('[RESET] Failed:', err);
  process.exit(1);
});

