const { execSync } = require('child_process');
const path = require('path');

const gitExe = 'C:\\Users\\Admin\\MinGit\\cmd\\git.exe';
const repoDir = __dirname;
const commitMsg = process.argv[2] || `Actualización automática VitrinaSpot - ${new Date().toLocaleString('es-CO')}`;

function run(cmd) {
  return execSync(`"${gitExe}" ${cmd}`, { cwd: repoDir, stdio: 'inherit' });
}

try {
  console.log('🚀 Iniciando sincronización automática con GitHub...');
  run('add .');
  try {
    run(`commit -m "${commitMsg}"`);
  } catch (e) {
    console.log('Sin cambios nuevos para commitear.');
  }
  run('push origin main');
  console.log('✅ ¡Subida a GitHub completada exitosamente!');
} catch (err) {
  console.error('❌ Error en auto-push:', err.message);
  process.exit(1);
}
