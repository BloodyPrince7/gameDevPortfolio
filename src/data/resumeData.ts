export interface SkillCategory {
  title: string;
  accent?: boolean;
  items: string[];
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
    linkedin: 'https://www.linkedin.com/in/pankaj-kumar-aaa648438',
    github: 'https://github.com/BloodyPrince7',
    githubHandle: '@BloodyPrince7',
    gamesCompilation:
      'https://drive.google.com/file/d/1hJecTNzQ2e3d47muSyKBFMDhiTltFAWi/view?usp=sharing',
    pdfDownload: '/Pankaj_Kumar_CV.pdf',
  },
  education: {
    institution: 'Army Institute of Technology, Pune',
    location: 'Pune, Maharashtra',
    degree: 'B.E. in Electronics & Telecommunication Engineering',
    period: '2024 – 2028',
    cgpa: '7.82 / 10',
    cgpaNote: 'Aggregate CGPA (Semesters I–IV)',
  },
  gamesCompilation: {
    title: 'Complete Games Compilation',
    description:
      'Collection of game projects, Unity/VR prototypes, gameplay experiments and interactive 3D experiences developed throughout my game-development journey.',
    url: 'https://drive.google.com/file/d/1hJecTNzQ2e3d47muSyKBFMDhiTltFAWi/view?usp=sharing',
  },
  skillCategoriesLeft: [
    {
      title: 'Game Development & XR',
      accent: true,
      items: [
        'Unity 6',
        'XR Interaction Toolkit',
        'OpenXR',
        'XR Hands',
        'Auto Hand',
        'URP',
        'Blender',
        'Mixamo',
      ],
    },
    {
      title: 'Game Systems',
      accent: true,
      items: [
        'Gameplay Programming',
        'State Machines',
        'Collision Detection',
        'Physics',
        'Ragdoll Systems',
        '3D Interaction',
        'VR Development',
      ],
    },
    {
      title: 'Programming Languages',
      items: ['C#', 'Java', 'Python', 'TypeScript', 'JavaScript'],
    },
  ] as SkillCategory[],
  skillCategoriesRight: [
    {
      title: 'CS Fundamentals',
      items: [
        'Data Structures & Algorithms',
        'Object-Oriented Programming',
        'Operating Systems',
        'Computer Networks',
        'DBMS',
        'Complexity Analysis',
      ],
    },
    {
      title: 'Backend Engineering',
      items: [
        'Spring Boot',
        'FastAPI',
        'REST APIs',
        'JWT Authentication',
        'SQL / MySQL',
        'PostgreSQL',
        'SQLite',
        'MongoDB',
      ],
    },
    {
      title: 'AI & Dev Tools',
      items: [
        'Gemini',
        'Google GenAI',
        'AI Agents',
        'Git & GitHub',
        'Docker',
        'Linux',
        'Visual Studio',
        'VS Code',
        'Android Studio',
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
        'Developed interactive AR/VR features using C# and Unity3D, working with real-time 3D interactions and immersive application systems.',
        'Worked with 3D assets and interactive components to build and refine immersive application experiences.',
      ],
    },
    {
      role: 'VR Lead – GDXR Club',
      company: 'Army Institute of Technology',
      location: 'Pune',
      period: 'Aug 2024 – Present',
      bullets: [
        'Led AR/VR development using Unity, Blender and Mixamo, contributing to interactive 3D projects and coordinating technical development.',
        'Worked on 3D workflows, asset preparation and interactive VR experiences for student projects.',
      ],
    },
  ] as ExperienceItem[],
  gameProjects: [
    {
      title: 'FarmMarketVR',
      subtitle: 'VR Farm-to-Shop Simulator',
      category: 'game',
      highlightStat: '10 Concurrent AI Customers',
      tech: ['Unity 6', 'C#', 'OpenXR', 'XR Interaction Toolkit', 'Auto Hand', 'FSM AI'],
      bullets: [
        'Built a Unity 6 VR simulation featuring farming, harvesting, inventory, shelf stocking, pricing, checkout and an in-game economy using C#, OpenXR, XR Interaction Toolkit and Auto Hand.',
        'Implemented a customer behavior state machine covering product search, shelf navigation, purchasing, queues, restocking reactions, customer avoidance and post-payment reactions.',
        'Developed gameplay systems for land unlocking, product data, stock placement, furniture interaction, checkout and VR/desktop controls; supports up to 10 concurrent customers.',
      ],
      githubUrl: 'https://github.com/learnyTown/innovationteam-FarmMarketVR',
    },
    {
      title: 'NPC Punch Hit VR',
      subtitle: 'Physics-Based VR Combat Prototype',
      category: 'game',
      highlightStat: 'Active Ragdoll + 4 Hit Zones',
      tech: ['Unity VR', 'C#', 'Auto Hand', 'Active Ragdoll', 'Impact Physics', 'VFX'],
      bullets: [
        'Developed a Unity VR combat prototype using C#, Auto Hand and physics-based interactions for glove, projectile and melee collision systems.',
        'Implemented directional hit detection across head, chest, back and leg zones, spawning contact-point VFX and triggering context-specific reactions.',
        'Built impact physics using contact-point impulses, active-ragdoll reactions and per-zone cooldown management to coordinate hit animations.',
      ],
      githubUrl: 'https://github.com/learnyTown/innovationteam-npcPunchHitVR',
    },
    {
      title: 'RCoreEngine',
      subtitle: 'Custom C# Game Engine',
      category: 'game',
      highlightStat: 'Modular Engine Architecture',
      tech: ['C#', 'Game Engine Architecture', 'Real-Time Loop', 'OOP', 'Modular Systems'],
      bullets: [
        'Developed a C# game-engine project exploring reusable engine architecture, real-time game programming and object-oriented software design.',
        'Structured engine components around modular and reusable systems while applying core programming and software-engineering principles.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/RCoreEngine',
    },
  ] as ProjectItem[],
  softwareProjects: [
    {
      title: 'FinLens',
      subtitle: 'AI Financial Intelligence Platform',
      category: 'software',
      tech: ['React', 'FastAPI', 'Python', 'SQLite', 'Docker', 'Gemini Multimodal'],
      bullets: [
        'Engineered a full-stack financial document intelligence platform using React, FastAPI, Python, SQLite and Docker, with authenticated REST APIs and multimodal Gemini processing.',
        'Implemented OCR-based document extraction and AI-assisted cross-document financial analysis using multimodal models.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/FinLens',
    },
    {
      title: 'RecoverAI',
      subtitle: 'AI Recovery / Intelligence Platform',
      category: 'software',
      tech: ['AI Automation', 'Intelligent Workflows', 'Modular Architecture'],
      bullets: [
        'Developed an AI-focused software project exploring intelligent automation and practical AI-assisted workflows.',
        'Applied modern software-development practices to build and structure the project for reusable, maintainable functionality.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/Recover_AI',
    },
    {
      title: 'Media-Automation',
      subtitle: 'Automated Media Processing Platform',
      category: 'software',
      tech: ['Media Pipelines', 'Workflow Automation', 'Software Engineering'],
      bullets: [
        'Developed an automation-focused project for streamlining media-processing workflows and reducing repetitive manual tasks.',
        'Structured the project around reusable automation components and practical software-engineering workflows.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/Media-Automation',
    },
    {
      title: 'LedgerZero',
      subtitle: 'Financial / Ledger Platform',
      category: 'software',
      tech: ['Backend Architecture', 'Ledger Workflows', 'Structured Data'],
      bullets: [
        'Developed a financial software project focused on ledger-oriented workflows and structured financial data.',
        'Applied backend and software-engineering concepts to organize financial operations into a maintainable application structure.',
      ],
      githubUrl: 'https://github.com/BloodyPrince7/LedgerZero',
    },
  ] as ProjectItem[],
  achievements: [
    {
      badge: '1ST RUNNER-UP',
      title: 'IIIT Delhi × IGDA Game Jam',
      detail: 'First Runner-up in the Game Jam organized by IIIT Delhi in collaboration with IGDA.',
    },
    {
      badge: '2ND RUNNER-UP',
      title: 'Arcade — AR Lens Competition',
      detail: 'Second Runner-up in Arcade, an AR-based interactive lens-making competition.',
    },
    {
      badge: '200+ SOLVED',
      title: 'LeetCode Algorithmic Problem Solving',
      detail:
        'Solved 200+ problems across Data Structures, Algorithms, and competitive problem solving.',
    },
    {
      badge: 'FINALIST',
      title: 'Paytm AI Hackathon',
      detail: 'Selected as Finalist at the national-level Paytm AI Hackathon.',
    },
    {
      badge: '3× FINALIST',
      title: 'Innerve 9 • Vinhack (VIT) • Imaginate 2K25',
      detail:
        'Finalist across Innerve 9, Vinhack at VIT Vellore, and Imaginate at Solution 2K25.',
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
      lootText: '+SKILLS UNLOCKED: UNITY 6 • C# • XR',
    },
    {
      id: 'sector-experience',
      depthMeters: -240,
      label: 'EXPERIENCE',
      enemyType: 'skeleton',
      lootText: '+QUEST LOG: AR/VR INTERN & VR LEAD',
    },
    {
      id: 'sector-games',
      depthMeters: -400,
      label: 'GAME VAULTS',
      enemyType: 'golem',
      lootText: '+VAULT CRACKED: VR & ENGINE PROJECTS',
    },
    {
      id: 'sector-software',
      depthMeters: -560,
      label: 'AI & SYSTEMS',
      enemyType: 'spider',
      lootText: '+RELICS: AI & FULL-STACK PLATFORMS',
    },
    {
      id: 'sector-achievements',
      depthMeters: -690,
      label: 'TROPHIES',
      enemyType: 'boss',
      lootText: '+TROPHIES: IGDA JAM & HACKATHONS',
    },
  ] as DepthMilestone[],
};
