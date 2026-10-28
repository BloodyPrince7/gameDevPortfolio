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
  youtubeUrl?: string;
  youtubeId?: string;
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
      role: 'Game Dev Intern',
      company: 'IDZ Digital Private Limited',
      location: 'Remote',
      period: 'Aug 2025 – Jan 2026',
      bullets: [
        'Built interactive 2D/3D and AR/VR gameplay features in Unity and C# for commercial applications.',
      ],
    },
    {
      role: 'Game Developer Intern',
      company: 'Drox Studio',
      location: 'Startup',
      period: 'Jun 2025 – Jul 2025',
      bullets: [
        'Directly developed core gameplay systems and vehicle physics for commercial mobile titles Bomb Bash and Car Stunt Driving Simulator.',
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
      title: 'Timpy Nail Salon: Acrylic Nails',
      studio: 'IDZ Digital / Timpy Games',
      genre: 'Casual • Kids Salon',
      logoUrl: '/games/timpy-nail-salon.png',
      playStoreUrl:
        'https://play.google.com/store/apps/details?id=com.tz.nail.salon.art.nails.design.girl.games&hl=en_IN',
      badge: '4.0 ★ PLAY STORE',
      tech: ['Unity', 'C#', 'Touch Interactions', 'Android'],
      bullets: [
        'Commercial salon game featuring interactive acrylic nail styling, painting mechanics, art design, and responsive touch feedback.',
      ],
    },
  ] as PublishedGameItem[],
  gameProjects: [
    {
      title: 'FarmMarket VR',
      subtitle: 'VR Farm-to-Shop Simulator',
      category: 'game',
      highlightStat: '10 AI Customers',
      tech: ['Unity 6', 'C#', 'OpenXR', 'Auto Hand', 'FSM AI', 'URP'],
      bullets: [
        'Immersive VR store economy simulation featuring crop cultivation, harvesting, inventory systems, physical shelf stocking, dynamic pricing, and cashier checkout.',
        'Engineered a Finite State Machine (FSM) driving up to 10 autonomous customer NPCs across shelf searching, queue navigation, price evaluation, and collision avoidance.',
        'Implemented tactile VR physics with Auto Hand and OpenXR, including two-handed interactions, haptic feedback pulses, and dual VR/desktop controller support.',
      ],
      githubUrl: 'https://github.com/learnyTown/innovationteam-FarmMarketVR',
      youtubeUrl: 'https://youtu.be/g84dcb7SimM',
      youtubeId: 'g84dcb7SimM',
    },
    {
      title: 'Beat the Npc',
      subtitle: 'Physics VR Combat Simulation',
      category: 'game',
      highlightStat: 'Active Ragdoll + 4 Hit Zones',
      tech: ['Unity VR', 'C#', 'Auto Hand', 'Active Ragdoll Physics', 'Directional Hit Detection', 'VFX'],
      bullets: [
        'Physics-based VR combat prototype using Auto Hand with custom collision layers supporting realistic momentum transfer across punches, melee weapons, and projectiles.',
        'Engineered directional hit detection across 4 discrete body zones (Head, Chest, Back, Legs) calculating impact angles and velocity thresholds to trigger context-aware reactions.',
        'Implemented hybrid active-ragdoll physics combining configurable joint drives with keyframe animations, enabling physical balance recovery and procedural knockdowns.',
      ],
      githubUrl: 'https://github.com/learnyTown/innovationteam-npcPunchHitVR',
      youtubeUrl: 'https://www.youtube.com/watch?v=ZReh2UnKerQ',
      youtubeId: 'ZReh2UnKerQ',
    },
  ] as ProjectItem[],
  softwareProjects: [
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
      youtubeUrl: 'https://youtu.be/mCEp4S_WvBg',
      youtubeId: 'mCEp4S_WvBg',
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
      youtubeUrl: 'https://youtu.be/xdroHhE6AcM',
      youtubeId: 'xdroHhE6AcM',
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
      lootText: '+QUEST LOG: GAME DEV INTERN & VR LEAD',
    },
    {
      id: 'sector-published-games',
      depthMeters: -350,
      label: 'PUBLISHED GAMES',
      enemyType: 'golem',
      lootText: '+CONTRIBUTED TO 3 GOOGLE PLAY GAMES',
    },
    {
      id: 'sector-games',
      depthMeters: -490,
      label: 'VR PROJECTS',
      enemyType: 'golem',
      lootText: '+UNLOCKED: VR PROJECTS',
    },
    {
      id: 'sector-software',
      depthMeters: -620,
      label: 'SOFTWARE & SYSTEMS',
      enemyType: 'spider',
      lootText: '+UNLOCKED: MEDIA AUTOMATION & LEDGER ZERO',
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
