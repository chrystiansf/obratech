// PWA — Service Worker + Install Prompt
// ═══════════════════════════════════════════════════════

// Prompt de instalação PWA
let _pwaPrompt = null;
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  _pwaPrompt = e;
  // Mostrar banner de instalação após 3s
  setTimeout(()=>mostrarBannerPWA(), 3000);
});

window.addEventListener('appinstalled', ()=>{
  _pwaPrompt = null;
  const b = document.getElementById('pwa-banner');
  if(b) b.remove();
  toast('🎉','ObraTech instalado no seu dispositivo!');
});

function mostrarBannerPWA(){
  if(!_pwaPrompt) return;
  if(localStorage.getItem('pwa_dismissed')) return;
  if(document.getElementById('pwa-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'pwa-banner';
  banner.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--primary);color:#fff;border-radius:12px;padding:12px 18px;display:flex;align-items:center;gap:12px;z-index:9999;box-shadow:0 4px 24px rgba(43,92,138,.4);max-width:360px;width:calc(100% - 32px);animation:slideUp .3s ease';
  banner.innerHTML = `
    <span style="font-size:24px"><svg class=ot-i><use href=#i-hard-hat></use></svg></span>
    <div style="flex:1">
      <div style="font-weight:700;font-size:13px">Instalar ObraTech</div>
      <div style="font-size:11px;opacity:.85">Acesse offline direto do celular</div>
    </div>
    <button onclick="instalarPWA()" style="background:white;color:var(--primary);border:none;border-radius:8px;padding:7px 14px;font-weight:700;font-size:12px;cursor:pointer">Instalar</button>
    <button onclick="dispensarPWA()" style="background:transparent;border:none;color:white;font-size:18px;cursor:pointer;padding:0 4px;line-height:1"><svg class=ot-i><use href=#i-x></use></svg></button>
  `;
  document.body.appendChild(banner);
}

async function instalarPWA(){
  if(!_pwaPrompt) return;
  _pwaPrompt.prompt();
  const {outcome} = await _pwaPrompt.userChoice;
  if(outcome==='accepted') toast('✅','Instalando ObraTech...');
  _pwaPrompt = null;
  const b = document.getElementById('pwa-banner');
  if(b) b.remove();
}

function dispensarPWA(){
  localStorage.setItem('pwa_dismissed','1');
  const b = document.getElementById('pwa-banner');
  if(b) b.style.animation='slideDown .3s ease forwards';
  setTimeout(()=>b?.remove(), 300);
}

// Detectar se já está instalado como PWA
if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone){
  document.documentElement.classList.add('pwa-mode');
  console.log('Rodando como PWA instalado');
}

(function(){
  // Ícone em base64 para evitar conflito do parser HTML com tags SVG em strings JS
  const manifest = {
    name: 'OBRATECH — Gestão de Obras',
    short_name: 'OBRATECH',
    description: 'Sistema de gestão de obras para construtoras brasileiras',
    start_url: window.location.origin+'/',
    display: 'standalone',
    background_color: '#1C1F24',
    theme_color: '#1C1F24',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    icons: [
      { src: window.location.origin+'/brand/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: window.location.origin+'/brand/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: window.location.origin+'/brand/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: window.location.origin+'/brand/logo/app-icon-escuro.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
    ],
    shortcuts: [
      { name: 'Dashboard', url: window.location.origin+'/' },
      { name: 'RDO', url: window.location.origin+'/' },
      { name: 'Obras', url: window.location.origin+'/' }
    ]
  };
  const blob = new Blob([JSON.stringify(manifest)], {type:'application/manifest+json'});
  const url = URL.createObjectURL(blob);
  const link = document.querySelector('link[rel="manifest"]') || document.createElement('link');
  link.rel = 'manifest';
  link.href = url;
  if(!link.parentNode) document.head.appendChild(link);
})();
