// Se ejecuta después de "react-scripts build" (ver "postbuild" en package.json).
// Sobrescribe build/version.json con un identificador único de este build, para
// que el aviso de actualización (src/App.js) pueda detectar cuándo Netlify
// publicó una versión nueva y avisarle al usuario que recargue la página.
const fs = require('fs');
const path = require('path');

const version = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const destino = path.join(__dirname, '..', 'build', 'version.json');

fs.writeFileSync(destino, JSON.stringify({ version }));
console.log(`version.json escrito con version=${version}`);
