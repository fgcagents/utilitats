📱 Guia per convertir el projecte en PWA
Pas 1: Crear el manifest.json
Creeu un fitxer manifest.json a l'arrel del projecte amb la configuració de la PWA.

Pas 2: Crear el Service Worker
Creeu un fitxer service-worker.js a l'arrel.

Pas 3: Registrar el Service Worker
Afegiu aquest codi a index.html dins de la secció <head> (després del Google Analytics):

<!-- PWA Meta Tags -->
<meta name="theme-color" content="#667eea">
<meta name="description" content="Aplicació web per consultar horaris FGC, calcular devolucions i més">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="FGC utilitats">
<link rel="manifest" href="manifest.json">
<link rel="icon" type="image/png" href="/images/icon-192x192.png">
<link rel="apple-touch-icon" href="/images/icon-192x192.png">

<!-- Register Service Worker -->
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('✓ Service Worker registrat:', registration);
        })
        .catch((error) => {
          console.error('Error al registrar Service Worker:', error);
        });
    });
  }
</script>


Pas 4: Actualitzar altres pàgines
Afegiu les metes PWA i el registre del Service Worker a:

calculadora-devolucions.html
isic.html
cards.html

Pas 5: Crear els icones
Necessiteu generar els icones. Podeu:

Usar herramientas online (imagemagick, convertidor en línia)
Guardar a carpeta /images/:
icon-192x192.png
icon-512x512.png
icon-maskable-192x192.png (versió "maskable" per a Android)
icon-maskable-512x512.png
screenshot-1.png (540x720px)
Pas 6: Configurar servidor (si necessari)
Si serviu per HTTP local, el Service Worker no funciona. Necessiteu:

HTTPS (requit per a PWA en producció)
O usar localhost (funciona sense HTTPS localment)
Pas 7: Provar la PWA
Obriu Chrome/Edge DevTools (F12)
Aneu a Application → Manifest → Verifiqueu que es carregui correctament
Aneu a Application → Service Workers → Verifiqueu l'estat "activated"
Instal·leu l'app des de l'adreça de barra o icona (+)
