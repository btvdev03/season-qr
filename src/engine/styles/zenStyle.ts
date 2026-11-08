/**
 * SeasonQR - Zen Garden 3D Style Generator
 *
 * Generates a traditional Japanese Zen Rock Garden (Karesansui):
 * - Harmonious San-zon-seki three-stone arrangement
 * - Carved stone Kasuga toro lantern with glowing warm paper window
 * - Miniature vermilion Torii gate or bamboo grove
 * - Stepping stones (Tobi-ishi)
 * - All props deterministically placed in safe non-finder zones.
 */

import * as THREE from 'three';
import type { QRStyleGenerator, StyleGenerateParams } from './types';
import { buildQRBase } from './baseQRBuilder';

export const zenStyle: QRStyleGenerator = {
  id: 'zen',
  name: 'Zen Garden Sanctuary',
  vietnameseName: 'Vườn Thiền Thanh Tịnh',
  icon: '🪨',
  description: 'A peaceful Japanese Zen rock garden with a glowing stone lantern, bonsai, and sacred rocks.',
  vietnameseDescription: 'Khu vườn thiền Karesansui tĩnh tại với đèn đá phát sáng, cây tùng thế và đá thiêng.',

  generate(params: StyleGenerateParams): THREE.Group {
    const { matrix, season, sceneSize = 24 } = params;
    const rng = matrix.rng;

    const rootGroup = new THREE.Group();
    rootGroup.name = 'Style_ZenGarden';

    // 1. Build Base QR Ground
    const baseLayout = buildQRBase(matrix, season, {
      sceneSize,
      slabDepth: 1.2,
    });
    rootGroup.add(baseLayout.group);

    const zenPropsGroup = new THREE.Group();
    zenPropsGroup.name = 'ZenProps';

    const rockMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.rockPrimary),
      roughness: 0.95,
      metalness: 0.05,
    });
    const rockSecMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(season.structure.rockSecondary),
      roughness: 0.9,
      metalness: 0.05,
    });

    // 2. Japanese Stone Lantern (Toro)
    // Place in a safe non-finder zone (e.g. upper center-right area: row ~ 3, col ~ size - 12)
    const lanternRow = Math.max(8, Math.min(matrix.size - 9, Math.floor(matrix.size * 0.28)));
    const lanternCol = Math.max(8, Math.min(matrix.size - 9, Math.floor(matrix.size * 0.72)));

    const { x: lx, z: lz } = baseLayout.toWorldPos(lanternRow, lanternCol);
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(lx, 0, lz);

    // Lantern Base (Jikarin)
    const lBaseGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.4, 6);
    const lBase = new THREE.Mesh(lBaseGeo, rockMat);
    lBase.position.y = 0.2;
    lBase.castShadow = true;
    lanternGroup.add(lBase);

    // Lantern Post (Sao)
    const lPostGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.2, 6);
    const lPost = new THREE.Mesh(lPostGeo, rockMat);
    lPost.position.y = 1.0;
    lPost.castShadow = true;
    lanternGroup.add(lPost);

    // Lantern Middle Platform (Chudai)
    const lMidGeo = new THREE.CylinderGeometry(0.85, 0.6, 0.35, 6);
    const lMid = new THREE.Mesh(lMidGeo, rockMat);
    lMid.position.y = 1.75;
    lMid.castShadow = true;
    lanternGroup.add(lMid);

    // Light Box (Hibukuro) with glowing window
    const lBoxGeo = new THREE.BoxGeometry(0.8, 0.75, 0.8);
    const lBoxMat = new THREE.MeshStandardMaterial({
      color:
        season.id === 'cyberpunk'
          ? new THREE.Color('#06b6d4')
          : new THREE.Color('#fffae0'),
      emissive:
        season.id === 'cyberpunk'
          ? new THREE.Color('#00ffff')
          : new THREE.Color('#ffb703'),
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    const lBox = new THREE.Mesh(lBoxGeo, lBoxMat);
    lBox.position.y = 2.3;
    lanternGroup.add(lBox);

    // Lantern Roof (Kasa) - Japanese curved pagoda roof
    const lRoofGeo = new THREE.ConeGeometry(1.3, 0.65, 6);
    const lRoof = new THREE.Mesh(lRoofGeo, rockSecMat);
    lRoof.position.y = 2.95;
    lRoof.castShadow = true;
    lanternGroup.add(lRoof);

    // Roof Top Jewel (Hoju)
    const lJewelGeo = new THREE.SphereGeometry(0.22, 6, 6);
    const lJewel = new THREE.Mesh(lJewelGeo, rockSecMat);
    lJewel.position.y = 3.4;
    lanternGroup.add(lJewel);

    // Warm glow point light from lantern
    const lanternLight = new THREE.PointLight(
      season.id === 'cyberpunk' ? '#00ffff' : '#ffb703',
      1.2,
      8
    );
    lanternLight.position.y = 2.3;
    lanternLight.castShadow = false;
    lanternGroup.add(lanternLight);

    zenPropsGroup.add(lanternGroup);

    // 3. Sacred Rock Trinity (San-zon-seki)
    // Place in center-left quadrant (safe from finder patterns)
    const rockRow = Math.floor(matrix.size * 0.65);
    const rockCol = Math.max(8, Math.floor(matrix.size * 0.32));
    const { x: rx, z: rz } = baseLayout.toWorldPos(rockRow, rockCol);

    const rockGroup = new THREE.Group();
    rockGroup.position.set(rx, 0, rz);

    // Main towering rock (Taishaku)
    const r1Geo = new THREE.DodecahedronGeometry(1.2, 0);
    const r1 = new THREE.Mesh(r1Geo, rockMat);
    r1.scale.set(0.9, 2.0, 1.1);
    r1.position.set(0, 1.2, 0);
    r1.rotation.set(0.1, 0.4, -0.15);
    r1.castShadow = true;
    rockGroup.add(r1);

    // Left attendant rock (Kishi)
    const r2Geo = new THREE.DodecahedronGeometry(0.8, 0);
    const r2 = new THREE.Mesh(r2Geo, rockSecMat);
    r2.scale.set(1.0, 1.3, 0.9);
    r2.position.set(-1.2, 0.7, 0.4);
    r2.rotation.set(-0.2, 0.8, 0.2);
    r2.castShadow = true;
    rockGroup.add(r2);

    // Right attendant rock (Gakyu)
    const r3Geo = new THREE.DodecahedronGeometry(0.65, 0);
    const r3 = new THREE.Mesh(r3Geo, rockMat);
    r3.scale.set(1.1, 0.9, 1.0);
    r3.position.set(1.1, 0.5, -0.3);
    r3.rotation.set(0.3, -0.5, 0.1);
    r3.castShadow = true;
    rockGroup.add(r3);

    zenPropsGroup.add(rockGroup);

    // 4. Miniature Torii Gate or Bonsai Grove in non-finder safe quadrant
    // Center-top area: row ~ 9, col ~ size / 2
    const midCol = Math.floor(matrix.size / 2);
    const topSafeRow = Math.min(matrix.size - 9, 8);
    const { x: tx, z: tz } = baseLayout.toWorldPos(topSafeRow, midCol);

    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(tx, 0, tz);

    const toriiMat = new THREE.MeshStandardMaterial({
      color:
        season.id === 'cyberpunk'
          ? new THREE.Color('#ec4899')
          : new THREE.Color('#c0392b'), // Traditional vermilion red
      roughness: 0.5,
      metalness: season.id === 'cyberpunk' ? 0.7 : 0.1,
    });

    const toriiTopMat = new THREE.MeshStandardMaterial({
      color:
        season.id === 'cyberpunk'
          ? new THREE.Color('#06b6d4')
          : new THREE.Color('#1e1b18'), // Dark black lintel
      roughness: 0.6,
    });

    const pillarH = 3.6;
    const pillarDist = 2.4;
    const pillarRadius = 0.18;

    // Left pillar
    const leftPillarGeo = new THREE.CylinderGeometry(
      pillarRadius * 0.9,
      pillarRadius,
      pillarH,
      6
    );
    const leftPillar = new THREE.Mesh(leftPillarGeo, toriiMat);
    leftPillar.position.set(-pillarDist / 2, pillarH / 2, 0);
    leftPillar.castShadow = true;
    toriiGroup.add(leftPillar);

    // Right pillar
    const rightPillarGeo = new THREE.CylinderGeometry(
      pillarRadius * 0.9,
      pillarRadius,
      pillarH,
      6
    );
    const rightPillar = new THREE.Mesh(rightPillarGeo, toriiMat);
    rightPillar.position.set(pillarDist / 2, pillarH / 2, 0);
    rightPillar.castShadow = true;
    toriiGroup.add(rightPillar);

    // Lower lintel (Nuki)
    const nukiGeo = new THREE.BoxGeometry(pillarDist + 0.8, 0.22, 0.25);
    const nuki = new THREE.Mesh(nukiGeo, toriiMat);
    nuki.position.set(0, pillarH * 0.78, 0);
    nuki.castShadow = true;
    toriiGroup.add(nuki);

    // Upper lintel (Kasagi / Shimaki)
    const kasagiGeo = new THREE.BoxGeometry(pillarDist + 1.8, 0.32, 0.4);
    const kasagi = new THREE.Mesh(kasagiGeo, toriiTopMat);
    kasagi.position.set(0, pillarH + 0.15, 0);
    kasagi.castShadow = true;
    toriiGroup.add(kasagi);

    zenPropsGroup.add(toriiGroup);

    // 5. Stepping Stones (Tobi-ishi) Path
    const stepCount = 5;
    for (let s = 0; s < stepCount; s++) {
      const stepProg = (s + 1) / (stepCount + 1);
      const sx = THREE.MathUtils.lerp(lx, rx, stepProg) + rng.range(-0.3, 0.3);
      const sz = THREE.MathUtils.lerp(lz, rz, stepProg) + rng.range(-0.3, 0.3);

      const stepGeo = new THREE.CylinderGeometry(
        rng.range(0.35, 0.55),
        rng.range(0.4, 0.6),
        0.16,
        6
      );
      const stepMesh = new THREE.Mesh(stepGeo, rockMat);
      stepMesh.position.set(sx, 0.08, sz);
      stepMesh.rotation.y = rng.range(0, Math.PI);
      stepMesh.receiveShadow = true;
      zenPropsGroup.add(stepMesh);
    }

    rootGroup.add(zenPropsGroup);

    return rootGroup;
  },
};
