# AGENTS.md — Reglas operativas del proyecto

**REGLA NO NEGOCIABLE DE DEPLOY:**

> Ejecutar `node verify-landing.js` antes de cualquier `vercel deploy`. Sin excepciones.

## Checklist pre-deploy
1. Confirmar que `CONFIG.CHECKOUT_URL` en `script.js` tenga el link definitivo de TiendUp.
2. Confirmar que las fotos reales estén cargadas en:
   - `assets/nico.jpg` (4:5, mínimo 800×1000)
   - `assets/casos/ivan.jpg`, `tommy.jpg`, `abner.jpg`, `ale.jpg`, `mauro.jpg`, `guido.jpg`, `ara-y-gabi.jpg`, `sandra.jpg` (cuadradas, mínimo 240×240)
3. Correr `node verify-landing.js` y verificar que termine con código `0`.
