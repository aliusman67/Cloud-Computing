document.documentElement.classList.add('js');

const writeupProfile = { email: 'ali.usman@example.com' };

const writeups = [
  {
    title: 'Tutorial Bypass SSL Pinning di Windows OS',
    excerpt: 'Tutorial konfigurasi Frida pada Windows untuk menguji dan melewati certificate pinning pada aplikasi Android.',
    category: 'Mobile Security',
    date: '28 Agu 2021',
    readTime: '4 min read',
    tags: ['SSL Pinning', 'Frida', 'Android'],
    url: 'https://medium.com/@aliusmanclay67/tutorial-bypass-ssl-pinning-di-windows-os-indonesian-version-9eaf3567f8e9',
    placeholder: false
  },
  {
    title: 'Weaponizing TTP T1189: Macro Injection',
    excerpt: 'Simulasi initial compromise dengan menyisipkan macro pada dokumen Word dan membangun koneksi ke C2.',
    category: 'Red Team',
    date: '27 Feb 2025',
    readTime: '5 min read',
    tags: ['T1189', 'Cobalt Strike', 'Macro'],
    url: 'https://medium.com/@aliusmanclay67/weaponizing-ttp-t1189-intial-compromise-backdooring-legitimate-word-document-use-macro-injection-9fa6cada0533',
    placeholder: false
  },
  {
    title: 'Hack The Box: Office',
    excerpt: 'Catatan eksploitasi mesin Office dari proses enumerasi, initial access, hingga privilege escalation.',
    category: 'CTF / Lab',
    date: 'Medium',
    readTime: 'Walkthrough',
    tags: ['Hack The Box', 'Active Directory', 'Windows'],
    url: 'https://medium.com/@aliusmanclay67/hackthebox-office-1f8f964e600d',
    placeholder: false
  },
  {
    title: 'Detective Conan Series: Malware Analisis dari Undangan APK',
    excerpt: 'Analisis teknis aplikasi undangan APK berbahaya untuk memahami perilaku, indikator, dan alur serangannya.',
    category: 'Malware Analysis',
    date: 'Medium',
    readTime: 'Case study',
    tags: ['Android Malware', 'APK', 'Reverse Engineering'],
    url: 'https://medium.com/@aliusmanclay67/detective-conan-series-malware-analisis-dari-undangan-apk-7c876243d4df',
    placeholder: false
  },
  {
    title: 'CTF Uconnect: Proksi Masbro',
    excerpt: 'Write-up challenge Uconnect yang mendokumentasikan proses analisis, eksploitasi, dan penyelesaian flag.',
    category: 'CTF / Lab',
    date: 'Medium',
    readTime: 'Write-up',
    tags: ['CTF', 'Uconnect', 'Exploitation'],
    url: 'https://medium.com/@aliusmanclay67/ctf-uconnect-proksi-masbro-4a069b351969',
    placeholder: false
  }
];

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
let activeCategory = 'Semua';

function renderFilters() {
  const categories = ['Semua', ...new Set(writeups.map(item => item.category))];
  $('#writeup-filters').innerHTML = categories.map(category =>
    `<button class="filter ${category === activeCategory ? 'is-active' : ''}" type="button" data-category="${category}">${category}</button>`
  ).join('');
}

function renderWriteups() {
  const query = $('#writeup-search').value.trim().toLowerCase();
  const results = writeups.filter(item => {
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const searchable = [item.title, item.excerpt, item.category, ...item.tags].join(' ').toLowerCase();
    return matchesCategory && searchable.includes(query);
  });

  $('#writeup-count').textContent = String(writeups.filter(item => !item.placeholder).length).padStart(2, '0');
  $('#writeup-empty').hidden = results.length > 0;
  $('#writeup-list').innerHTML = results.map((item, index) => `
    <article class="writeup-row ${item.placeholder ? 'is-placeholder' : ''}">
      <div class="writeup-index">${String(index + 1).padStart(2, '0')}</div>
      <div class="writeup-content">
        <div class="writeup-meta"><span>${item.category}</span><span>${item.date}</span><span>${item.readTime}</span></div>
        <h2>${item.title}</h2><p>${item.excerpt}</p>
        <div class="project-tags">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
      </div>
      ${item.placeholder
        ? '<span class="writeup-action disabled">Template <b>○</b></span>'
        : `<a class="writeup-action" href="${item.url}" target="_blank" rel="noopener noreferrer" aria-label="Baca ${item.title} di Medium">Baca <b>↗</b></a>`}
    </article>`).join('');
}

function initControls() {
  $('#writeup-filters').addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    renderFilters();
    renderWriteups();
  });
  $('#writeup-search').addEventListener('input', renderWriteups);
}

function initNavigation() {
  const toggle = $('.menu-toggle');
  const links = $('.nav-links');
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

function initReveal() {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.1 });
  $$('.reveal').forEach(item => observer.observe(item));
}

function initMotion() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointermove', event => {
    document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`);
  });
}

renderFilters();
renderWriteups();
initControls();
initNavigation();
initReveal();
initMotion();
$('#writeup-email').href = `mailto:${writeupProfile.email}`;
$('#current-year').textContent = new Date().getFullYear();
