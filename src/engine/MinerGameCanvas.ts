import { minerSfx } from '../audio/sfx';

export interface SectorAnchor {
  id: string;
  worldY: number;
  depthMeters: number;
  enemyType: 'bats' | 'golem' | 'skeleton' | 'spider' | 'boss';
  lootText: string;
  breached: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  kind: 'rock' | 'spark';
  color: string;
}

interface SlashArc {
  x: number;
  y: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
}

interface BulletTracer {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  life: number;
  maxLife: number;
  hitBat: boolean;
}

interface FloatingPopup {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
  accent: boolean;
}

interface AmbientBat {
  id: number;
  worldY: number;
  offsetXRatio: number;
  phase: number;
  alive: boolean;
  respawnTimer: number;
}

interface HangingLantern {
  worldY: number;
  side: -1 | 1;
  angle: number;
  angVel: number;
}

export class MinerGameCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = window.innerWidth;
  private height = window.innerHeight;
  private dpr = Math.min(window.devicePixelRatio || 1, 2);

  private targetScrollY = 0;
  private smoothScrollY = 0;
  private minerWorldY = 230;
  private minerVelY = 0;
  private minerXOffset = 0;

  // Solid Cave Digging Frontier (everything below this worldY in the shaft is SOLID BLACK CAVE ROCK!)
  private excavatedFrontierY = 254;
  private digDistanceAccum = 0;
  private digSwingPhase = 0;
  private isAtRockFrontier = true;

  private sectors: SectorAnchor[] = [];
  private particles: Particle[] = [];
  private ambientEmbers: { x: number; y: number; r: number; speed: number; alpha: number; drift: number }[] = [];
  private slashArcs: SlashArc[] = [];
  private bulletTracers: BulletTracer[] = [];
  private popups: FloatingPopup[] = [];
  private ambientBats: AmbientBat[] = [];
  private lanterns: HangingLantern[] = [];

  private attackTimer = 0;
  private gunPoseTimer = 0;
  private gunRecoil = 0;
  private gunAimAngle = -Math.PI * 0.35;
  private hoveredBatId: number | null = null;
  private pointerScreenX = -999;
  private pointerScreenY = -999;
  private batsKilled = 0;
  private shakeIntensity = 0;
  private headlampAngle = Math.PI * 0.35;
  private targetHeadlampAngle = Math.PI * 0.35;
  private animFrameId = 0;
  private lastTime = performance.now();

  private onSectorBreach?: (sectorId: string) => void;
  private onDepthUpdate?: (depthMeters: number, progress: number) => void;
  private onBatKilled?: (totalKilled: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onSectorBreach?: (sectorId: string) => void;
      onDepthUpdate?: (depthMeters: number, progress: number) => void;
      onBatKilled?: (totalKilled: number) => void;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.onSectorBreach = callbacks.onSectorBreach;
    this.onDepthUpdate = callbacks.onDepthUpdate;
    this.onBatKilled = callbacks.onBatKilled;

    this.initAmbientEmbers();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });

    // Click on Cave Bats to shoot with Revolver, or click rock floor to strike with Pickaxe!
    window.addEventListener('pointerdown', this.handlePointerDown);

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private isMobileLayout(): boolean {
    return this.width <= 900;
  }

  private getShaftGeometry(): { cx: number; shaftHalf: number; minerScale: number } {
    if (this.isMobileLayout()) {
      // Dedicated unobstructed left-side cave digging column on phones/tablets!
      const stripWidth = this.width < 420 ? 74 : 86;
      return {
        cx: stripWidth * 0.5,
        shaftHalf: stripWidth * 0.43,
        minerScale: this.width < 420 ? 0.72 : 0.8,
      };
    }
    if (this.width < 1180) {
      return { cx: this.width * 0.5, shaftHalf: 132, minerScale: 0.95 };
    }
    return { cx: this.width * 0.5, shaftHalf: 165, minerScale: 1.0 };
  }

  private initAmbientEmbers(): void {
    this.ambientEmbers = [];
    for (let i = 0; i < 48; i++) {
      this.ambientEmbers.push({
        x: Math.random(),
        y: Math.random(),
        r: 1 + Math.random() * 2.2,
        speed: 12 + Math.random() * 24,
        alpha: 0.18 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 16,
      });
    }
  }

  public setSectors(anchors: SectorAnchor[]): void {
    const prevBreached = new Set(this.sectors.filter((s) => s.breached).map((s) => s.id));
    this.sectors = anchors.map((a) => ({
      ...a,
      breached: a.breached || prevBreached.has(a.id),
    }));

    this.lanterns = [];
    this.ambientBats = [];
    const maxWorldY = anchors.length > 0 ? anchors[anchors.length - 1].worldY + 520 : 3400;

    for (let y = 190; y < maxWorldY; y += 265) {
      this.lanterns.push({
        worldY: y,
        side: (Math.floor(y / 265) % 2 === 0 ? -1 : 1) as -1 | 1,
        angle: (Math.random() - 0.5) * 0.1,
        angVel: 0,
      });
    }

    let batId = 1;
    // Spawn bats starting right at 105px (surface rafters!) and every 125px down the shaft
    for (let y = 105; y < maxWorldY; y += 125) {
      this.ambientBats.push({
        id: batId++,
        worldY: y + (Math.random() - 0.5) * 32,
        offsetXRatio: (Math.random() - 0.5) * 1.05,
        phase: Math.random() * Math.PI * 2,
        alive: true,
        respawnTimer: 0,
      });
    }
  }

  private getBatScreenPos(
    bat: AmbientBat,
    nowSec: number,
    cx: number,
    shaftHalf: number
  ): { bx: number; by: number } {
    const bx =
      cx +
      bat.offsetXRatio * (shaftHalf * 0.54) +
      Math.sin(nowSec * 2.6 + bat.phase) * (shaftHalf * 0.26);
    const by = bat.worldY - this.smoothScrollY + Math.cos(nowSec * 3.4 + bat.phase) * 12;
    return { bx, by };
  }

  private findBatAtScreenPoint(screenX: number, screenY: number, nowSec: number): AmbientBat | null {
    const { cx, shaftHalf } = this.getShaftGeometry();
    const hitRadius = this.isMobileLayout() ? 46 : 42;
    let closest: AmbientBat | null = null;
    let bestDist = hitRadius;

    for (const bat of this.ambientBats) {
      if (!bat.alive || bat.worldY > this.excavatedFrontierY - 12) continue;
      const { bx, by } = this.getBatScreenPos(bat, nowSec, cx, shaftHalf);
      if (by < 54 || by > this.height + 20) continue;
      const d = Math.hypot(screenX - bx, screenY - by);
      if (d <= bestDist) {
        bestDist = d;
        closest = bat;
      }
    }
    return closest;
  }

  private handlePointerMove = (e: PointerEvent): void => {
    this.pointerScreenX = e.clientX;
    this.pointerScreenY = e.clientY;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('a, button')) {
      this.hoveredBatId = null;
      document.body.style.cursor = '';
      return;
    }
    const nowSec = performance.now() * 0.001;
    const bat = this.findBatAtScreenPoint(e.clientX, e.clientY, nowSec);
    this.hoveredBatId = bat ? bat.id : null;
    document.body.style.cursor = bat ? 'crosshair' : '';
  };

  private handlePointerDown = (e: PointerEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('a, button')) return;

    const nowSec = performance.now() * 0.001;
    const clickedBat = this.findBatAtScreenPoint(e.clientX, e.clientY, nowSec);

    if (clickedBat) {
      this.fireRevolverAtBat(clickedBat, nowSec);
      return;
    }

    const { cx, shaftHalf, minerScale } = this.getShaftGeometry();
    if (Math.abs(e.clientX - cx) <= shaftHalf * 1.45) {
      const worldClickY = e.clientY + this.smoothScrollY;
      const bootsY = this.minerWorldY + 24 * minerScale;
      if (worldClickY < bootsY - 14) {
        // Clicked in open cave air above rock floor -> fire warning/ricochet revolver shot!
        this.fireRevolverMissedShot(e.clientX, worldClickY);
      } else {
        // Clicked on solid black cave floor -> manual pickaxe rock strike!
        this.triggerManualPickaxeStrike(e.clientX, worldClickY);
      }
    }
  };

  private fireRevolverAtBat(bat: AmbientBat, nowSec: number): void {
    const { cx, shaftHalf, minerScale } = this.getShaftGeometry();
    const { bx, by } = this.getBatScreenPos(bat, nowSec, cx, shaftHalf);
    const targetWorldY = by + this.smoothScrollY;

    const minerX = cx + this.minerXOffset;
    const shoulderY = this.minerWorldY - 13 * minerScale;
    const aimAngle = Math.atan2(targetWorldY - shoulderY, bx - minerX);

    this.gunPoseTimer = 0.62;
    this.gunRecoil = 1.0;
    this.gunAimAngle = aimAngle;
    this.targetHeadlampAngle = aimAngle;
    this.headlampAngle = aimAngle;

    const muzzleDist = 31 * minerScale;
    const muzzleX = minerX + Math.cos(aimAngle) * muzzleDist;
    const muzzleWorldY = shoulderY + Math.sin(aimAngle) * muzzleDist;

    this.bulletTracers.push({
      startX: muzzleX,
      startY: muzzleWorldY,
      endX: bx,
      endY: targetWorldY,
      life: 0.22,
      maxLife: 0.22,
      hitBat: true,
    });

    // Eject spinning brass revolver casing
    const ejectDir = Math.cos(aimAngle) >= 0 ? -1 : 1;
    this.particles.push({
      x: minerX + Math.cos(aimAngle) * 16 * minerScale,
      y: shoulderY + Math.sin(aimAngle) * 16 * minerScale,
      vx: ejectDir * (55 + Math.random() * 45),
      vy: -130 - Math.random() * 50,
      size: 3.2 * minerScale,
      rotation: 0,
      vRot: 18,
      life: 0.65,
      maxLife: 0.65,
      kind: 'rock',
      color: '#FFE08A',
    });

    // Kill the clicked bat!
    bat.alive = false;
    bat.respawnTimer = 3.2;
    this.hoveredBatId = null;
    document.body.style.cursor = '';
    this.batsKilled += 1;
    this.onBatKilled?.(this.batsKilled);

    this.shakeIntensity = Math.max(this.shakeIntensity, 6.5);
    this.spawnBatGunKillFX(bx, targetWorldY, minerScale);
    minerSfx.playGunshot(true);
  }

  private fireRevolverMissedShot(targetScreenX: number, targetWorldY: number): void {
    const { cx, minerScale } = this.getShaftGeometry();
    const minerX = cx + this.minerXOffset;
    const shoulderY = this.minerWorldY - 13 * minerScale;
    const aimAngle = Math.atan2(targetWorldY - shoulderY, targetScreenX - minerX);

    this.gunPoseTimer = 0.48;
    this.gunRecoil = 0.85;
    this.gunAimAngle = aimAngle;
    this.targetHeadlampAngle = aimAngle;

    const muzzleDist = 31 * minerScale;
    const muzzleX = minerX + Math.cos(aimAngle) * muzzleDist;
    const muzzleWorldY = shoulderY + Math.sin(aimAngle) * muzzleDist;

    this.bulletTracers.push({
      startX: muzzleX,
      startY: muzzleWorldY,
      endX: targetScreenX,
      endY: targetWorldY,
      life: 0.18,
      maxLife: 0.18,
      hitBat: false,
    });

    // Cave wall stone ricochet sparks
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 110;
      this.particles.push({
        x: targetScreenX,
        y: targetWorldY,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: 2.2 * minerScale,
        rotation: 0,
        vRot: 0,
        life: 0.25,
        maxLife: 0.25,
        kind: 'spark',
        color: '#FFF6E0',
      });
    }

    this.shakeIntensity = Math.max(this.shakeIntensity, 3.5);
    minerSfx.playGunshot(false);
  }

  private spawnBatGunKillFX(bx: number, worldY: number, scale: number): void {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (65 + Math.random() * 195) * scale;
      const isBloodSpark = i % 2 === 0;
      this.particles.push({
        x: bx,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: (isBloodSpark ? 2.5 + Math.random() * 3.5 : 4 + Math.random() * 5) * scale,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 14,
        life: 0.4 + Math.random() * 0.32,
        maxLife: 0.72,
        kind: isBloodSpark ? 'spark' : 'rock',
        color: i % 5 === 0 ? '#FFF7E8' : isBloodSpark ? '#FF1E3E' : '#060304',
      });
    }

    const callouts = ['BANG! +1 BAT', 'HEADSHOT!', 'DEAD-EYE!'];
    this.popups.push({
      x: this.isMobileLayout() ? Math.max(bx + 28, 62) : bx,
      y: worldY - 18,
      vy: -42,
      text: callouts[this.batsKilled % callouts.length],
      life: 0.9,
      maxLife: 0.9,
      accent: true,
    });
  }

  private triggerManualPickaxeStrike(worldClickX: number, worldClickY: number): void {
    const { cx, minerScale } = this.getShaftGeometry();
    this.attackTimer = 0.28;
    this.digSwingPhase += Math.PI;
    const minerX = cx + this.minerXOffset;
    const bootsY = this.minerWorldY + 24 * minerScale;
    const strikeAngle = Math.atan2(worldClickY - this.minerWorldY, worldClickX - minerX);
    this.targetHeadlampAngle = strikeAngle;

    this.slashArcs.push({
      x: minerX,
      y: bootsY - 8,
      angle: Math.PI * 0.5,
      radius: 42 * minerScale,
      life: 0.2,
      maxLife: 0.2,
    });

    this.spawnDiggingDebris(minerX, bootsY, 12, minerScale);
    this.shakeIntensity = Math.max(this.shakeIntensity, 4.5);
    minerSfx.playDigCrunch(1.0);
  }

  private handleScroll = (): void => {
    this.targetScrollY = window.scrollY || window.pageYOffset || 0;
  };

  public handleResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.targetScrollY = window.scrollY || 0;
  };

  private spawnDiggingDebris(
    impactX: number,
    impactWorldY: number,
    count: number,
    scale: number
  ): void {
    for (let i = 0; i < count; i++) {
      // Throw rock chips & red ore sparks UPWARD out of the cave floor!
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.85;
      const speed = (75 + Math.random() * 195) * scale;
      const isSpark = i % 4 === 0;
      this.particles.push({
        x: impactX + (Math.random() - 0.5) * 26 * scale,
        y: impactWorldY - 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        size: (isSpark ? 2.2 + Math.random() * 2.5 : 4 + Math.random() * 6.5) * scale,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 11,
        life: 0.42 + Math.random() * 0.38,
        maxLife: 0.8,
        kind: isSpark ? 'spark' : 'rock',
        color: isSpark ? (i % 8 === 0 ? '#FFF7E4' : '#FF2442') : '#060304',
      });
    }
  }

  private spawnBreachExplosion(
    cx: number,
    worldY: number,
    lootText: string,
    playAudio = true
  ): void {
    const { shaftHalf, minerScale } = this.getShaftGeometry();
    for (let i = 0; i < 24; i++) {
      const spreadX = (Math.random() - 0.5) * shaftHalf * 1.5;
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 2.1;
      const speed = (85 + Math.random() * 230) * minerScale;
      this.particles.push({
        x: cx + spreadX,
        y: worldY + (Math.random() - 0.5) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        size: (4.5 + Math.random() * 8.5) * minerScale,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
        life: 0.65 + Math.random() * 0.55,
        maxLife: 1.2,
        kind: i % 4 === 0 ? 'spark' : 'rock',
        color: i % 4 === 0 ? '#FFF6E5' : i % 3 === 0 ? '#FF1E3C' : '#070405',
      });
    }

    this.slashArcs.push({
      x: cx,
      y: worldY - 8,
      angle: Math.PI * 0.5,
      radius: 54 * minerScale,
      life: 0.26,
      maxLife: 0.26,
    });

    if (lootText && !this.isMobileLayout()) {
      this.popups.push({
        x: cx,
        y: worldY - 32,
        vy: -38,
        text: lootText,
        life: 1.55,
        maxLife: 1.55,
        accent: true,
      });
    }

    if (playAudio) {
      minerSfx.playRockSmash();
      minerSfx.playSlashHit();
    }
  }

  private update(dt: number, nowSec: number): void {
    const { cx, shaftHalf, minerScale } = this.getShaftGeometry();

    // Smooth scroll chase
    const scrollDiff = this.targetScrollY - this.smoothScrollY;
    this.smoothScrollY += scrollDiff * Math.min(1, dt * 13);

    // Anchor miner around 42% of viewport height
    const initialAnchorY = this.isMobileLayout() ? 175 : 225;
    const anchorScreenY =
      this.smoothScrollY < 60
        ? initialAnchorY + this.smoothScrollY * 0.45
        : this.height * 0.43;

    const desiredMinerWorldY = this.smoothScrollY + anchorScreenY;
    const prevMinerY = this.minerWorldY;
    this.minerWorldY += (desiredMinerWorldY - this.minerWorldY) * Math.min(1, dt * 15);
    this.minerVelY = (this.minerWorldY - prevMinerY) / Math.max(dt, 0.001);

    const bootsWorldY = this.minerWorldY + 24 * minerScale;

    // Reset solid cave rock if user scrolls all the way back to surface (0m) for replayability!
    if (this.targetScrollY <= 10 && this.smoothScrollY <= 18) {
      this.excavatedFrontierY = bootsWorldY;
    }

    // SOLID CAVE DIGGING LOGIC: Miner's boots carve directly into solid cave rock!
    if (bootsWorldY >= this.excavatedFrontierY - 5) {
      this.isAtRockFrontier = true;
      const carvedDelta = Math.max(0, bootsWorldY - this.excavatedFrontierY);
      if (carvedDelta > 0) {
        this.excavatedFrontierY = bootsWorldY;
        this.digDistanceAccum += carvedDelta;
        // Advance heavy pickaxe swing cycle proportional to rock carved!
        this.digSwingPhase += carvedDelta * 0.14;

        // Every ~19px of solid rock dug, fire heavy stone-crunch impact + flying chips!
        if (this.digDistanceAccum >= 19) {
          this.digDistanceAccum = 0;
          this.attackTimer = 0.18;
          const pickHitX = cx + this.minerXOffset + 10 * minerScale;
          this.spawnDiggingDebris(pickHitX, bootsWorldY, this.isMobileLayout() ? 6 : 10, minerScale);
          this.slashArcs.push({
            x: pickHitX,
            y: bootsWorldY - 10 * minerScale,
            angle: Math.PI * 0.48 + (Math.random() - 0.5) * 0.35,
            radius: 34 * minerScale,
            life: 0.14,
            maxLife: 0.14,
          });
          this.shakeIntensity = Math.max(this.shakeIntensity, Math.min(4.2, Math.abs(this.minerVelY) * 0.008));
          minerSfx.playDigCrunch(Math.min(1.1, 0.55 + Math.abs(this.minerVelY) * 0.0012));
        }
      }
      // Subtle grounded lateral shift across the rock face while digging
      const targetWeave = Math.sin(this.minerWorldY * 0.015) * (shaftHalf * 0.24);
      this.minerXOffset += (targetWeave - this.minerXOffset) * Math.min(1, dt * 8);
    } else {
      // Inside already-dug cave above frontier: position on wooden ladder when climbing up, or rock ledge!
      this.isAtRockFrontier = false;
      if (this.minerVelY < -35) {
        // Snap onto the alternating wooden ladder to climb rung-by-rung!
        const bay = Math.floor(this.minerWorldY / 265);
        const ladderSide = bay % 2 === 0 ? -1 : 1;
        const ladderTargetOffset = ladderSide * (shaftHalf - 16 * minerScale);
        this.minerXOffset += (ladderTargetOffset - this.minerXOffset) * Math.min(1, dt * 12);
      } else {
        // Step onto alternating cave rock ledges along the dug walls
        const stepIdx = Math.floor(this.minerWorldY / 95);
        const ledgeOffset = (stepIdx % 2 === 0 ? -1 : 1) * (shaftHalf * 0.28);
        this.minerXOffset += (ledgeOffset - this.minerXOffset) * Math.min(1, dt * 9);
      }
    }

    const minerWorldX = cx + this.minerXOffset;

    // Check sector monster caverns & breach seals
    for (const sector of this.sectors) {
      if (!sector.breached && bootsWorldY >= sector.worldY - 18) {
        sector.breached = true;
        this.attackTimer = 0.32;
        this.shakeIntensity = Math.max(this.shakeIntensity, 9);
        this.spawnBreachExplosion(cx, sector.worldY, sector.lootText, true);
        this.onSectorBreach?.(sector.id);
      }
    }

    // Cave bats patrol in excavated caverns — user clicks on bats to shoot them with the revolver!
    let nearestTargetAngle: number | null = null;
    let nearestDist = 230;

    for (const bat of this.ambientBats) {
      if (!bat.alive) {
        bat.respawnTimer -= dt;
        if (bat.respawnTimer <= 0) {
          bat.alive = true;
          bat.phase = Math.random() * Math.PI * 2;
        }
        continue;
      }

      if (bat.worldY > this.excavatedFrontierY - 12) continue;

      const { bx, by } = this.getBatScreenPos(bat, nowSec, cx, shaftHalf);
      const batWorldY = by + this.smoothScrollY;
      const dx = bx - minerWorldX;
      const dy = batWorldY - this.minerWorldY;
      const dist = Math.hypot(dx, dy);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestTargetAngle = Math.atan2(dy, dx);
      }
    }

    // Keep hover crosshair synced even while bats move under stationary cursor
    if (this.pointerScreenX >= 0 && !this.isMobileLayout()) {
      const hovered = this.findBatAtScreenPoint(this.pointerScreenX, this.pointerScreenY, nowSec);
      this.hoveredBatId = hovered ? hovered.id : null;
      if (hovered) {
        document.body.style.cursor = 'crosshair';
      } else if (document.body.style.cursor === 'crosshair') {
        document.body.style.cursor = '';
      }
    }

    // Headlamp angle: lock onto gun target while firing, aim down while digging, or scan bats/ledges
    if (this.gunPoseTimer > 0) {
      this.targetHeadlampAngle = this.gunAimAngle;
    } else if (nearestTargetAngle !== null) {
      this.targetHeadlampAngle = nearestTargetAngle;
    } else if (this.isAtRockFrontier && this.minerVelY > 25) {
      this.targetHeadlampAngle = Math.PI * 0.38;
    } else if (this.isMobileLayout()) {
      this.targetHeadlampAngle = 0.14 + Math.sin(nowSec * 1.1) * 0.18;
    } else {
      const sweep = Math.sin(nowSec * 1.05);
      this.targetHeadlampAngle = sweep >= 0 ? 0.2 + sweep * 0.22 : Math.PI - 0.2 + sweep * 0.22;
    }

    let angleDelta = this.targetHeadlampAngle - this.headlampAngle;
    while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    this.headlampAngle += angleDelta * Math.min(1, dt * 10);

    // Swinging lanterns physics
    for (const lantern of this.lanterns) {
      const distY = Math.abs(lantern.worldY - this.minerWorldY);
      if (distY < 75 && Math.abs(this.minerVelY) > 80) {
        lantern.angVel += (this.minerVelY > 0 ? 1 : -1) * lantern.side * dt * 2.5;
      }
      lantern.angVel += -9.5 * Math.sin(lantern.angle) * dt;
      lantern.angVel *= Math.pow(0.28, dt);
      lantern.angle += lantern.angVel * dt;
    }

    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.gunPoseTimer = Math.max(0, this.gunPoseTimer - dt);
    this.gunRecoil = Math.max(0, this.gunRecoil - dt * 6.5);
    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 26);

    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      this.bulletTracers[i].life -= dt;
      if (this.bulletTracers[i].life <= 0) {
        this.bulletTracers.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += (p.kind === 'rock' ? 560 : 190) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
    }

    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      this.slashArcs[i].life -= dt;
      if (this.slashArcs[i].life <= 0) this.slashArcs.splice(i, 1);
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.life -= dt;
      pop.y += pop.vy * dt;
      pop.vy *= Math.pow(0.35, dt);
      if (pop.life <= 0) this.popups.splice(i, 1);
    }

    for (const e of this.ambientEmbers) {
      e.y -= (e.speed * dt) / Math.max(this.height, 600);
      e.x += (e.drift * dt) / Math.max(this.width, 600);
      if (e.y < -0.05) {
        e.y = 1.05;
        e.x = Math.random();
      }
      if (e.x < 0) e.x += 1;
      if (e.x > 1) e.x -= 1;
    }

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, this.smoothScrollY / maxScroll));
    const depthMeters = -Math.round(progress * 750);
    minerSfx.setDepthProgress(progress);
    this.onDepthUpdate?.(depthMeters, progress);
  }

  private render(nowSec: number): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const { cx, shaftHalf, minerScale } = this.getShaftGeometry();

    ctx.save();
    ctx.scale(this.dpr, this.dpr);

    if (this.shakeIntensity > 0.2) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
    }

    // 1. HORROR CRIMSON CAVERN BACKDROP
    const bgGrad = ctx.createRadialGradient(
      cx,
      h * 0.42,
      20,
      cx,
      h * 0.5,
      Math.max(w * 0.85, h * 0.9)
    );
    bgGrad.addColorStop(0, '#CC122B');
    bgGrad.addColorStop(0.32, '#8F091C');
    bgGrad.addColorStop(0.7, '#3D030B');
    bgGrad.addColorStop(1, '#100104');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-20, -20, w + 40, h + 40);

    this.drawMistLayers(ctx, w, h, nowSec);
    this.drawBackgroundCavernStrata(ctx, w, h, cx, shaftHalf);

    // Rising ash embers inside excavated crimson tunnel
    const frontierScreenY = this.excavatedFrontierY - this.smoothScrollY;
    for (const e of this.ambientEmbers) {
      const ex = e.x * w;
      const ey = e.y * h;
      if (Math.abs(ex - cx) < shaftHalf && ey > frontierScreenY) continue;
      ctx.beginPath();
      ctx.arc(ex, ey, e.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 190, ${e.alpha * 0.5})`;
      ctx.fill();
    }

    // 2. DUG CAVE WALLS, STEPPED ROCK LEDGES, LADDERS & LANTERNS (above frontier)
    this.drawExcavatedCaveTunnel(ctx, w, h, cx, shaftHalf, frontierScreenY, minerScale, nowSec);

    // 3. SOLID UNEXCAVATED BLACK CAVE ROCK BELOW THE MINER'S BOOTS + BURIED MONSTER POCKETS!
    this.drawSolidCaveEarthBelow(ctx, h, cx, shaftHalf, frontierScreenY, minerScale, nowSec);

    // 4. AMBIENT CAVE BATS IN EXCAVATED CAVERNS
    this.drawAmbientBats(ctx, cx, shaftHalf, minerScale, nowSec);

    // 5. GROUNDED BLACK STICKMAN MINER (digging rock, climbing ladder, or standing on rock ledge!)
    const minerScreenX = cx + this.minerXOffset;
    const minerScreenY = this.minerWorldY - this.smoothScrollY;
    this.drawGroundedSupportIfAboveFrontier(ctx, cx, shaftHalf, minerScreenX, minerScreenY, minerScale);
    this.drawStickmanMiner(ctx, minerScreenX, minerScreenY, minerScale, nowSec);

    // 7. BULLET TRACERS, SLASH ARCS, FLYING ROCK CHIPS & POPUPS
    this.drawBulletTracers(ctx);
    this.drawSlashArcs(ctx);
    this.drawParticles(ctx);
    this.drawPopups(ctx);

    ctx.restore();
  }

  private drawMistLayers(ctx: CanvasRenderingContext2D, w: number, h: number, nowSec: number): void {
    for (let i = 0; i < 3; i++) {
      const yBase = ((h * (0.25 + i * 0.28) - (this.smoothScrollY * (0.1 + i * 0.05)) % h) + h) % h;
      const mistGrad = ctx.createRadialGradient(
        w * (0.45 + Math.sin(nowSec * 0.22 + i * 2) * 0.15),
        yBase,
        20,
        w * 0.5,
        yBase,
        w * 0.55
      );
      mistGrad.addColorStop(0, 'rgba(255, 52, 78, 0.12)');
      mistGrad.addColorStop(1, 'rgba(255, 52, 78, 0)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, yBase - 200, w, 400);
    }
  }

  private drawBackgroundCavernStrata(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cx: number,
    shaftHalf: number
  ): void {
    const parallaxY = this.smoothScrollY * 0.4;
    const step = 250;
    const startIdx = Math.floor(parallaxY / step) - 1;
    const endIdx = Math.ceil((parallaxY + h) / step) + 1;

    ctx.fillStyle = 'rgba(30, 2, 8, 0.55)';
    for (let idx = startIdx; idx <= endIdx; idx++) {
      const sy = idx * step - parallaxY;
      ctx.beginPath();
      ctx.moveTo(cx - shaftHalf - 24, sy + 60);
      ctx.quadraticCurveTo(cx, sy - 8, cx + shaftHalf + 24, sy + 60);
      ctx.lineTo(cx + shaftHalf + 24, sy + 80);
      ctx.quadraticCurveTo(cx, sy + 16, cx - shaftHalf - 24, sy + 80);
      ctx.closePath();
      ctx.fill();

      if (w > 900) {
        const jut = 38 + Math.abs(Math.sin(idx * 7.13)) * 75;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(jut, sy + step * 0.48);
        ctx.lineTo(0, sy + step);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w, sy + 20);
        ctx.lineTo(w - jut, sy + step * 0.52);
        ctx.lineTo(w, sy + step + 20);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawExcavatedCaveTunnel(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cx: number,
    shaftHalf: number,
    frontierScreenY: number,
    scale: number,
    nowSec: number
  ): void {
    const leftWallX = cx - shaftHalf;
    const rightWallX = cx + shaftHalf;
    const visibleBottomY = Math.min(h + 40, frontierScreenY + 8);
    if (visibleBottomY <= -40) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -40, w, visibleBottomY + 40);
    ctx.clip();

    // Jagged carved cave rock walls + old timber shoring posts along left & right tunnel sides
    const timberW = Math.max(8, 14 * scale);
    ctx.fillStyle = '#060304';
    ctx.fillRect(leftWallX - timberW, 0, timberW, visibleBottomY);
    ctx.fillRect(rightWallX, 0, timberW, visibleBottomY);

    // Subtle crimson rim light along tunnel walls
    ctx.fillStyle = 'rgba(255, 48, 76, 0.24)';
    ctx.fillRect(leftWallX - 1.5, 0, 1.5, visibleBottomY);
    ctx.fillRect(rightWallX, 0, 1.5, visibleBottomY);

    const bayHeight = 265;
    const firstBay = Math.floor(this.smoothScrollY / bayHeight) - 1;
    const lastBay = Math.ceil((this.smoothScrollY + visibleBottomY) / bayHeight) + 1;

    for (let bay = firstBay; bay <= lastBay; bay++) {
      const worldY = bay * bayHeight;
      const sy = worldY - this.smoothScrollY;

      ctx.fillStyle = '#060304';
      // Desktop side support beams under resume chambers
      if (w > 900) {
        if (bay % 2 === 0) {
          ctx.fillRect(24, sy, leftWallX - 24, 12);
          this.drawDiagonalBrace(ctx, leftWallX - timberW, sy + 12, leftWallX - 68, sy + 66, 8);
        } else {
          ctx.fillRect(rightWallX, sy, w - rightWallX - 24, 12);
          this.drawDiagonalBrace(ctx, rightWallX + timberW, sy + 12, rightWallX + 68, sy + 66, 8);
        }
      }

      // Timber corbels & diagonal mine braces inside tunnel
      ctx.fillRect(leftWallX - timberW, sy, timberW + 16 * scale, 10 * scale);
      ctx.fillRect(rightWallX - 16 * scale, sy, timberW + 16 * scale, 10 * scale);

      // Continuous wooden mine ladders for climbing!
      const ladderW = 14 * scale;
      const ladderX =
        bay % 2 === 0 ? leftWallX + 5 * scale : rightWallX - 5 * scale - ladderW;
      ctx.fillStyle = '#080406';
      ctx.fillRect(ladderX, sy + 8, 3 * scale, bayHeight - 12);
      ctx.fillRect(ladderX + ladderW, sy + 8, 3 * scale, bayHeight - 12);
      for (let rungY = sy + 20; rungY < sy + bayHeight - 8; rungY += 22 * scale) {
        ctx.fillRect(ladderX, rungY, ladderW + 3 * scale, 3 * scale);
      }

      // Stepped natural black cave rock ledges jutting inward along dug walls
      for (let sub = 0; sub < 3; sub++) {
        const ledgeY = sy + sub * 88 + 48;
        const onLeft = (bay + sub) % 2 === 0;
        const jutW = (24 + (sub % 2) * 10) * scale;
        ctx.fillStyle = '#050203';
        ctx.beginPath();
        if (onLeft) {
          ctx.moveTo(leftWallX, ledgeY);
          ctx.lineTo(leftWallX + jutW, ledgeY + 2);
          ctx.lineTo(leftWallX + jutW * 0.55, ledgeY + 16 * scale);
          ctx.lineTo(leftWallX, ledgeY + 22 * scale);
        } else {
          ctx.moveTo(rightWallX, ledgeY);
          ctx.lineTo(rightWallX - jutW, ledgeY + 2);
          ctx.lineTo(rightWallX - jutW * 0.55, ledgeY + 16 * scale);
          ctx.lineTo(rightWallX, ledgeY + 22 * scale);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Swinging Oil Lanterns inside excavated tunnel
    for (const lantern of this.lanterns) {
      if (lantern.worldY > this.excavatedFrontierY - 15) continue;
      const sy = lantern.worldY - this.smoothScrollY;
      if (sy < -80 || sy > visibleBottomY) continue;
      const anchorX =
        lantern.side === -1 ? leftWallX + 16 * scale : rightWallX - 16 * scale;
      this.drawSwingingLantern(ctx, anchorX, sy + 8, lantern.angle, scale, nowSec);
    }

    ctx.restore();
  }

  /**
   * Draws SOLID BLACK SUBTERRANEAN CAVE EARTH below the miner's boots (`frontierScreenY`),
   * with jagged dug pit surface, glowing red ore seams, and buried monster pockets!
   */
  private drawSolidCaveEarthBelow(
    ctx: CanvasRenderingContext2D,
    h: number,
    cx: number,
    shaftHalf: number,
    frontierScreenY: number,
    scale: number,
    nowSec: number
  ): void {
    if (frontierScreenY > h + 40) return;

    const leftX = cx - shaftHalf - 16 * scale;
    const rightX = cx + shaftHalf + 16 * scale;
    const minerScreenX = cx + this.minerXOffset;
    const topY = Math.max(-30, frontierScreenY);

    ctx.save();

    // 1. Solid pitch-black subterranean rock mass filling the shaft from miner's boots to bottom of screen!
    ctx.fillStyle = '#060304';
    ctx.beginPath();
    ctx.moveTo(leftX, topY - 14 * scale);

    // Jagged concave digging pit contour dipping right where the miner's boots & pickaxe stand!
    const segs = 10;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const px = leftX + (rightX - leftX) * t;
      const distFromMiner = Math.abs(px - minerScreenX) / Math.max(1, shaftHalf);
      const pitDip = Math.max(0, 1 - distFromMiner) * 8 * scale;
      const crag = Math.sin(this.excavatedFrontierY * 0.08 + i * 2.3) * 4.5 * scale;
      ctx.lineTo(px, topY - 8 * scale + pitDip + crag);
    }

    ctx.lineTo(rightX, topY - 14 * scale);
    ctx.lineTo(rightX, h + 50);
    ctx.lineTo(leftX, h + 50);
    ctx.closePath();
    ctx.fill();

    // Crisp crimson/amber crust highlight right along the freshly fractured rock edge under his boots
    ctx.strokeStyle = 'rgba(255, 62, 88, 0.52)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX + 6, topY - 11 * scale);
    ctx.quadraticCurveTo(minerScreenX, topY + 5 * scale, rightX - 6, topY - 11 * scale);
    ctx.stroke();

    // 2. Embedded glowing crimson crystal ore veins & rock strata cracks inside the solid dark earth below!
    const veinSpacing = 95;
    const firstVein = Math.floor((this.excavatedFrontierY + 20) / veinSpacing);
    const lastVein = Math.ceil((this.smoothScrollY + h + 60) / veinSpacing);

    for (let v = firstVein; v <= lastVein; v++) {
      const worldY = v * veinSpacing;
      const sy = worldY - this.smoothScrollY;
      if (sy < topY + 14 || sy > h + 30) continue;

      const side = v % 2 === 0 ? -1 : 1;
      const vx = cx + side * shaftHalf * 0.36;

      // Subtle dark crimson ore seam crack
      ctx.strokeStyle = 'rgba(255, 34, 64, 0.34)';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.moveTo(vx - 18 * scale, sy - 6 * scale);
      ctx.lineTo(vx, sy + 3 * scale);
      ctx.lineTo(vx + 16 * scale, sy - 4 * scale);
      ctx.stroke();

      // Tiny glowing red crystal cluster embedded in rock
      ctx.fillStyle = '#E01634';
      ctx.beginPath();
      ctx.moveTo(vx - 3 * scale, sy + 2 * scale);
      ctx.lineTo(vx, sy - 6 * scale);
      ctx.lineTo(vx + 4 * scale, sy + 2 * scale);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Buried Subterranean Monster Pockets waiting inside the rock at unbreached Sector depths!
    for (const sector of this.sectors) {
      if (sector.depthMeters === 0 || sector.breached) continue;
      const sy = sector.worldY - this.smoothScrollY;
      if (sy < topY + 24 || sy > h + 90) continue;

      // Hollow dark-crimson subterranean pocket carved inside the solid black rock!
      const pocketRx = Math.min(shaftHalf * 0.78, 92 * scale);
      const pocketRy = 34 * scale;
      const pocketGrad = ctx.createRadialGradient(cx, sy - 14 * scale, 4, cx, sy - 14 * scale, pocketRx);
      pocketGrad.addColorStop(0, '#960A1E');
      pocketGrad.addColorStop(0.75, '#3E030B');
      pocketGrad.addColorStop(1, '#060304');

      ctx.fillStyle = pocketGrad;
      ctx.beginPath();
      ctx.ellipse(cx, sy - 14 * scale, pocketRx, pocketRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // Guardian monster lurking inside the subterranean cave pocket!
      ctx.save();
      ctx.translate(cx, sy + 8 * scale);
      ctx.scale(scale, scale);
      this.drawPocketMonster(ctx, sector.enemyType, nowSec);
      ctx.restore();
    }

    ctx.restore();
  }

  private drawGroundedSupportIfAboveFrontier(
    ctx: CanvasRenderingContext2D,
    cx: number,
    shaftHalf: number,
    minerScreenX: number,
    minerScreenY: number,
    scale: number
  ): void {
    if (this.isAtRockFrontier || this.minerVelY < -35) return;

    // Draw a solid jagged cave rock outcrop + timber brace directly beneath the miner's boots so he never floats!
    const bootsY = minerScreenY + 24 * scale;
    const attachLeft = minerScreenX <= cx;
    const wallX = attachLeft ? cx - shaftHalf : cx + shaftHalf;

    ctx.save();
    ctx.fillStyle = '#060304';
    ctx.beginPath();
    ctx.moveTo(wallX, bootsY - 2 * scale);
    ctx.lineTo(minerScreenX + (attachLeft ? 20 : -20) * scale, bootsY - 1 * scale);
    ctx.lineTo(minerScreenX + (attachLeft ? 10 : -10) * scale, bootsY + 12 * scale);
    ctx.lineTo(wallX, bootsY + 20 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 62, 88, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(wallX, bootsY - 1.5 * scale);
    ctx.lineTo(minerScreenX + (attachLeft ? 19 : -19) * scale, bootsY - 1 * scale);
    ctx.stroke();
    ctx.restore();
  }

  private drawPocketMonster(
    ctx: CanvasRenderingContext2D,
    kind: SectorAnchor['enemyType'],
    nowSec: number
  ): void {
    const bob = Math.sin(nowSec * 4.2) * 2.5;
    if (kind === 'golem' || kind === 'boss') {
      ctx.fillStyle = '#050203';
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-24, -22 + bob);
      ctx.lineTo(-11, -38 + bob);
      ctx.lineTo(11, -38 + bob);
      ctx.lineTo(24, -20 + bob);
      ctx.lineTo(18, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFF6E8';
      ctx.fillRect(-9, -27 + bob, 5, 3);
      ctx.fillRect(4, -27 + bob, 5, 3);
    } else if (kind === 'skeleton') {
      ctx.strokeStyle = '#050203';
      ctx.fillStyle = '#050203';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.arc(0, -32 + bob, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -24 + bob);
      ctx.lineTo(0, -11 + bob);
      ctx.lineTo(-8, 0);
      ctx.moveTo(0, -11 + bob);
      ctx.lineTo(8, 0);
      ctx.moveTo(0, -21 + bob);
      ctx.lineTo(12, -30 + Math.sin(nowSec * 6) * 4);
      ctx.stroke();

      ctx.fillStyle = '#FFF8EC';
      ctx.fillRect(-3.5, -34 + bob, 2.2, 2.2);
      ctx.fillRect(1.5, -34 + bob, 2.2, 2.2);
    } else {
      // Glowing-eyed cave spider / Lurker
      ctx.fillStyle = '#050203';
      ctx.beginPath();
      ctx.arc(0, -18 + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#050203';
      ctx.lineWidth = 2.6;
      for (const dir of [-1, 1]) {
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(0, -18 + bob);
          ctx.lineTo(dir * 16, -24 + k * 6 + bob);
          ctx.lineTo(dir * 22, -12 + k * 6 + bob);
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#FF2846';
      ctx.fillRect(-4, -20 + bob, 2.6, 2.6);
      ctx.fillRect(1.5, -20 + bob, 2.6, 2.6);
    }
  }

  private drawDiagonalBrace(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness: number
  ): void {
    ctx.save();
    ctx.strokeStyle = '#060304';
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  private drawSwingingLantern(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    angle: number,
    scale: number,
    nowSec: number
  ): void {
    const chainLen = 24 * scale;
    const lx = anchorX + Math.sin(angle) * chainLen;
    const ly = anchorY + Math.cos(angle) * chainLen;
    const flicker = 0.88 + Math.sin(nowSec * 9.3 + anchorY) * 0.12;

    const radius = 58 * scale * flicker;
    const glow = ctx.createRadialGradient(lx, ly + 6 * scale, 2, lx, ly + 6 * scale, radius);
    glow.addColorStop(0, 'rgba(255, 244, 205, 0.72)');
    glow.addColorStop(0.34, 'rgba(255, 105, 58, 0.28)');
    glow.addColorStop(1, 'rgba(255, 30, 56, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly + 6 * scale, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(anchorX, anchorY);
    ctx.rotate(-angle);
    ctx.scale(scale, scale);

    ctx.strokeStyle = '#060304';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 24);
    ctx.stroke();

    ctx.fillStyle = '#060304';
    ctx.fillRect(-6, 22, 12, 4);
    ctx.fillStyle = '#FFF3C4';
    ctx.fillRect(-4, 26, 8, 10);
    ctx.fillStyle = '#060304';
    ctx.fillRect(-5.5, 36, 11, 3.5);
    ctx.restore();
  }

  private drawAmbientBats(
    ctx: CanvasRenderingContext2D,
    cx: number,
    shaftHalf: number,
    scale: number,
    nowSec: number
  ): void {
    const bScale = scale * 1.18;
    for (const bat of this.ambientBats) {
      if (!bat.alive || bat.worldY > this.excavatedFrontierY - 12) continue;
      const { bx, by: sy } = this.getBatScreenPos(bat, nowSec, cx, shaftHalf);
      if (sy < -50 || sy > this.height + 50) continue;

      const isHovered = this.hoveredBatId === bat.id;
      const flap = Math.sin(nowSec * 13 + bat.phase) * 9.5 * bScale;

      ctx.save();
      ctx.translate(bx, sy);

      // Subtle crimson aura so clickable bats stand out clearly against shadows
      const batGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, isHovered ? 28 * bScale : 18 * bScale);
      batGlow.addColorStop(0, isHovered ? 'rgba(255, 245, 210, 0.55)' : 'rgba(255, 38, 68, 0.32)');
      batGlow.addColorStop(1, 'rgba(255, 38, 68, 0)');
      ctx.fillStyle = batGlow;
      ctx.beginPath();
      ctx.arc(0, 0, isHovered ? 28 * bScale : 18 * bScale, 0, Math.PI * 2);
      ctx.fill();

      // Bat body
      ctx.fillStyle = '#060304';
      ctx.beginPath();
      ctx.arc(0, 0, 5.4 * bScale, 0, Math.PI * 2);
      ctx.fill();

      // Jagged flapping wings
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, -2 * bScale);
        ctx.quadraticCurveTo(
          dir * 11.5 * bScale,
          -11.5 * bScale + flap,
          dir * 20 * bScale,
          -3 * bScale + flap
        );
        ctx.lineTo(dir * 13 * bScale, 3.5 * bScale + flap * 0.35);
        ctx.lineTo(dir * 6 * bScale, 1.5 * bScale);
        ctx.closePath();
        ctx.fill();
      }

      // Glowing crimson/white bat eyes
      ctx.fillStyle = isHovered ? '#FF2A48' : '#FFF8EB';
      ctx.fillRect(-3 * bScale, -1.8 * bScale, 2.1 * bScale, 2.1 * bScale);
      ctx.fillRect(1.1 * bScale, -1.8 * bScale, 2.1 * bScale, 2.1 * bScale);

      // Target Lock-On Crosshair Reticle when hovering over bat!
      if (isHovered) {
        const r = 19 * bScale;
        ctx.strokeStyle = '#FFF6DF';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.moveTo(-r - 5, 0);
        ctx.lineTo(-r + 5, 0);
        ctx.moveTo(r - 5, 0);
        ctx.lineTo(r + 5, 0);
        ctx.moveTo(0, -r - 5);
        ctx.lineTo(0, -r + 5);
        ctx.moveTo(0, r - 5);
        ctx.lineTo(0, r + 5);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawStickmanMiner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    nowSec: number
  ): void {
    const speed = Math.abs(this.minerVelY);
    const isShootingGun = this.gunPoseTimer > 0;
    const isClimbingUp = !isShootingGun && !this.isAtRockFrontier && this.minerVelY < -35;
    const isActivelyDigging =
      !isShootingGun && this.isAtRockFrontier && (this.minerVelY > 18 || this.attackTimer > 0);
    const facing = isShootingGun
      ? Math.cos(this.gunAimAngle) >= 0
        ? 1
        : -1
      : this.isMobileLayout()
        ? 1
        : Math.cos(this.headlampAngle) >= -0.15
          ? 1
          : -1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. VOLUMETRIC WHITE-WARM HEADLAMP BEAM
    ctx.save();
    ctx.translate(facing * 6, -24);
    ctx.rotate(this.headlampAngle);

    const coneLen = this.isMobileLayout() ? 185 : 230;
    const coneSpread = this.isMobileLayout() ? 54 : 66;
    const beamGrad = ctx.createLinearGradient(0, 0, coneLen, 0);
    beamGrad.addColorStop(0, 'rgba(255, 252, 238, 0.58)');
    beamGrad.addColorStop(0.38, 'rgba(255, 240, 218, 0.22)');
    beamGrad.addColorStop(1, 'rgba(255, 235, 210, 0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(coneLen, -coneSpread);
    ctx.lineTo(coneLen, coneSpread);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Rim backlight so black stickman pops crisply against cave silhouettes
    const aura = ctx.createRadialGradient(0, -4, 4, 0, -4, 34);
    aura.addColorStop(0, 'rgba(255, 48, 76, 0.42)');
    aura.addColorStop(1, 'rgba(255, 48, 76, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -4, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#050203';
    ctx.fillStyle = '#050203';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isClimbingUp) {
      // LADDER CLIMBING POSTURE (hands & boots gripping wooden ladder rungs!)
      const climbPhase = this.minerWorldY * 0.09;
      const leftLift = Math.sin(climbPhase) * 6;
      const rightLift = -leftLift;

      // Legs on rungs
      ctx.lineWidth = 5.4;
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(-8, 15 + leftLift * 0.5);
      ctx.lineTo(-6, 24 + leftLift);
      ctx.moveTo(0, 6);
      ctx.lineTo(8, 15 + rightLift * 0.5);
      ctx.lineTo(6, 24 + rightLift);
      ctx.stroke();

      // Torso
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(0, -15);
      ctx.stroke();

      // Arms reaching up rungs
      ctx.lineWidth = 4.8;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(-9, -20 + rightLift);
      ctx.lineTo(-6, -28 + rightLift);
      ctx.moveTo(0, -13);
      ctx.lineTo(9, -20 + leftLift);
      ctx.lineTo(6, -28 + leftLift);
      ctx.stroke();

      // Pickaxe strapped across back while climbing
      ctx.save();
      ctx.translate(-4, -6);
      ctx.rotate(-0.65);
      this.drawPickaxeTool(ctx);
      ctx.restore();

      this.drawMinerHeadAndHat(ctx, 0, -25, facing);
    } else {
      // GROUNDED ROCK-DIGGING & COMBAT STANCE (Both boots firmly planted on the rock floor y = +24!)
      const digCycle = isActivelyDigging
        ? Math.sin(this.digSwingPhase + nowSec * 14)
        : Math.sin(nowSec * 3.2) * 0.15;

      // Body crouches forward into the pickaxe downward slam!
      const slamBend = isActivelyDigging ? Math.max(0, digCycle) * 6.5 : 0;
      const breathe = Math.sin(nowSec * 3.8) * 1.1;

      const hipX = -facing * 2;
      const hipY = 7 + slamBend * 0.45 + breathe * 0.4;
      const shoulderX = facing * (4 + slamBend * 0.9);
      const shoulderY = -14 + slamBend + breathe;
      const headX = shoulderX + facing * 2.5;
      const headY = shoulderY - 10.5;

      // GROUNDED LEGS (planted solidly at y = 24 on the jagged black cave floor!)
      ctx.lineWidth = 5.6;
      // Back braced leg
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hipX - facing * 8, 16);
      ctx.lineTo(hipX - facing * 12, 24);
      // Front bent knee braced on rock
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(hipX + facing * 11, 15);
      ctx.lineTo(hipX + facing * 13, 24);
      ctx.stroke();

      // TORSO SPINE
      ctx.lineWidth = 6.2;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(shoulderX, shoulderY);
      ctx.stroke();

      if (isShootingGun) {
        // GUNSLINGER POSE: Off-hand braces pickaxe upright in stone while shooting arm aims Six-Shooter Revolver!
        const recoilKick = -facing * this.gunRecoil * 0.28;
        const aimAng = this.gunAimAngle + recoilKick;

        // Off-hand resting on planted pickaxe
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 2);
        ctx.lineTo(shoulderX - facing * 10, shoulderY + 10);
        ctx.stroke();

        ctx.save();
        ctx.translate(shoulderX - facing * 12, 23);
        ctx.rotate(-facing * 0.14);
        this.drawPickaxeTool(ctx);
        ctx.restore();

        // Outstretched revolver shooting arm
        const elbowX = shoulderX + Math.cos(aimAng) * 9 - Math.cos(aimAng) * this.gunRecoil * 2.5;
        const elbowY = shoulderY + Math.sin(aimAng) * 9 - Math.sin(aimAng) * this.gunRecoil * 2.5;
        const gunHandX = shoulderX + Math.cos(aimAng) * 18 - Math.cos(aimAng) * this.gunRecoil * 4;
        const gunHandY = shoulderY + Math.sin(aimAng) * 18 - Math.sin(aimAng) * this.gunRecoil * 4;

        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 1);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(gunHandX, gunHandY);
        ctx.stroke();

        // Draw Old-West Six-Shooter Revolver in hand!
        this.drawRevolverGun(ctx, gunHandX, gunHandY, aimAng, facing);
      } else {
        // Holstered Revolver on hip belt while mining!
        ctx.save();
        ctx.translate(hipX - facing * 5, hipY + 3);
        ctx.rotate(facing * 0.45);
        ctx.fillStyle = '#050203';
        ctx.fillRect(-2.5, 0, 5, 10);
        ctx.strokeStyle = 'rgba(255, 240, 215, 0.55)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-2.5, 0, 5, 9);
        ctx.restore();

        // DOWNWARD CAVE-DIGGING PICKAXE SWING!
        let swingAngle: number;
        if (isActivelyDigging || speed > 45) {
          const normSwing = (digCycle + 1) * 0.5;
          swingAngle = facing * (-0.95 + normSwing * 2.55);
        } else {
          swingAngle = facing * (0.55 + Math.sin(nowSec * 2.8) * 0.06);
        }

        const handX = shoulderX + Math.sin(swingAngle) * 12;
        const handY = shoulderY - Math.cos(swingAngle) * 8 + 4;

        // TWO-HANDED HEAVY PICKAXE GRIP
        ctx.lineWidth = 4.9;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY + 2);
        ctx.lineTo(shoulderX + facing * 7, shoulderY + 7);
        ctx.lineTo(handX, handY);
        ctx.moveTo(shoulderX, shoulderY + 1);
        ctx.lineTo(shoulderX - facing * 4, shoulderY - 4);
        ctx.lineTo(handX, handY);
        ctx.stroke();

        ctx.save();
        ctx.translate(handX, handY);
        ctx.rotate(swingAngle);
        this.drawPickaxeTool(ctx);
        ctx.restore();
      }

      this.drawMinerHeadAndHat(ctx, headX, headY, facing);
    }

    ctx.restore();
  }

  private drawRevolverGun(
    ctx: CanvasRenderingContext2D,
    handX: number,
    handY: number,
    aimAngle: number,
    facing: number
  ): void {
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(aimAngle);
    if (facing < 0) {
      ctx.scale(1, -1);
    }

    // Revolver grip
    ctx.fillStyle = '#050203';
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(2, 0);
    ctx.lineTo(-1, 8.5);
    ctx.lineTo(-5.5, 7.5);
    ctx.closePath();
    ctx.fill();

    // Six-shooter cylinder + long iron barrel
    ctx.fillRect(0, -4.2, 7.5, 5.5);
    ctx.fillRect(7, -3.8, 12.5, 3.2);

    // Hammer spur
    ctx.beginPath();
    ctx.moveTo(-1, -4);
    ctx.lineTo(-3.5, -6.5);
    ctx.lineTo(0.5, -4.5);
    ctx.closePath();
    ctx.fill();

    // Crisp metallic barrel & cylinder glint so the gun reads clearly against dark silhouettes!
    ctx.strokeStyle = 'rgba(255, 248, 232, 0.85)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(0.5, -4);
    ctx.lineTo(19, -3.6);
    ctx.stroke();

    ctx.restore();
  }

  private drawBulletTracers(ctx: CanvasRenderingContext2D): void {
    for (const b of this.bulletTracers) {
      const sy1 = b.startY - this.smoothScrollY;
      const sy2 = b.endY - this.smoothScrollY;
      const t = b.life / b.maxLife;

      ctx.save();
      // Outer crimson shock trail
      ctx.strokeStyle = `rgba(255, 42, 72, ${0.72 * t})`;
      ctx.lineWidth = 5.5 * t;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.startX, sy1);
      ctx.lineTo(b.endX, sy2);
      ctx.stroke();

      // Inner white-gold hot bullet core
      ctx.strokeStyle = `rgba(255, 250, 230, ${0.98 * t})`;
      ctx.lineWidth = 2.1 * t;
      ctx.beginPath();
      ctx.moveTo(b.startX, sy1);
      ctx.lineTo(b.endX, sy2);
      ctx.stroke();

      // Muzzle flash starburst during initial flash frames!
      if (t > 0.55) {
        const flashR = 16 * ((t - 0.55) / 0.45);
        const flashGrad = ctx.createRadialGradient(b.startX, sy1, 1, b.startX, sy1, flashR * 1.8);
        flashGrad.addColorStop(0, 'rgba(255, 253, 235, 0.98)');
        flashGrad.addColorStop(0.45, 'rgba(255, 140, 60, 0.72)');
        flashGrad.addColorStop(1, 'rgba(255, 34, 66, 0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(b.startX, sy1, flashR * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawPickaxeTool(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#050203';
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, -26);
    ctx.stroke();

    ctx.fillStyle = '#050203';
    ctx.beginPath();
    ctx.moveTo(-19, -18);
    ctx.quadraticCurveTo(0, -31, 19, -18);
    ctx.quadraticCurveTo(0, -23, -19, -18);
    ctx.closePath();
    ctx.fill();

    // Crisp metallic pickaxe edge highlight
    ctx.strokeStyle = 'rgba(255, 246, 232, 0.78)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18, -18.5);
    ctx.quadraticCurveTo(0, -29.5, 18, -18.5);
    ctx.stroke();
  }

  private drawMinerHeadAndHat(
    ctx: CanvasRenderingContext2D,
    headX: number,
    headY: number,
    facing: number
  ): void {
    ctx.fillStyle = '#050203';
    ctx.beginPath();
    ctx.arc(headX, headY, 8.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(headX, headY - 3);
    ctx.rotate(facing * 0.1);
    ctx.fillStyle = '#050203';
    ctx.beginPath();
    ctx.arc(0, -1, 9.8, Math.PI, 0);
    ctx.fill();

    ctx.lineWidth = 3.1;
    ctx.strokeStyle = '#050203';
    ctx.beginPath();
    ctx.moveTo(-11.5, -1);
    ctx.lineTo(12.5 * facing, -1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 240, 220, 0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, -2, 8.5, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();

    const lensX = facing * 9;
    const lensY = -4.2;
    ctx.fillStyle = '#FFFDF7';
    ctx.beginPath();
    ctx.arc(lensX, lensY, 3.4, 0, Math.PI * 2);
    ctx.fill();

    const lensHalo = ctx.createRadialGradient(lensX, lensY, 1, lensX, lensY, 12);
    lensHalo.addColorStop(0, 'rgba(255, 252, 235, 0.95)');
    lensHalo.addColorStop(1, 'rgba(255, 252, 235, 0)');
    ctx.fillStyle = lensHalo;
    ctx.beginPath();
    ctx.arc(lensX, lensY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSlashArcs(ctx: CanvasRenderingContext2D): void {
    for (const arc of this.slashArcs) {
      const sy = arc.y - this.smoothScrollY;
      const t = arc.life / arc.maxLife;
      ctx.save();
      ctx.translate(arc.x, sy);
      ctx.rotate(arc.angle);
      ctx.beginPath();
      ctx.arc(0, 0, arc.radius, -0.95, 0.95);
      ctx.arc(-6, 0, arc.radius * 0.84, 0.95, -0.95, true);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 248, 238, ${0.88 * t})`;
      ctx.fill();
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const sy = p.y - this.smoothScrollY;
      if (sy < -40 || sy > this.height + 40) continue;
      const alpha = Math.min(1, p.life / (p.maxLife * 0.45));

      ctx.save();
      ctx.translate(p.x, sy);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.kind === 'rock') {
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.4);
        ctx.lineTo(s * 0.55, -s * 0.3);
        ctx.lineTo(s * 0.4, s * 0.5);
        ctx.lineTo(-s * 0.45, s * 0.35);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawPopups(ctx: CanvasRenderingContext2D): void {
    for (const pop of this.popups) {
      const sy = pop.y - this.smoothScrollY;
      if (sy < -40 || sy > this.height + 40) continue;
      const alpha = Math.min(1, pop.life / (pop.maxLife * 0.35));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = pop.accent
        ? '700 12px "JetBrains Mono", monospace'
        : '800 13px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';

      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(6, 3, 4, 0.92)';
      ctx.strokeText(pop.text, pop.x, sy);

      ctx.fillStyle = pop.accent ? '#FFF5D6' : '#FFFFFF';
      ctx.fillText(pop.text, pop.x, sy);
      ctx.restore();
    }
  }

  private loop = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;
    const nowSec = now * 0.001;

    this.update(dt, nowSec);
    this.render(nowSec);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public destroy(): void {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    document.body.style.cursor = '';
  }
}
