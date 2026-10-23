#!/usr/bin/env node
/**
 * verify-landing.js — Blindaje pre-deploy para Control Remoto
 * Ejecutar: node verify-landing.js antes de cualquier vercel deploy.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const errors = [];

function checkFileNonEmpty(filename) {
  const fullPath = path.join(ROOT, filename);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Falta el archivo obligatorio: ${filename}`);
    return '';
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (!content || !content.trim()) {
    errors.push(`El archivo obligatorio está vacío: ${filename}`);
    return '';
  }
  return content;
}

const html = checkFileNonEmpty('index.html');
const termsHtml = checkFileNonEmpty('terminos.html');
const css = checkFileNonEmpty('styles.css');
const js = checkFileNonEmpty('script.js');

if (html) {
  // Strip HTML comments before inspecting tags so comments don't trigger false positives
  const htmlNoComments = html.replace(/<!--[\s\S]*?-->/g, '');

  // 1. Stylesheet and script links
  if (!/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']styles\.css(\?[^"']*)?["'][^>]*>/i.test(htmlNoComments) &&
      !/<link\s+[^>]*href=["']styles\.css(\?[^"']*)?["'][^>]*rel=["']stylesheet["'][^>]*>/i.test(htmlNoComments)) {
    errors.push('Falta <link rel="stylesheet" href="styles.css"> en index.html');
  }

  if (!/<script\s+[^>]*src=["']script\.js(\?[^"']*)?["'][^>]*>\s*<\/script>/i.test(htmlNoComments)) {
    errors.push('Falta <script src="script.js"></script> en index.html');
  }

  // 2. Document structure
  if (!/<!DOCTYPE\s+html>/i.test(htmlNoComments)) {
    errors.push('Falta <!DOCTYPE html> en index.html');
  }
  if (!/<head[\s>]/i.test(htmlNoComments) || !/<\/head>/i.test(htmlNoComments)) {
    errors.push('Falta <head> o </head> en index.html');
  }
  if (!/<body[\s>]/i.test(htmlNoComments) || !/<\/body>/i.test(htmlNoComments)) {
    errors.push('Falta <body> o </body> en index.html');
  }

  // 3. lang="es-AR"
  if (!/<html[^>]*\blang=["']es-AR["'][^>]*>/i.test(htmlNoComments)) {
    errors.push('Falta lang="es-AR" en la etiqueta <html>');
  }

  // 4. Meta Pixel 1168146992014424
  if (!htmlNoComments.includes('1168146992014424')) {
    errors.push('Falta el Pixel de Meta 1168146992014424 en index.html');
  }

  // 5. Placeholders prohibidos
  if (/href\s*=\s*["']#["']/i.test(htmlNoComments)) {
    errors.push('Se encontró un enlace prohibido con href="#" en index.html');
  }
  if (/lorem\s+ipsum/i.test(htmlNoComments)) {
    errors.push('Se encontró texto "lorem ipsum" en index.html');
  }
  if (/company\s+name/i.test(htmlNoComments)) {
    errors.push('Se encontró texto "Company Name" en index.html');
  }

  // 6. Todas las etiquetas <img> deben tener width, height y alt
  const imgTags = htmlNoComments.match(/<img\b[^>]*>/gi) || [];
  imgTags.forEach((tag, idx) => {
    const hasWidth = /\bwidth\s*=\s*["'][^"']+["']/i.test(tag);
    const hasHeight = /\bheight\s*=\s*["'][^"']+["']/i.test(tag);
    const hasAlt = /\balt\s*=\s*["'][^"']+["']/i.test(tag);
    if (!hasWidth || !hasHeight || !hasAlt) {
      errors.push(
        `La etiqueta <img> #${idx + 1} (${tag}) no tiene width, height o alt completos`
      );
    }
  });
}

if (js) {
  // Check CONFIG.CHECKOUT_URL is not empty and not placeholder
  const checkoutMatch = js.match(/CHECKOUT_URL\s*:\s*["']([^"']*)["']/);
  if (!checkoutMatch || !checkoutMatch[1].trim() || checkoutMatch[1].trim() === 'https://tiendup.com') {
    errors.push(
      'CONFIG.CHECKOUT_URL no tiene el link definitivo de TiendUp en script.js.'
    );
  }
}

// 7. Verificar existencia de las 9 fotos reales (Nico + 8 casos)
const requiredPhotos = [
  'assets/nico.jpg',
  'assets/casos/ivan.jpg',
  'assets/casos/tommy.jpg',
  'assets/casos/abner.jpg',
  'assets/casos/ale.jpg',
  'assets/casos/mauro.jpg',
  'assets/casos/guido.jpg',
  'assets/casos/ara-y-gabi.jpg',
  'assets/casos/sandra.jpg',
];
requiredPhotos.forEach((photoRelPath) => {
  const fullPhotoPath = path.join(ROOT, photoRelPath);
  if (!fs.existsSync(fullPhotoPath) || fs.statSync(fullPhotoPath).size < 1024) {
    errors.push(`Falta o es inválida la foto requerida: ${photoRelPath}`);
  }
});

if (errors.length > 0) {
  console.error('\n❌ VERIFICACIÓN PRE-DEPLOY FALLIDA:\n');
  errors.forEach((err) => console.error(`  - ${err}`));
  console.error('\nCorregí los puntos anteriores antes de correr vercel deploy.\n');
  process.exit(1);
} else {
  console.log('\n✅ VERIFICACIÓN PRE-DEPLOY EXITOSA: Todos los controles pasaron.\n');
  process.exit(0);
}
