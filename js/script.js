document.documentElement.classList.add('js');

// Ubah detail profil ini untuk mengganti kontak di seluruh halaman.
const profile = {
  email: 'ali.usman@example.com',
  linkedin: '#',
  github: '#'
};

const portfolioData = {
  education: [
    {
      period: '2024 — Sekarang',
      institution: 'Universitas Pamulang',
      degree: 'Pendidikan Tinggi',
      description: 'Sedang menempuh pendidikan di Universitas Pamulang.',
      placeholder: false
    },
    {
      period: '2018 — 2021',
      institution: 'SMKN 1 Pasuruan',
      degree: 'Sekolah Menengah Kejuruan',
      description: 'Menyelesaikan pendidikan menengah kejuruan di Kota Pasuruan.',
      placeholder: false
    },
    {
      period: '2015 — 2017',
      institution: 'MTsN Kota Pasuruan',
      degree: 'Madrasah Tsanawiyah Negeri',
      description: 'Menyelesaikan pendidikan tingkat menengah pertama di Kota Pasuruan.',
      placeholder: false
    }
  ],
  certifications: [
    { issuer: 'EC-Council', name: 'CEH Master', credential: 'Certified Ethical Hacker Master', placeholder: false },
    { issuer: 'Altered Security', name: 'CRTP', credential: 'Certified Red Team Professional', placeholder: false },
    { issuer: 'Altered Security', name: 'CRTE', credential: 'Certified Red Team Expert', placeholder: false },
    { issuer: 'CyberWarFare Labs', name: 'CRTA', credential: 'Certified Red Team Analyst', placeholder: false },
    { issuer: 'INE Security', name: 'eWPTX', credential: 'Web Application Penetration Tester eXtreme', placeholder: false },
    { issuer: 'INE Security', name: 'eCPPT', credential: 'Certified Professional Penetration Tester', placeholder: false },
    { issuer: 'Hack The Box', name: 'Dante Pro Lab', credential: 'Pro Lab Completion', placeholder: false },
    { issuer: 'OffSec', name: 'OSCP+', credential: 'OffSec Certified Professional+', placeholder: false },
    { issuer: 'OffSec', name: 'OSCP', credential: 'OffSec Certified Professional', placeholder: false }
  ],
  principles: [
    { icon: '01', title: 'Think like an attacker', text: 'Menguji asumsi dan alur sistem untuk menemukan jalur risiko yang tidak terlihat dari permukaan.' },
    { icon: '02', title: 'Communicate like a partner', text: 'Menjelaskan temuan secara jernih agar tim teknis dan bisnis dapat mengambil keputusan yang tepat.' },
    { icon: '03', title: 'Act with integrity', text: 'Bekerja sesuai scope, menjaga kerahasiaan data, dan memprioritaskan keamanan di setiap langkah.' }
  ],
  services: [
    { title: 'Web Application Testing', text: 'Pengujian autentikasi, otorisasi, input, logika bisnis, dan konfigurasi aplikasi.' },
    { title: 'API Security Assessment', text: 'Evaluasi endpoint, akses objek, token, rate limit, dan alur integrasi API.' },
    { title: 'Network Penetration Testing', text: 'Pemetaan attack surface, validasi layanan, segmentasi, dan potensi jalur lateral.' },
    { title: 'Security Reporting & Retest', text: 'Bukti reproduksi, prioritas risiko, rekomendasi remediasi, dan validasi perbaikan.' }
  ],
  tools: ['Burp Suite', 'OWASP WSTG', 'Nmap', 'Metasploit', 'Wireshark', 'Linux', 'Python', 'Bash', 'Postman', 'CVSS'],
  projects: [
    { category: 'web', label: 'Web Security', title: 'E-commerce Application Assessment', description: 'Pengujian terarah pada autentikasi, kontrol akses, alur transaksi, dan logika bisnis aplikasi.', tags: ['OWASP', 'Burp Suite', 'Manual Testing'], glow: 'rgba(72,215,242,.15)' },
    { category: 'api', label: 'API Security', title: 'REST API Access Control Review', description: 'Pemetaan endpoint dan pengujian otorisasi tingkat objek, pengelolaan token, serta pembatasan request.', tags: ['REST API', 'AuthZ', 'Postman'], glow: 'rgba(183,243,74,.12)' },
    { category: 'network', label: 'Network Security', title: 'Internal Network Attack Simulation', description: 'Evaluasi eksposur layanan internal, segmentasi jaringan, konfigurasi, dan jalur eskalasi yang relevan.', tags: ['Nmap', 'Enumeration', 'Hardening'], glow: 'rgba(156,116,255,.14)' },
    { category: 'web', label: 'Web Security', title: 'Authentication Flow Evaluation', description: 'Review menyeluruh pada login, reset kredensial, sesi pengguna, dan proteksi terhadap penyalahgunaan akun.', tags: ['Authentication', 'Session', 'Abuse Case'], glow: 'rgba(255,150,89,.12)' }
  ],
  process: [
    { title: 'Scope & rules of engagement', text: 'Menyepakati target, batasan, metode, jadwal, dan jalur komunikasi sebelum pengujian dimulai.' },
    { title: 'Reconnaissance & mapping', text: 'Memahami attack surface, teknologi, role pengguna, serta alur kritis yang perlu diprioritaskan.' },
    { title: 'Testing & validation', text: 'Menggabungkan pengujian manual dan tooling untuk menemukan lalu memvalidasi dampak setiap temuan.' },
    { title: 'Report & remediation', text: 'Menyusun laporan yang bisa direproduksi, memberi konteks risiko, dan rekomendasi perbaikan yang praktis.' },
    { title: 'Retest & closure', text: 'Memastikan remediasi bekerja sesuai harapan dan tidak memperkenalkan risiko baru.' }
  ]
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function renderPortfolio() {
  $('#education-list').innerHTML = portfolioData.education.map(item => `
    <article class="timeline-item ${item.placeholder ? 'is-placeholder' : ''}">
      <span class="timeline-period">${item.period}</span>
      <div><p class="credential-label">${item.placeholder ? 'Lengkapi data' : 'Pendidikan'}</p>
        <h4>${item.institution}</h4><strong>${item.degree}</strong><p>${item.description}</p></div>
    </article>`).join('');

  $('#certification-list').innerHTML = portfolioData.certifications.map(item => `
    <article class="certification-card ${item.placeholder ? 'is-placeholder' : ''}">
      <div class="cert-badge" aria-hidden="true">◇</div><div>
        <p>${item.issuer}</p><h4>${item.name}</h4><span>${item.credential}</span>
      </div><small>${item.placeholder ? 'Lengkapi' : 'Verified'}</small>
    </article>`).join('');

  $('#principles-list').innerHTML = portfolioData.principles.map(item => `
    <article class="principle-card reveal">
      <div class="principle-icon" aria-hidden="true">${item.icon}</div>
      <h3>${item.title}</h3><p>${item.text}</p>
    </article>`).join('');

  $('#service-list').innerHTML = portfolioData.services.map((item, index) => `
    <article class="service-item reveal">
      <span class="service-index">0${index + 1}</span><h3>${item.title}</h3>
      <p>${item.text}</p><span class="service-arrow" aria-hidden="true">↗</span>
    </article>`).join('');

  $('#tool-cloud').innerHTML = portfolioData.tools.map(tool => `<span class="tool-pill">${tool}</span>`).join('');

  $('#projects-list').innerHTML = portfolioData.projects.map((item, index) => `
    <article class="project-card reveal" data-category="${item.category}" style="--card-glow:${item.glow}">
      <div class="project-visual" aria-hidden="true"></div>
      <div class="project-head"><span>0${index + 1} / ${item.label}</span><span aria-hidden="true">↗</span></div>
      <div class="project-body"><h3>${item.title}</h3><p>${item.description}</p>
        <div class="project-tags">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
      </div>
    </article>`).join('');

  $('#process-list').innerHTML = portfolioData.process.map((item, index) => `
    <li class="process-step reveal"><span>0${index + 1}</span><div><h3>${item.title}</h3><p>${item.text}</p></div></li>`).join('');
}

function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    observer.observe(item);
  });
}

function initNavigation() {
  const header = $('.site-header');
  const toggle = $('.menu-toggle');
  const links = $('.nav-links');
  const updateHeader = () => header.classList.toggle('scrolled', scrollY > 30);
  updateHeader();
  addEventListener('scroll', updateHeader, { passive: true });

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    links.classList.toggle('open', !open);
    document.body.classList.toggle('menu-open', !open);
  });
  $$('.nav-links a').forEach(link => link.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('open');
    document.body.classList.remove('menu-open');
  }));
}

function initProjectFilters() {
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    $$('.filter').forEach(filter => filter.classList.remove('is-active'));
    button.classList.add('is-active');
    const filter = button.dataset.filter;
    $$('.project-card').forEach(card => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !visible);
    });
  }));
}

function initClipboard() {
  const button = $('#copy-email');
  const toast = $('#toast');
  button.dataset.email = profile.email;
  $('#email-link').href = `mailto:${profile.email}`;
  $('#linkedin-link').href = profile.linkedin;
  $('#github-link').href = profile.github;
  button.addEventListener('click', async () => {
    const email = button.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      $('.button-label', button).textContent = 'Email tersalin!';
      toast.classList.add('show');
      setTimeout(() => {
        $('.button-label', button).textContent = 'Salin email';
        toast.classList.remove('show');
      }, 2200);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  });
}

function initTerminal() {
  const form = $('#terminal-form');
  const input = $('#terminal-input');
  const output = $('#terminal-output');
  const commands = {
    help: 'Perintah: about, skills, methodology, contact, clear',
    about: 'Ali Usman — Penetration Tester. Curious mind, responsible testing.',
    skills: 'Web • API • Network • Reporting • Retest',
    methodology: 'Scope → Map → Test → Report → Retest',
    contact: profile.email
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    const command = input.value.trim().toLowerCase();
    if (!command) return;
    if (command === 'clear') {
      output.innerHTML = '';
    } else {
      const response = commands[command];
      output.insertAdjacentHTML('beforeend', `<p><span>$</span> ${command}</p><p class="${response ? '' : 'error'}">${response || `command not found: ${command}`}</p>`);
    }
    input.value = '';
    output.scrollTop = output.scrollHeight;
  });
}

function initMotion() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;
  document.addEventListener('pointermove', event => {
    document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`);
  });
  const tilt = $('[data-tilt]');
  tilt.addEventListener('pointermove', event => {
    const rect = tilt.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    tilt.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${y * -4}deg)`;
  });
  tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
}

renderPortfolio();
initReveal();
initNavigation();
initProjectFilters();
initClipboard();
initTerminal();
initMotion();
$('#current-year').textContent = new Date().getFullYear();
