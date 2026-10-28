import './styles/main.css';
import {
  RESUME_DATA,
  GameEngineItem,
  ProjectItem,
  PublishedGameItem,
  SkillCategory,
} from './data/resumeData';
import { MinerGameCanvas, SectorAnchor } from './engine/MinerGameCanvas';
import { minerSfx } from './audio/sfx';

function renderGameEngines(engines: GameEngineItem[]): string {
  return `
    <div class="skill-group">
      <div class="skill-group-title">Game Engines</div>
      <div class="engine-grid">
        ${engines
          .map(
            (eng) => `
          <div class="engine-badge">
            <span class="engine-logo-box">
              <img src="${eng.logoUrl}" alt="${eng.name} logo" class="engine-logo-img" />
            </span>
            <span class="engine-name">${eng.name}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function renderSkillGroups(groups: SkillCategory[]): string {
  return groups
    .map(
      (g) => `
      <div class="skill-group">
        <div class="skill-group-title">${g.title}</div>
        <div class="skill-pills">
          ${g.items
            .map(
              (skill) =>
                `<span class="skill-pill ${g.accent ? 'skill-pill--accent' : ''} ${skill.iconUrl ? 'skill-pill--with-icon' : ''}">${
                  skill.iconUrl
                    ? `<img src="${skill.iconUrl}" alt="" class="skill-pill-icon" aria-hidden="true" />`
                    : ''
                }<span>${skill.name}</span></span>`
            )
            .join('')}
        </div>
      </div>
    `
    )
    .join('');
}

function renderProjectCard(proj: ProjectItem): string {
  const videoEmbed = proj.youtubeId
    ? `
      <div class="project-video-container">
        <iframe
          class="project-video-iframe"
          src="https://www.youtube-nocookie.com/embed/${proj.youtubeId}?rel=0"
          title="${proj.title} Demo Video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>
    `
    : '';

  return `
    <article class="chamber-card">
      <div class="project-top">
        <div>
          <h3 class="project-name">${proj.title}</h3>
          <div class="project-sub">${proj.subtitle}</div>
        </div>
        ${proj.highlightStat ? `<span class="stat-badge">${proj.highlightStat}</span>` : ''}
      </div>
      ${videoEmbed}
      <div class="project-tech">
        ${proj.tech.map((t) => `<span class="tech-tag">${t}</span>`).join('')}
      </div>
      <ul class="bullet-list">
        ${proj.bullets.map((b) => `<li>${b}</li>`).join('')}
      </ul>
      <div class="project-footer">
        ${
          proj.youtubeUrl
            ? `<a class="chip-link chip-link--primary" href="${proj.youtubeUrl}" target="_blank" rel="noopener noreferrer">
                 <span>▶ Watch on YouTube</span>
               </a>`
            : ''
        }
        <a class="chip-link" href="${proj.githubUrl}" target="_blank" rel="noopener noreferrer">
          <img src="/icons/github.svg" alt="" class="btn-inline-icon" aria-hidden="true" />
          <span>GitHub</span>
        </a>
      </div>
    </article>
  `;
}

function renderPublishedGameCard(game: PublishedGameItem): string {
  return `
    <article class="chamber-card">
      <div class="published-game-top">
        <a
          href="${game.playStoreUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="game-logo-wrap"
          aria-label="Open ${game.title} on Google Play"
        >
          <img
            src="${game.logoUrl}"
            alt="${game.title} official game logo"
            class="game-logo-img"
            loading="lazy"
          />
        </a>
        <div class="published-game-meta">
          <div class="published-game-title-row">
            <h3 class="project-name">${game.title}</h3>
            <span class="stat-badge">${game.badge}</span>
          </div>
          <div class="project-sub">${game.studio} • ${game.genre}</div>
          <div class="project-tech published-game-tags">
            ${game.tech.map((t) => `<span class="tech-tag">${t}</span>`).join('')}
          </div>
        </div>
      </div>
      <ul class="bullet-list">
        ${game.bullets.map((b) => `<li>${b}</li>`).join('')}
      </ul>
      <div class="project-footer">
        <a
          class="chip-link chip-link--primary"
          href="${game.playStoreUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/icons/googleplay.svg" alt="" class="btn-inline-icon" aria-hidden="true" />
          <span>Google Play</span>
        </a>
      </div>
    </article>
  `;
}

function buildAppHTML(): string {
  const d = RESUME_DATA;

  return `
    <canvas id="mine-canvas" aria-hidden="true"></canvas>

    <!-- Top Game HUD Header -->
    <header class="hud-topbar">
      <a href="#sector-surface" class="hud-brand">
        <span class="hud-name">${d.name}</span>
        <span class="hud-slash">//</span>
        <span class="hud-role">${d.shortTitle}</span>
      </a>

      <div class="hud-telemetry">
        <div class="hud-actions">
          <button type="button" id="btn-sfx" class="hud-btn hud-btn--speaker" title="Toggle Sound (Mute/Unmute)" aria-label="Toggle Sound">
            <span id="btn-sfx-icon" aria-hidden="true">🔊</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Right-Edge Scroll & Depth Ruler -->
    <aside class="depth-ruler" aria-label="Mine Depth Progress">
      <div class="scroll-prompt-tag">
        SCROLL TO DIG<br />CLICK BATS
      </div>
      <div class="ruler-track">
        <div id="ruler-fill" class="ruler-fill"></div>
        ${d.milestones
          .map((m, idx) => {
            const pct = (idx / (d.milestones.length - 1)) * 94 + 2;
            return `<button type="button" class="ruler-node ${idx === 0 ? 'is-active' : ''}" style="top: ${pct}%" data-jump-target="${m.id}" data-ruler-node="${m.id}">${m.depthMeters}m</button>`;
          })
          .join('')}
      </div>
    </aside>

    <!-- Main Subterranean World -->
    <main class="mine-world">
      <!-- 0m: SURFACE ENTRANCE -->
      <section id="sector-surface" class="sector-row sector-row--surface is-unlocked" data-sector-id="sector-surface">
        <div class="ledge-col">
          <article class="chamber-card">
            <h1 class="chamber-title" style="font-size: 2.15rem">${d.name}</h1>
            <p class="hero-headline">${d.headline}</p>
            <p class="hero-headline" style="margin-bottom: 12px; font-size: 0.88rem">
              Unity &amp; OpenXR gameplay systems, physics VR combat, commercial mobile games, and custom C# engine architecture.
            </p>
            <div class="contact-grid">
              <a class="chip-link chip-link--primary" href="${d.links.github}" target="_blank" rel="noopener noreferrer">
                <img src="/icons/github.svg" alt="" class="btn-inline-icon" aria-hidden="true" />
                <span>GitHub</span>
              </a>
              <button type="button" class="chip-link" id="btn-copy-email" data-email="${d.email}">
                ✉ Copy Email
              </button>
              <a class="chip-link" href="tel:+917451042661">
                ☎ ${d.phone}
              </a>
            </div>
          </article>
        </div>

        <div class="shaft-spacer">
          <span class="shaft-depth-marker">0m // SCROLL DOWN TO EXCAVATE</span>
        </div>

        <div class="ledge-col">
          <article class="chamber-card">
            <h2 class="chamber-title">Highlights</h2>
            <ul class="bullet-list">
              <li><strong>Game Dev Intern @ IDZ Digital</strong>, <strong>Game Dev @ Drox Studio</strong> &amp; <strong>VR Lead @ AIT GDXR Club</strong>.</li>
              <li><strong>Contributed to 3 commercial mobile games</strong> on Google Play across arcade action, 3D vehicle stunts &amp; casual salon games.</li>
              <li><strong>1st Runner-up</strong> at IIIT Delhi × IGDA Game Jam &amp; <strong>2nd Runner-up</strong> at Arcade AR.</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- -110m: TECHNICAL SKILLS -->
      <section id="sector-skills" class="sector-row" data-sector-id="sector-skills">
        <div class="ledge-col">
          <article class="chamber-card">
            <h2 class="chamber-title">Game &amp; XR Skills</h2>
            ${renderGameEngines(d.gameEngines)}
            ${renderSkillGroups(d.skillCategoriesLeft)}
          </article>
        </div>

        <div class="shaft-spacer">
          <span class="shaft-depth-marker">-110m // SKILLS STRATA</span>
        </div>

        <div class="ledge-col">
          <article class="chamber-card">
            <h2 class="chamber-title">Languages &amp; Tech Stack</h2>
            ${renderSkillGroups(d.skillCategoriesRight)}
          </article>
        </div>
      </section>

      <!-- -240m: EXPERIENCE & EDUCATION -->
      <section id="sector-experience" class="sector-row" data-sector-id="sector-experience">
        <div class="ledge-col">
          <article class="chamber-card">
            <h2 class="chamber-title">Experience</h2>
            ${d.experience
              .map(
                (exp) => `
                <div class="timeline-item">
                  <div class="timeline-top">
                    <span class="timeline-role">${exp.role}</span>
                    <span class="timeline-period">${exp.period}</span>
                  </div>
                  <div class="timeline-org">${exp.company} • ${exp.location}</div>
                  <ul class="bullet-list">
                    ${exp.bullets.map((b) => `<li>${b}</li>`).join('')}
                  </ul>
                </div>
              `
              )
              .join('')}
          </article>
        </div>

        <div class="shaft-spacer">
          <span class="shaft-depth-marker">-230m // EXPERIENCE &amp; EDU</span>
        </div>

        <div class="ledge-col">
          <article class="chamber-card">
            <h2 class="chamber-title">Education</h2>
            ${d.education
              .map(
                (edu) => `
                <div class="timeline-item">
                  <div class="timeline-top">
                    <span class="timeline-role">${edu.institution}</span>
                    ${edu.period ? `<span class="timeline-period">${edu.period}</span>` : ''}
                  </div>
                  <div class="timeline-org">${edu.degree} • ${edu.location}</div>
                  <ul class="bullet-list">
                    ${edu.bullets.map((b) => `<li>${b}</li>`).join('')}
                  </ul>
                </div>
              `
              )
              .join('')}
          </article>
        </div>
      </section>

      <!-- -350m: PUBLISHED GAMES WORKED ON (GOOGLE PLAY) -->
      <section id="sector-published-games" class="sector-row" data-sector-id="sector-published-games">
        <div class="ledge-col">
          <div class="ledge-heading">
            <h2 class="chamber-title">Games Worked On</h2>
            <p class="ledge-sub">Published commercial titles live on Google Play</p>
          </div>
          ${renderPublishedGameCard(d.publishedGames[0])}
          ${renderPublishedGameCard(d.publishedGames[1])}
        </div>

        <div class="shaft-spacer">
          <span class="shaft-depth-marker">-350m // GAMES WORKED ON</span>
        </div>

        <div class="ledge-col">
          <div class="ledge-heading ledge-heading--desktop-only">
            <h2 class="chamber-title">Live on Google Play</h2>
            <p class="ledge-sub">Official Play Store releases &amp; interactive gameplay</p>
          </div>
          ${renderPublishedGameCard(d.publishedGames[2])}
        </div>
      </section>

      <!-- -490m: VR PROJECTS -->
      <section id="sector-games" class="sector-row" data-sector-id="sector-games">
        <div class="ledge-col">
          <div class="ledge-heading">
            <h2 class="chamber-title">VR Projects</h2>
            <p class="ledge-sub">Immersive OpenXR Physical Interactions &amp; Economy Simulation</p>
          </div>
          ${renderProjectCard(d.gameProjects[0])}
        </div>

        <div class="shaft-spacer">
          <span class="shaft-depth-marker">-490m // VR PROJECTS</span>
        </div>

        <div class="ledge-col">
          <div class="ledge-heading ledge-heading--desktop-only">
            <h2 class="chamber-title">VR Projects</h2>
            <p class="ledge-sub">Physics-Driven Haptic Combat &amp; Dynamic AI</p>
          </div>
          ${renderProjectCard(d.gameProjects[1])}
        </div>
      </section>

      <!-- -620m: SOFTWARE & BACKEND SYSTEMS -->
      <section id="sector-software" class="sector-row" data-sector-id="sector-software">
        <div class="ledge-col">
          <div class="ledge-heading">
            <h2 class="chamber-title">Media Automation</h2>
            <p class="ledge-sub">Batch Video &amp; Asset Transcoding Pipeline</p>
          </div>
          ${renderProjectCard(d.softwareProjects[0])}
        </div>

        <div class="shaft-spacer">
          <span class="shaft-depth-marker">-620m // SOFTWARE &amp; SYSTEMS</span>
        </div>

        <div class="ledge-col">
          <div class="ledge-heading ledge-heading--desktop-only">
            <h2 class="chamber-title">Backend Architecture</h2>
            <p class="ledge-sub">Double-Entry ACID Financial Ledger Engine</p>
          </div>
          ${renderProjectCard(d.softwareProjects[1])}
        </div>
      </section>

      <!-- -750m: TROPHIES & CRIMSON CORE -->
      <section id="sector-achievements" class="sector-row" data-sector-id="sector-achievements" style="margin-bottom: 60px">
        <div class="ledge-col">
          <article class="chamber-card">
            <h2 class="chamber-title">Game Jams &amp; Competitions</h2>
            ${d.achievements
              .slice(0, 3)
              .map(
                (a) => `
                <div class="achievement-item">
                  <span class="achievement-badge">${a.badge}</span>
                  <div>
                    <div class="achievement-title">${a.title}</div>
                    <div class="achievement-detail">${a.detail}</div>
                  </div>
                </div>
              `
              )
              .join('')}
          </article>
        </div>

        <div class="shaft-spacer">
          <span class="shaft-depth-marker">-750m // HALL OF RELICS</span>
        </div>

        <div class="ledge-col">
          <article class="chamber-card">
            <h2 class="chamber-title">National Hackathons</h2>
            ${d.achievements
              .slice(3)
              .map(
                (a) => `
                <div class="achievement-item">
                  <span class="achievement-badge">${a.badge}</span>
                  <div>
                    <div class="achievement-title">${a.title}</div>
                    <div class="achievement-detail">${a.detail}</div>
                  </div>
                </div>
              `
              )
              .join('')}
          </article>
        </div>
      </section>

      <!-- -750m: THE CRIMSON CORE FINALE -->
      <footer class="core-finale">
        <h2 class="chamber-title" style="font-size: 2rem">
          Ready to Build Next-Gen Games &amp; XR Worlds Together?
        </h2>
        <p class="hero-headline" style="margin: 8px auto 0; max-width: 580px">
          ${d.email} &nbsp;•&nbsp; ${d.phone} &nbsp;•&nbsp; Pune, Maharashtra
        </p>
        <div class="contact-grid">
          <a class="chip-link chip-link--primary" href="mailto:${d.email}">
            ✉ Email Pankaj
          </a>
          <a class="chip-link" href="${d.links.github}" target="_blank" rel="noopener noreferrer">
            <img src="/icons/github.svg" alt="" class="btn-inline-icon" aria-hidden="true" />
            <span>GitHub</span>
          </a>
          <a class="chip-link" href="${d.links.pdfDownload}" download="Pankaj_Kumar_CV.pdf">
            Download CV (PDF)
          </a>
        </div>
      </footer>
    </main>

    <!-- Bottom-Left Excavation Achievement Toast -->
    <div id="excavation-toast" class="excavation-toast" role="status" aria-live="polite"></div>
  `;
}

function initPortfolioApp(): void {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;
  appRoot.innerHTML = buildAppHTML();

  const canvas = document.getElementById('mine-canvas') as HTMLCanvasElement;
  const depthValueEl = document.getElementById('hud-depth-value');
  const rulerFillEl = document.getElementById('ruler-fill');
  const toastEl = document.getElementById('excavation-toast');
  const btnSfx = document.getElementById('btn-sfx') as HTMLButtonElement | null;
  const btnCopyEmail = document.getElementById('btn-copy-email') as HTMLButtonElement | null;

  let toastTimeout = 0;
  function showToast(msg: string): void {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2400);
  }

  function unlockDomSector(sectorId: string): void {
    const sec = document.querySelector<HTMLElement>(`[data-sector-id="${sectorId}"]`);
    if (!sec || sec.classList.contains('is-unlocked')) return;

    sec.classList.add('is-unlocked');

    const milestone = RESUME_DATA.milestones.find((m) => m.id === sectorId);
    if (milestone && milestone.depthMeters !== 0) {
      showToast(`⛏ ${milestone.lootText}`);
    }
  }

  const batsValueEl = document.getElementById('hud-bats-value');

  function updateAudioButtonUI(isOn: boolean): void {
    if (!btnSfx) return;
    btnSfx.classList.remove('hud-btn--audio-ready');
    const icon = btnSfx.querySelector('#btn-sfx-icon');
    if (icon) {
      icon.textContent = isOn ? '🔊' : '🔇';
    }
    btnSfx.title = isOn ? 'Sound: On (Click to Mute)' : 'Sound: Muted (Click to Unmute)';
    btnSfx.setAttribute('aria-label', isOn ? 'Mute sound' : 'Unmute sound');
    btnSfx.classList.toggle('is-muted', !isOn);
  }

  let userManuallyToggledAudio = false;
  function cleanupGestureAudioListeners(): void {
    window.removeEventListener('pointerdown', resumeDefaultAudio, true);
    window.removeEventListener('touchstart', resumeDefaultAudio, true);
    window.removeEventListener('keydown', resumeDefaultAudio, true);
    window.removeEventListener('wheel', resumeDefaultAudio, true);
    window.removeEventListener('scroll', resumeDefaultAudio, true);
  }

  function resumeDefaultAudio(e: Event): void {
    if (userManuallyToggledAudio || !minerSfx.enabled) {
      cleanupGestureAudioListeners();
      return;
    }
    if (btnSfx && e.target instanceof Node && btnSfx.contains(e.target)) return;
    minerSfx.resumeIfEnabled().then((playing) => {
      if (playing) {
        cleanupGestureAudioListeners();
      }
    });
  }

  // Sound is ON by default — start immediately on load, and keep fallback listeners active until BGM is playing
  updateAudioButtonUI(true);
  minerSfx.resumeIfEnabled().then((playing) => {
    if (playing) {
      cleanupGestureAudioListeners();
    }
  });

  window.addEventListener('pointerdown', resumeDefaultAudio, { capture: true, passive: true });
  window.addEventListener('touchstart', resumeDefaultAudio, { capture: true, passive: true });
  window.addEventListener('keydown', resumeDefaultAudio, { capture: true, passive: true });
  window.addEventListener('wheel', resumeDefaultAudio, { capture: true, passive: true });
  window.addEventListener('scroll', resumeDefaultAudio, { capture: true, passive: true });

  const engine = new MinerGameCanvas(canvas, {
    onSectorBreach: (sectorId) => {
      unlockDomSector(sectorId);
    },
    onDepthUpdate: (depthMeters, progress) => {
      if (depthValueEl) {
        depthValueEl.textContent = `${depthMeters}m`;
      }
      if (rulerFillEl) {
        rulerFillEl.style.height = `${Math.round(progress * 100)}%`;
      }
    },
    onBatKilled: (totalKilled) => {
      if (batsValueEl) {
        batsValueEl.textContent = `${totalKilled}`;
      }
    },
  });

  function computeSectorAnchors(): void {
    const anchors: SectorAnchor[] = RESUME_DATA.milestones.map((m) => {
      const el = document.getElementById(m.id);
      const rectTop = el ? el.getBoundingClientRect().top + window.scrollY : 0;
      const isAlreadyUnlocked = el ? el.classList.contains('is-unlocked') : m.depthMeters === 0;
      return {
        id: m.id,
        worldY: rectTop + 36,
        depthMeters: m.depthMeters,
        enemyType: m.enemyType,
        lootText: m.lootText,
        breached: isAlreadyUnlocked,
      };
    });
    engine.setSectors(anchors);
  }

  // Recompute anchors after initial layout & fonts settle
  computeSectorAnchors();
  window.addEventListener('resize', () => {
    window.requestAnimationFrame(computeSectorAnchors);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(computeSectorAnchors).catch(() => {});
  }

  // Sound On/Off Toggle
  btnSfx?.addEventListener('click', () => {
    userManuallyToggledAudio = true;
    const on = minerSfx.toggle();
    updateAudioButtonUI(on);
    showToast(on ? 'Sound On' : 'Sound Off');
  });

  // Depth Ruler quick-jump buttons
  document.querySelectorAll<HTMLButtonElement>('[data-jump-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.jumpTarget;
      const el = targetId ? document.getElementById(targetId) : null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Active state on ruler nodes while scrolling
  window.addEventListener(
    'scroll',
    () => {
      const scrollCenter = window.scrollY + window.innerHeight * 0.45;
      let activeId = RESUME_DATA.milestones[0].id;
      for (const m of RESUME_DATA.milestones) {
        const el = document.getElementById(m.id);
        if (el && el.offsetTop <= scrollCenter) {
          activeId = m.id;
        }
      }
      document.querySelectorAll<HTMLElement>('[data-ruler-node]').forEach((node) => {
        node.classList.toggle('is-active', node.dataset.rulerNode === activeId);
      });
    },
    { passive: true }
  );

  // Copy Email button
  btnCopyEmail?.addEventListener('click', () => {
    const email = btnCopyEmail.dataset.email || RESUME_DATA.email;
    navigator.clipboard
      ?.writeText(email)
      .then(() => {
        btnCopyEmail.textContent = '✓ Copied Email!';
        showToast(`📋 Copied ${email}`);
        setTimeout(() => {
          btnCopyEmail.textContent = '✉ Copy Email';
        }, 2000);
      })
      .catch(() => {
        window.location.href = `mailto:${email}`;
      });
  });
}

initPortfolioApp();
