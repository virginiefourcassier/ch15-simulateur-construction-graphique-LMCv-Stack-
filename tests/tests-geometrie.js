// Tests automatisés du moteur géométrique (Node.js, sans dépendance).
// Lancement :  node tests/tests-geometrie.js   (depuis le dossier construction-image-lentille)
// Le moteur est extrait directement de index.html : on teste exactement le code publié.
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const code = html.split('/* ==== MOTEUR DEBUT ==== */')[1].split('/* ==== MOTEUR FIN ==== */')[0];
const M = new Function('module', code + '\nreturn Moteur;')(undefined);

const N = 2000; // nombre de tirages aléatoires testés
const lignes = [];
let nbOk = 0, nbKo = 0;
function log(s) { console.log(s); lignes.push(s); }
function test(nom, fn) {
  try { const info = fn(); nbOk++; log('✔ ' + nom + (info ? ' — ' + info : '')); }
  catch (e) { nbKo++; log('✘ ' + nom + '\n    ' + e.message); }
}
function assert(c, msg) { if (!c) throw new Error(msg); }

const CFG = M.configurer({});
const TOL = M.tolerancesEffectives(CFG); // tolérances en carreaux (sans écran)
const G = CFG.grille;
const rng = M.rngDepuisGraine(20261111);

function pointSur(a, b, x) { const t = (x - a.x) / (b.x - a.x); return { x, y: a.y + t * (b.y - a.y) }; }
function rot(centre, p, deg) {
  const r = deg * Math.PI / 180, dx = p.x - centre.x, dy = p.y - centre.y;
  return { x: centre.x + dx * Math.cos(r) - dy * Math.sin(r), y: centre.y + dx * Math.sin(r) + dy * Math.cos(r) };
}
function constructionIdeale(ex) {
  const xf = G.xmax - 0.5;
  return {
    segs: {
      1: { p: ex.B, q: ex.I1 },
      2: { p: ex.I1, q: pointSur(ex.I1, ex.Fp, xf) },
      3: { p: ex.B, q: ex.O },
      4: { p: ex.O, q: pointSur(ex.B, ex.O, xf) },
      5: { p: ex.B, q: ex.I3 },
      6: { p: ex.I3, q: { x: xf, y: ex.I3.y } },
      8: { p: ex.Bp, q: ex.Ap }
    },
    bp: { x: ex.Bp.x, y: ex.Bp.y }
  };
}
function copie(e) { return JSON.parse(JSON.stringify(e)); }
function verif(k, ex, etat) { return M.verifierEtape(k, ex, etat, TOL, CFG); }
function attendreRefus(k, ex, etat, codes, quoi) {
  const r = verif(k, ex, etat);
  assert(!r.ok, quoi + ' : accepté à tort (OA=' + ex.OA + ', f=' + ex.f + ', AB=' + ex.AB + ')');
  if (codes) assert(codes.indexOf(r.code) >= 0, quoi + ' : code ' + r.code + ' au lieu de ' + codes.join('/'));
}

// ---------- tirages ----------
const exos = [];
for (let i = 0; i < N; i++) exos.push(M.genererExercice(CFG, rng));

log('Tests du moteur géométrique — ' + new Date().toISOString().slice(0, 10) + ' — ' + N + ' tirages (graine 20261111)\n');

test('T15 — tous les tirages sont constructibles et entièrement visibles', () => {
  exos.forEach(ex => {
    const v = M.verifierExercice(ex, CFG);
    assert(v.ok, 'tirage refusé : ' + v.raisons.join(', '));
    assert(ex.OA > ex.f, 'OA <= f');
    const k = ex.OA / ex.f;
    assert(k >= CFG.kMin - 1e-9 && k <= CFG.kMax + 1e-9, 'OA hors [1,5 f ; 3 f]');
    assert(ex.Bp.x > 0 && ex.Bp.y < 0, 'image non réelle / non renversée');
    [ex.A, ex.B, ex.Bp, ex.Ap, ex.I1, ex.I3].forEach(P => {
      assert(P.x >= G.xmin + 1.5 - 1e-9 && P.x <= G.xmax - 1.5 + 1e-9 && P.y >= G.ymin + 1.5 - 1e-9 && P.y <= G.ymax - 1.5 + 1e-9, 'point trop près du bord');
    });
    assert(Math.abs(ex.I3.y) <= CFG.demiHauteurLentille && ex.I1.y <= CFG.demiHauteurLentille, 'incidence hors lentille');
  });
});

test('Tirage — images agrandies, réduites et de même taille présentes', () => {
  const c = { agrandie: 0, reduite: 0, meme: 0 };
  exos.forEach(ex => c[ex.type]++);
  assert(c.agrandie > 0 && c.reduite > 0 && c.meme > 0, JSON.stringify(c));
  const gs = exos.map(e => e.gamma);
  return `agrandies ${c.agrandie}, réduites ${c.reduite}, même taille ${c.meme} ; |γ| de ${Math.min(...gs).toFixed(2)} à ${Math.max(...gs).toFixed(2)}`;
});

test('Tirage — une graine donne toujours le même exercice', () => {
  const a = M.genererExercice(CFG, M.rngDepuisGraine(42)), b = M.genererExercice(CFG, M.rngDepuisGraine(42));
  assert(a.OA === b.OA && a.f === b.f && a.AB === b.AB, 'non reproductible');
});

test('Tirage — domaines modifiés par l\'enseignante (kMin 1,2 ; kMax 4) restent visibles', () => {
  const cfg2 = M.configurer({ kMin: 1.2, kMax: 4 }), r2 = M.rngDepuisGraine(7);
  for (let i = 0; i < 500; i++) { const ex = M.genererExercice(cfg2, r2); assert(M.verifierExercice(ex, cfg2).ok, 'tirage invalide'); }
  return '500 tirages';
});

test('Tirage — paramètres impossibles signalés clairement', () => {
  let msg = null;
  try { M.genererExercice(M.configurer({ focales: [9], kMin: 2.5, kMax: 3 }), M.rngDepuisGraine(1)); } catch (e) { msg = e.message; }
  assert(msg, 'aucune erreur levée');
  return msg;
});

test('T9 — les trois rayons émergents théoriques concourent en B\'', () => {
  let emax = 0;
  exos.forEach(ex => {
    const P12 = M.intersectionDroites(ex.I1, ex.Fp, ex.O, { x: 2 * ex.O.x - ex.B.x, y: 2 * ex.O.y - ex.B.y });
    const P13 = M.intersectionDroites(ex.I1, ex.Fp, ex.I3, { x: 1, y: ex.I3.y });
    emax = Math.max(emax, M.dist(P12, ex.Bp), M.dist(P13, ex.Bp));
    // le rayon incident 3 passe bien par F
    emax = Math.max(emax, M.distPointDroite(ex.F, ex.B, ex.I3));
  });
  assert(emax < 1e-9, 'écart ' + emax);
  return 'écart maximal ' + emax.toExponential(1) + ' carreau';
});

test('Construction idéale acceptée aux 8 étapes (tous les tirages)', () => {
  exos.forEach(ex => {
    const e = constructionIdeale(ex);
    for (let k = 1; k <= 8; k++) { const r = verif(k, ex, e); assert(r.ok, 'étape ' + k + ' refusée : ' + r.message); }
  });
});

test('Segments tracés à l\'envers (de la lentille vers B) acceptés et réorientés', () => {
  exos.slice(0, 300).forEach(ex => {
    const e = constructionIdeale(ex);
    [1, 2, 3, 4, 5, 6, 8].forEach(k => { const s = e.segs[k]; e.segs[k] = { p: s.q, q: s.p }; });
    for (let k = 1; k <= 8; k++) { const r = verif(k, ex, e); assert(r.ok, 'étape ' + k + ' : ' + r.message); }
    const r1 = verif(1, ex, e);
    assert(M.dist(r1.seg.p, ex.B) < 1e-9, 'non réorienté');
  });
});

test('Petites imprécisions (dans les tolérances) acceptées', () => {
  exos.forEach(ex => {
    const e = constructionIdeale(ex);
    e.segs[1].q = { x: 0.1, y: ex.I1.y + 0.05 };
    e.segs[2].p = { x: e.segs[1].q.x - 0.05, y: e.segs[1].q.y - 0.05 };
    e.segs[2].q = pointSur(e.segs[2].p, ex.Fp, G.xmax - 0.5);
    e.bp = { x: ex.Bp.x + 0.2, y: ex.Bp.y - 0.15 };
    e.segs[8] = { p: e.bp, q: { x: e.bp.x + 0.1, y: 0.1 } };
    for (let k = 1; k <= 8; k++) { const r = verif(k, ex, e); assert(r.ok, 'étape ' + k + ' : ' + r.message); }
  });
});

test('T6 — un rayon incident qui dépasse la lentille est refusé', () => {
  exos.forEach(ex => {
    [1, 3, 5].forEach(k => {
      const e = constructionIdeale(ex), s = e.segs[k];
      const d = { x: s.q.x - s.p.x, y: s.q.y - s.p.y }, t = 1 + 1 / Math.abs(d.x); // + 1 carreau au-delà
      e.segs[k] = { p: s.p, q: { x: s.p.x + d.x * t, y: s.p.y + d.y * t } };
      attendreRefus(k, ex, e, ['lentilleDepasse'], 'incident ' + k + ' trop long');
      e.segs[k] = { p: s.p, q: { x: -0.8, y: s.p.y + d.y * (1 - 0.8 / Math.abs(d.x)) } };
      attendreRefus(k, ex, e, ['lentilleCourt'], 'incident ' + k + ' trop court');
    });
  });
});

test('T8 — directions incorrectes refusées (rotation de 4° ; 3° pour l\'émergent)', () => {
  exos.forEach(ex => {
    let e = constructionIdeale(ex);
    e.segs[1] = { p: ex.B, q: pointSur(ex.B, rot(ex.B, ex.I1, 4), 0) };
    attendreRefus(1, ex, e, ['direction'], 'R1 incident incliné');
    e = constructionIdeale(ex);
    e.segs[3] = { p: ex.B, q: pointSur(ex.B, rot(ex.B, ex.O, 4), 0) };
    attendreRefus(3, ex, e, ['centre'], 'R2 incident ne passant pas par O');
    e = constructionIdeale(ex);
    e.segs[5] = { p: ex.B, q: pointSur(ex.B, rot(ex.B, ex.I3, 4), 0) };
    attendreRefus(5, ex, e, ['foyer', 'direction'], 'R3 incident ne passant pas par F');
    [2, 4, 6].forEach(k => {
      e = constructionIdeale(ex);
      const s = e.segs[k];
      e.segs[k] = { p: s.p, q: rot(s.p, s.q, 3) };
      attendreRefus(k, ex, e, ['foyer', 'direction', 'longueur'], 'émergent ' + k + ' tourné');
    });
    // erreur classique : rayon émergent 1 prolongé sans déviation (horizontal)
    e = constructionIdeale(ex);
    e.segs[2] = { p: ex.I1, q: { x: G.xmax - 0.5, y: ex.I1.y } };
    attendreRefus(2, ex, e, ['foyer'], 'R1 émergent non dévié');
    // erreur classique : rayon émergent 3 passant par F'
    e = constructionIdeale(ex);
    e.segs[6] = { p: ex.I3, q: pointSur(ex.I3, ex.Fp, G.xmax - 0.5) };
    attendreRefus(6, ex, e, ['direction'], 'R3 émergent par F\'');
  });
});

test('Point de départ, sens, longueur et continuité contrôlés', () => {
  exos.forEach(ex => {
    let e = constructionIdeale(ex);
    e.segs[1] = { p: { x: ex.B.x, y: ex.B.y + 0.8 }, q: { x: 0, y: ex.B.y + 0.8 } };
    attendreRefus(1, ex, e, ['depart'], 'départ loin de B');
    e = constructionIdeale(ex);
    e.segs[4] = { p: ex.O, q: { x: -3, y: 3 * ex.AB / ex.OA } };
    attendreRefus(4, ex, e, ['sens'], 'émergent vers la gauche');
    e = constructionIdeale(ex);
    e.segs[6] = { p: ex.I3, q: { x: ex.Bp.x - 1, y: ex.I3.y } };
    attendreRefus(6, ex, e, ['longueur'], 'émergent trop court');
    e = constructionIdeale(ex);
    const I = { x: 0, y: ex.I1.y - 0.7 };
    e.segs[2] = { p: I, q: pointSur(I, ex.Fp, G.xmax - 0.5) };
    attendreRefus(2, ex, e, ['continuite'], 'discontinuité incident/émergent');
  });
});

test('T5/T12 — modifier un rayon validé invalide les étapes dépendantes', () => {
  exos.forEach(ex => {
    const e = constructionIdeale(ex);
    e.segs[1] = { p: ex.B, q: { x: 0, y: ex.I1.y + 1 } }; // l'élève déplace le point d'incidence
    attendreRefus(1, ex, e, ['direction'], 'R1 modifié');
    attendreRefus(2, ex, e, ['continuite'], 'R1 émergent après modification de R1');
    const e2 = constructionIdeale(ex);
    e2.segs[5] = { p: ex.B, q: { x: 0, y: ex.I3.y - 1 } };
    attendreRefus(6, ex, e2, ['continuite'], 'R3 émergent après modification de R3');
  });
});

test('Le point d\'incidence réutilisé est celui tracé par l\'élève (pas le théorique)', () => {
  const ex = exos[0], e = constructionIdeale(ex);
  const I = { x: 0.08, y: ex.I1.y + 0.1 };          // incidence légèrement décalée mais acceptée
  e.segs[1].q = I;
  e.segs[2] = { p: I, q: pointSur(I, ex.Fp, G.xmax - 0.5) };
  assert(verif(2, ex, e).ok, 'émergent partant de l\'incidence élève refusé');
  const cibles = M.ciblesAccrochage(ex, e, CFG, {});
  assert(cibles.some(c => c.nom === 'I1' && M.dist(c, I) < 1e-12), 'incidence élève absente des cibles');
});

test('T10/T13 — position de B\' et image A\'B\'', () => {
  exos.forEach(ex => {
    let e = constructionIdeale(ex);
    const a = rng() * 2 * Math.PI;
    e.bp = { x: ex.Bp.x + 0.7 * Math.cos(a), y: ex.Bp.y + 0.7 * Math.sin(a) };
    attendreRefus(7, ex, e, ['surRayon', 'intersection'], 'B\' décalé de 0,7');
    e = constructionIdeale(ex);
    e.segs[8] = { p: ex.Bp, q: { x: ex.Bp.x, y: 0.5 } };
    attendreRefus(8, ex, e, ['axe'], 'A\' hors axe');
    e.segs[8] = { p: ex.Bp, q: { x: ex.Bp.x + 0.6, y: 0 } };
    attendreRefus(8, ex, e, ['verticale'], 'A\'B\' non vertical');
    e.segs[8] = { p: ex.Bp, q: { x: -ex.Bp.x, y: 0 } };
    attendreRefus(8, ex, e, ['cote'], 'A\' à gauche');
    e.segs[8] = { p: { x: ex.Bp.x, y: ex.Bp.y + 1 }, q: ex.Ap };
    attendreRefus(8, ex, e, ['departImage'], 'segment ne partant pas de B\'');
  });
});

test('B\' accepté sur l\'intersection des rayons de l\'élève (légèrement décalée mais valide)', () => {
  let n = 0;
  exos.forEach(ex => {
    const e = constructionIdeale(ex);
    e.segs[6] = { p: { x: 0, y: ex.I3.y + 0.12 }, q: { x: G.xmax - 0.5, y: ex.I3.y + 0.12 } };
    e.segs[5].q = e.segs[6].p;
    if (!verif(5, ex, e).ok || !verif(6, ex, e).ok) return;
    const C = M.intersectionEleve(ex, e);
    e.bp = { x: C.x, y: C.y };
    assert(verif(7, ex, e).ok, 'B\' sur l\'intersection élève refusé');
    n++;
  });
  return n + ' cas';
});

test('T3 — l\'accrochage capture un point remarquable dans la zone de capture', () => {
  const ex = exos[0], e = constructionIdeale(ex), r = 10 / 30; // 10 px à 30 px/carreau
  const cibles = M.ciblesAccrochage(ex, { segs: {}, bp: null }, CFG, {});
  ['B', 'O', 'F', "F'", 'A'].forEach(nom => {
    const c = cibles.find(x => x.nom === nom);
    const p = { x: c.x + r * 0.6, y: c.y - r * 0.5 };
    const s = M.accrocher(p, cibles, r, {});
    assert(s.cible && s.cible.nom === nom && s.p.x === c.x && s.p.y === c.y, 'pas de capture sur ' + nom);
  });
  void e;
});

test('T4 — hors des zones de capture, un point n\'est JAMAIS déplacé (direction libre)', () => {
  let n = 0;
  exos.slice(0, 500).forEach(ex => {
    const e = { segs: {}, bp: null };
    const cibles = M.ciblesAccrochage(ex, e, CFG, {}), r = 10 / 30;
    for (let i = 0; i < 40; i++) {
      const p = { x: G.xmin + rng() * (G.xmax - G.xmin), y: G.ymin + rng() * (G.ymax - G.ymin) };
      const proche = cibles.some(c => (c.type === 'point' && M.dist(c, p) <= r) || (c.type === 'verticale' && Math.abs(p.x - c.x) <= r));
      const s = M.accrocher(p, cibles, r, {});
      if (!proche) { assert(s.p.x === p.x && s.p.y === p.y && !s.cible, 'point déplacé hors zone'); n++; }
      else assert(M.dist(s.p, p) <= r + 1e-12, 'capture plus loin que le rayon');
    }
  });
  return n + ' positions libres vérifiées';
});

test('T4 — l\'accrochage à la lentille ne change que l\'abscisse', () => {
  const ex = exos[0], cibles = M.ciblesAccrochage(ex, { segs: {}, bp: null }, CFG, {});
  const p = { x: 0.2, y: 3.37 }, s = M.accrocher(p, cibles, 0.3, {});
  assert(s.p.x === 0 && s.p.y === 3.37, 'ordonnée modifiée');
});

test('T10 — aucune cible d\'accrochage ne révèle B\', A\' ou un point d\'incidence théorique', () => {
  exos.forEach(ex => {
    for (let etape = 1; etape <= 8; etape++) {
      const cibles = M.ciblesAccrochage(ex, { segs: {}, bp: null }, CFG, { axe: etape === 8 });
      cibles.filter(c => c.type === 'point').forEach(c => {
        [ex.Bp, ex.Ap, ex.I1, ex.I3].forEach(P => assert(M.dist(c, P) > 1e-6, 'cible ' + c.nom + ' = point solution'));
      });
    }
    // la croix B' : sans quadrillage, aucune attraction même tout près de la solution
    const p = { x: ex.Bp.x + 0.05, y: ex.Bp.y - 0.04 };
    const s = M.accrocher(p, [], 0.5, { grille: false });
    assert(s.p.x === p.x && s.p.y === p.y, 'croix attirée');
  });
});

test('Quadrillage : capture seulement très près d\'un nœud, désactivé par défaut', () => {
  assert(CFG.accrochageGrille === false, 'activé par défaut');
  const s1 = M.accrocher({ x: 2.08, y: 1.03 }, [], 0, { grille: true, pas: 0.5, rayonGrille: 0.15 });
  assert(s1.p.x === 2 && s1.p.y === 1, 'pas de capture près du nœud');
  const s2 = M.accrocher({ x: 2.2, y: 1.27 }, [], 0, { grille: true, pas: 0.5, rayonGrille: 0.15 });
  assert(s2.p.x === 2.2 && s2.p.y === 1.27, 'capture entre deux nœuds (imposerait une direction)');
  const s3 = M.accrocher({ x: 0.05, y: 1.03 }, [{ type: 'verticale', x: 0, ymin: -7, ymax: 7 }], 0.3, { grille: true, pas: 0.5, rayonGrille: 0.15 });
  assert(s3.p.x === 0 && s3.p.y === 1.03, 'la lentille doit être prioritaire sur le quadrillage');
});

test('T14 — tolérances : en carreaux, jamais sous l\'équivalent écran', () => {
  const grand = M.tolerancesEffectives(CFG, 60), petit = M.tolerancesEffectives(CFG, 15);
  assert(grand.position === CFG.tolerances.position, 'grand écran');
  assert(Math.abs(petit.position - 8 / 15) < 1e-12, 'petit écran');
  assert(grand.angleDeg === 2 && petit.angleDeg === 2, 'angle');
  return 'position : ' + grand.position + ' carreau (60 px/carreau), ' + petit.position.toFixed(2) + ' (15 px/carreau)';
});

log('\n' + nbOk + ' tests réussis, ' + nbKo + ' en échec.');
fs.writeFileSync(path.join(__dirname, 'resultats-tests.txt'), lignes.join('\n') + '\n', 'utf8');
process.exit(nbKo ? 1 : 0);
