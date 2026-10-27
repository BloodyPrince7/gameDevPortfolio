export interface SkillItem {
  name: string;
  iconUrl?: string;
}

export interface SkillCategory {
  title: string;
  accent?: boolean;
  items: SkillItem[];
}

export interface GameEngineItem {
  name: string;
  logoUrl: string;
}

export interface EducationItem {
  institution: string;
  location: string;
  degree: string;
  period?: string;
  bullets: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface ProjectItem {
  title: string;
  subtitle: string;
  category: 'game' | 'software';
  tech: string[];
  bullets: string[];
  githubUrl: string;
  highlightStat?: string;
}

export interface PublishedGameItem {
  title: string;
  studio: string;
  genre: string;
  logoUrl: string;
  playStoreUrl: string;
  badge: string;
  tech: string[];
  bullets: string[];
}

export interface AchievementItem {
  badge: string;
  title: string;
  detail: string;
}

export interface DepthMilestone {
  id: string;
  depthMeters: number;
  label: string;
  enemyType: 'bats' | 'golem' | 'skeleton' | 'spider' | 'boss';
  lootText: string;
}

export const RESUME_DATA = {
  name: 'Pankaj Kumar',
  shortTitle: 'GAME & XR DEVELOPER',
  headline: 'Game Development  |  C# / Unity  |  VR',
  phone: '+91 7451042661',
  email: 'pankajkumar_240666@aitpune.edu.in',
  links: {
    github: 'https://github.com/BloodyPrince7',
    pdfDownload: '/Pankaj_Kumar_CV.pdf',
  },
  education: [
    {
      institution: 'Army Institute of Technology',
      location: 'Pune, Maharashtra',
      degree: 'B.E. in Electronics & Telecommunication Engineering',
      period: '2024 – 2028',
      bullets: ['CGPA (Sem I–IV): 7.82 / 10'],
    },
    {
      institution: 'Army Public School',
      location: 'Mathura Cantt',
      degree: 'Senior Secondary & High School (CBSE)',
      bullets: [
        'Class XII: 80%',
        'Class X: 94.60%',
      ],
    },
  ] as EducationItem[],
  gameEngines: [
    {
      name: 'Unity',
      logoUrl: '/engines/unity.svg',
    },
    {
      name: 'Unreal Engine',
      logoUrl: '/engines/unreal.svg',
    },
  ] as GameEngineItem[],
  skillCategoriesLeft: [
    {
      title: '3D, XR & Platforms',
      accent: true,
      items: [
        { name: 'OpenXR', iconUrl: '/icons/khronos.svg' },
        { name: 'VR / Quest', iconUrl: '/icons/meta.svg' },
        { name: 'Blender', iconUrl: '/icons/blender.svg' },
        { name: 'Android', iconUrl: '/icons/android.svg' },
      ],
    },
    {
      title: 'Gameplay Core',
      accent: true,
      items: [
        { name: 'Physics & Ragdolls' },
        { name: 'FSM AI' },
        { name: 'XR Toolkit' },
        { name: 'URP' },
      ],
    },
  ] as SkillCategory[],
  skillCategoriesRight: [
    {
      title: 'Languages',
      accent: true,
      items: [
        { name: 'C#', iconUrl: '/icons/csharp.svg' },
        { name: 'Python', iconUrl: '/icons/python.svg' },
        { name: 'Java', iconUrl: '/icons/java.svg' },
        { name: 'TypeScript', iconUrl: '/icons/typescript.svg' },
      ],
    },
    {
      title: 'Backend & Dev Tools',
      items: [
        { name: 'Git', iconUrl: '/icons/git.svg' },
        { name: 'Docker', iconUrl: '/icons/docker.svg' },
        { name: 'FastAPI', iconUrl: '/icons/fastapi.svg' },
        { name: 'Spring Boot', iconUrl: '/icons/springboot.svg' },
        { name: 'PostgreSQL', iconUrl: '/icons/postgresql.svg' },
        { name: 'Gemini AI', iconUrl: '/icons/gemini.svg' },
      ],
    },
  ] as SkillCategory[],
  experience: [
    {
      role: 'AR/VR Intern',
      company: 'IDZ Digital Private Limited',
      location: 'Remote',
      period: 'Aug 2025 – Jan 2026',
      bullets: [
        'Built interactive 2D/3D and AR/VR gameplay features in Unity and C# for commercial applications.',
      ],
    },
    {
      role: 'VR Lead – GDXR Club',
      company: 'Army Institute of Technology',
      location: 'Pune',
      period: 'Aug 2024 – Present',
      bullets: [
        'Leading VR & 3D game development using Unity, OpenXR, and Blender across club projects and game jams.',
      ],
    },
  ] as ExperienceItem[],
  publishedGames: [
    {
      title: 'Bomb Bash – Arcade Bomb Action',
      studio: 'Drox Studio',
      genre: 'Arcade Action',
      logoUrl: '/games/bomb-bash.png',
      playStoreUrl: 'https://play.google.com/store/apps/details?id=com.drox.bombbash&hl=en_IN',
      badge: '4.8 ★ PLAY STORE',
      tech: ['Unity', 'C#', 'Arcade Combat', 'Android'],
      bullets: [
        'Fast-paced arcade bomb-action game with timed explosives, enemy waves, and arena survival.',
      ],
    },
    {
      title: 'Car Stunt Driving Simulator',
      studio: 'Drox Studio',
      genre: '3D Stunt Racing',
      logoUrl: '/games/car-stunt-simulator.jpg',
      playStoreUrl:
        'https://play.google.com/store/apps/details?id=com.drox.carstuntsimulator&hl=en_IN',
      badge: 'GOOGLE PLAY',
      tech: ['Unity 3D', 'C#', 'Vehicle Physics', 'Android'],
      bullets: [
        '3D stunt driving game featuring mega-ramps, mid-air vehicle physics, and obstacle tracks.',
      ],
    },
    {
      title: 'Panda Preschool Baby Games',
      studio: 'IDZ Digital Private Limited',
      genre: 'Educational • Kids',
      logoUrl: '/games/panda-preschool.png',
      playStoreUrl:
        'https://play.google.com/store/apps/details?id=iz.com.baby.panda.preschool.kids.learning.toddler.town.games&hl=en_IN',
      badge: '4.4 ★ PLAY STORE',
      tech: ['Unity', 'C#', '100+ Mini-Games', 'Android'],
      bullets: [
        'Commercial kids title featuring 100+ interactive learning mini-games and touch-driven puzzles.',
      ],
    },
  ] as PublishedGameItem[],
  gameProjects: [
    {
      title: 'RCoreEngine',
      subtitle: 'Custom C# Game Engine',
      category: 'game',
      highlightStat: 'Modular Engine Core',
      tech: ['C#', 'Game Engine Architecture', 'Deterministic Game Loop', 'Component System', 'OOP'],
      bullets: [
        'Architected a custom C# game engine from scratch featuring a decoupled real-time game loop with deterministic fixed updates, variable rendering ticks, and delta-time compensation.',
        'Built an extensible Component-Entity architecture supporting dynamic lifecycle states (Awake, Start, Update, OnDestroy) and inter-component message dispatching.',
        'Engineered core engine subsystems including transform hierarchy trees, custom vector math utilities, spatial partitioning, and low-allocation memory structures.',
        'Applied strict OOP principles, interface segregation, and design patterns (Singleton, Factory) for testable and maintainable engine code.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/RCoreEngine',
    },
    {
      title: 'FarmMarketVR',
      subtitle: 'VR Farm-to-Shop Simulator',
      category: 'game',
      highlightStat: '10 Concurrent AI Shoppers',
      tech: ['Unity 6', 'C#', 'OpenXR', 'XR Interaction Toolkit', 'Auto Hand', 'FSM AI', 'URP'],
      bullets: [
        'Built an immersive VR store economy simulation featuring crop cultivation, harvesting, inventory systems, physical shelf stocking, dynamic pricing, and cashier checkout.',
        'Engineered a Finite State Machine (FSM) driving up to 10 autonomous customer NPCs across shelf searching, queue navigation, price evaluation, and collision avoidance.',
        'Implemented tactile VR physics with Auto Hand and OpenXR, including two-handed interactions, haptic feedback pulses, and dual VR/desktop controller support.',
        'Developed modular data-driven gameplay for store expansion, land unlocks, inventory serialization, and economic balance.',
      ],
      githubUrl: 'https://github.com/learnyTown/innovationteam-FarmMarketVR',
    },
    {
      title: 'NPC Punch Hit VR',
      subtitle: 'Physics VR Combat Prototype',
      category: 'game',
      highlightStat: 'Active Ragdoll + 4 Hit Zones',
      tech: ['Unity VR', 'C#', 'Auto Hand', 'Active Ragdoll Physics', 'Directional Hit Detection', 'VFX'],
      bullets: [
        'Developed a physics-based VR combat prototype using Auto Hand with custom collision layers supporting realistic momentum transfer across punches, melee weapons, and projectiles.',
        'Engineered directional hit detection across 4 discrete body zones (Head, Chest, Back, Legs) calculating impact angles and velocity thresholds to trigger context-aware reactions.',
        'Implemented hybrid active-ragdoll physics combining configurable joint drives with keyframe animations, enabling physical balance recovery and procedural knockdowns.',
        'Integrated contact-point spark and impact particle VFX, procedural camera shake, and velocity-scaled controller haptic pulses.',
      ],
      githubUrl: 'https://github.com/learnyTown/innovationteam-npcPunchHitVR',
    },
  ] as ProjectItem[],
  softwareProjects: [
    {
      title: 'FinLens',
      subtitle: 'AI Financial Intelligence Platform',
      category: 'software',
      highlightStat: 'Multimodal Gemini OCR',
      tech: ['React', 'FastAPI', 'Python', 'SQLite', 'Docker', 'Google Gemini Multimodal'],
      bullets: [
        'Engineered a full-stack financial document intelligence platform with React, asynchronous FastAPI, SQLite, and Docker using authenticated JWT REST APIs.',
        'Integrated Google Gemini Vision/Multimodal APIs with OCR pipelines to parse unstructured invoices, balance sheets, and financial receipts into structured metrics.',
        'Built automated reconciliation workflows to cross-verify document line items and flag ledger discrepancies.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/FinLens',
    },
    {
      title: 'RecoverAI',
      subtitle: 'AI Automation & Recovery Platform',
      category: 'software',
      highlightStat: 'Autonomous Workflows',
      tech: ['Python', 'AI Agents', 'FastAPI', 'Workflow Automation', 'Async Architecture'],
      bullets: [
        'Developed an automated decision platform utilizing autonomous AI agent chains to inspect diagnostic logs, evaluate error traces, and execute recovery actions.',
        'Implemented modular decision-tree orchestration with stateful context retention and automated rollback mechanisms.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/Recover_AI',
    },
    {
      title: 'Media-Automation',
      subtitle: 'Automated Media Pipeline',
      category: 'software',
      highlightStat: 'Batch Asset Pipeline',
      tech: ['Python', 'FFmpeg', 'Media Pipelines', 'Batch Processing', 'CLI'],
      bullets: [
        'Engineered an automated batch media transformation pipeline for video transcoding, image optimization, audio normalization, and metadata stripping.',
        'Implemented asynchronous worker queues and folder watchers to automate multi-format asset exports for game and web platforms.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/Media-Automation',
    },
    {
      title: 'LedgerZero',
      subtitle: 'Financial Ledger Backend System',
      category: 'software',
      highlightStat: 'Double-Entry ACID',
      tech: ['Java', 'Spring Boot', 'PostgreSQL / SQL', 'REST APIs', 'Spring Data JPA'],
      bullets: [
        'Developed an immutable double-entry ledger backend ensuring financial data integrity with ACID transactions and balanced debit/credit invariants.',
        'Structured clean layered architecture (Controller, Service, Repository) with Spring Boot, comprehensive validation, and secure RESTful endpoints.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/LedgerZero',
    },
  ] as ProjectItem[],
  achievements: [
    {
      badge: '1ST RUNNER-UP',
      title: 'IIIT Delhi × IGDA Game Jam',
      detail: '1st Runner-up at the IIIT Delhi × IGDA Game Jam.',
    },
    {
      badge: '2ND RUNNER-UP',
      title: 'Arcade — AR Lens Competition',
      detail: '2nd Runner-up in the Arcade interactive AR competition.',
    },
    {
      badge: '200+ SOLVED',
      title: 'LeetCode DSA',
      detail: '200+ algorithmic problems solved on LeetCode.',
    },
    {
      badge: 'FINALIST',
      title: 'Paytm AI Hackathon',
      detail: 'National Finalist at the Paytm AI Hackathon.',
    },
    {
      badge: '3× FINALIST',
      title: 'Innerve 9 • Vinhack • Imaginate',
      detail: 'Finalist across Innerve 9, Vinhack (VIT), and Imaginate 2K25.',
    },
  ] as AchievementItem[],
  milestones: [
    {
      id: 'sector-surface',
      depthMeters: 0,
      label: 'SURFACE',
      enemyType: 'bats',
      lootText: 'SHAFT ENTERED',
    },
    {
      id: 'sector-skills',
      depthMeters: -110,
      label: 'SKILLS',
      enemyType: 'bats',
      lootText: '+SKILLS UNLOCKED: UNITY • UNREAL • XR',
    },
    {
      id: 'sector-experience',
      depthMeters: -230,
      label: 'EXPERIENCE',
      enemyType: 'skeleton',
      lootText: '+QUEST LOG: AR/VR INTERN & VR LEAD',
    },
    {
      id: 'sector-published-games',
      depthMeters: -350,
      label: 'PUBLISHED GAMES',
      enemyType: 'golem',
      lootText: '+SHIPPED TITLES: 3 GOOGLE PLAY GAMES',
    },
    {
      id: 'sector-games',
      depthMeters: -490,
      label: 'PERSONAL PROJECTS',
      enemyType: 'golem',
      lootText: '+UNLOCKED: PERSONAL PROJECTS',
    },
    {
      id: 'sector-software',
      depthMeters: -620,
      label: 'AI & SYSTEMS',
      enemyType: 'spider',
      lootText: '+RELICS: AI & BACKEND PROJECTS',
    },
    {
      id: 'sector-achievements',
      depthMeters: -750,
      label: 'TROPHIES',
      enemyType: 'boss',
      lootText: '+TROPHIES: IGDA JAM & HACKATHONS',
    },
  ] as DepthMilestone[],
};
