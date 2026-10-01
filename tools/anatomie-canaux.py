"""Canaux et chambre pulpaire reconstruits à partir des vraies racines.

Chaque dent (maillage réel Z-Anatomy / BodyParts3D) est découpée en tranches
perpendiculaires à son grand axe. Dans chaque tranche, chaque boucle fermée est
une section de racine (ou de couronne). Les canaux suivent le centre de chaque
racine jusqu'à l'apex ; une racine large et aplatie reçoit deux canaux. La
chambre pulpaire et la jonction émail-dentine sont des sections de la couronne
réduites vers leur centre. Sortie : dents.glb (dent, « | dentine », « | pulpe »).
"""
import bpy, bmesh, sys, re, math
from mathutils import Vector
FBX = '/tmp/za/Resources/Models/FBX/'
OUT = sys.argv[-1]

bpy.ops.wm.read_factory_settings(use_empty=True)
avant = set(bpy.data.objects)
bpy.ops.import_scene.fbx(filepath=FBX + 'SkeletalSystem100.fbx')
objs = [o for o in bpy.data.objects if o not in avant]
for o in objs:
    if o.type == 'MESH':
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
dents = [o for o in objs if o.type == 'MESH' and o.data.polygons and not re.search(r'\.(j|i|t|s|g)$', o.name)
         and any(s.material and 'Teeth' in s.material.name for s in o.material_slots)]
ctx = [o for o in objs if o.type == 'MESH' and o.name in ('Mandible', 'Maxilla.l', 'Maxilla.r')]
garde = set(dents + ctx)
for o in objs:
    if o not in garde: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = dents[0]
bpy.ops.object.make_single_user(object=True, obdata=True)
neg = [o for o in garde if o.matrix_world.determinant() < 0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in neg:
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free()

def mat(nom, col):
    m = bpy.data.materials.get(nom) or bpy.data.materials.new(nom)
    m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*col, 1)
    return m
M = {k: mat(k, c) for k, c in {'email': (0.97, 0.96, 0.92), 'racine': (0.9, 0.8, 0.55), 'dentine': (0.94, 0.85, 0.64),
     'pulpe': (0.85, 0.3, 0.35), 'os': (0.9, 0.86, 0.76)}.items()}

# ───── outils ─────
def axe_principal(pts):
    c = sum(pts, Vector()) / len(pts)
    C = [[0.0] * 3 for _ in range(3)]
    for p in pts:
        d = p - c
        for i in range(3):
            for j in range(3): C[i][j] += d[i] * d[j]
    v = Vector((0.3, 1.0, 0.2))
    for _ in range(40):
        w = Vector((sum(C[0][j] * v[j] for j in range(3)), sum(C[1][j] * v[j] for j in range(3)), sum(C[2][j] * v[j] for j in range(3))))
        v = w.normalized()
    return c, v

def sections(verts, tris, axe, s):
    """Boucles fermées de l'intersection du maillage avec le plan {p·axe = s}."""
    d = [v.dot(axe) - s for v in verts]
    pt = {}
    def point(i, j):
        k = (min(i, j), max(i, j))
        if k not in pt:
            t = d[i] / (d[i] - d[j]); pt[k] = verts[i].lerp(verts[j], t)
        return k
    adj = {}
    for a, b, c in tris:
        cr = [(i, j) for i, j in ((a, b), (b, c), (c, a)) if (d[i] > 0) != (d[j] > 0)]
        if len(cr) == 2:
            k1, k2 = point(*cr[0]), point(*cr[1])
            adj.setdefault(k1, []).append(k2); adj.setdefault(k2, []).append(k1)
    boucles, vus = [], set()
    for k0 in adj:
        if k0 in vus: continue
        L, prec, cur = [], None, k0
        while cur is not None and cur not in vus:
            vus.add(cur); L.append(pt[cur])
            nx = [n for n in adj[cur] if n != prec and n not in vus]
            prec, cur = cur, (nx[0] if nx else None)
        if len(L) >= 6: boucles.append(L)
    return boucles

def infos_boucle(L, axe):
    c = sum(L, Vector()) / len(L)
    u = (L[0] - c); u = (u - axe * u.dot(axe)).normalized(); w = axe.cross(u)
    aire = 0.0
    P2 = [((p - c).dot(u), (p - c).dot(w)) for p in L]
    for i in range(len(P2)):
        x1, y1 = P2[i]; x2, y2 = P2[(i + 1) % len(P2)]; aire += x1 * y2 - x2 * y1
    aire = abs(aire) / 2
    # grand axe de la section
    cxx = sum(x * x for x, y in P2); cyy = sum(y * y for x, y in P2); cxy = sum(x * y for x, y in P2)
    ang = 0.5 * math.atan2(2 * cxy, cxx - cyy)
    g = u * math.cos(ang) + w * math.sin(ang)
    proj = [(p - c).dot(g) for p in L]; proj2 = [(p - c).dot(axe.cross(g)) for p in L]
    return {'c': c, 'aire': aire, 'g': g, 'a': (max(proj) - min(proj)) / 2, 'b': (max(proj2) - min(proj2)) / 2, 'pts': L}

def anneau(L, c, n=36):
    """Boucle rééchantillonnée en n points, ordonnés par angle autour de c."""
    axe_l = (L[1] - L[0]).cross(L[2] - L[0])
    import functools
    ref = (L[0] - c).normalized()
    def angle(p):
        v = (p - c)
        return math.atan2(v.dot(NORM.cross(ref)), v.dot(ref))
    S = sorted(L, key=angle)
    # longueur
    P = S + [S[0]]
    lg = [0.0]
    for i in range(1, len(P)): lg.append(lg[-1] + (P[i] - P[i - 1]).length)
    tot = lg[-1] or 1
    out, j = [], 0
    for k in range(n):
        t = tot * k / n
        while j < len(P) - 2 and lg[j + 1] < t: j += 1
        f = (t - lg[j]) / ((lg[j + 1] - lg[j]) or 1)
        out.append(P[j].lerp(P[j + 1], f))
    return out

def loft(anneaux, fermer=True):
    """Maillage tubulaire à travers des anneaux de même taille."""
    bm = bmesh.new()
    R = [[bm.verts.new(p) for p in A] for A in anneaux]
    n = len(anneaux[0])
    for a, b in zip(R, R[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    if fermer:
        for A, inv in ((R[0], True), (R[-1], False)):
            c = bm.verts.new(sum((v.co for v in A), Vector()) / n)
            for i in range(n):
                f = (A[i], A[(i + 1) % n], c) if not inv else (A[(i + 1) % n], A[i], c)
                bm.faces.new(f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def cercle(c, axe, r1, r2, g, n=16):
    h = axe.cross(g)
    return [c + g * (math.cos(2 * math.pi * k / n) * r1) + h * (math.sin(2 * math.pi * k / n) * r2) for k in range(n)]

def objet(nom, bm, cle):
    me = bpy.data.meshes.new(nom); bm.to_mesh(me); bm.free()
    me.materials.append(M[cle])
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(nom, me); bpy.context.collection.objects.link(ob)
    return ob

def joindre(bms):
    bm = bmesh.new()
    for b in bms:
        me = bpy.data.meshes.new('t'); b.to_mesh(me); b.free(); bm.from_mesh(me); bpy.data.meshes.remove(me)
    return bm

sortie = []
for o in dents:
    me = o.data
    verts = [v.co.copy() for v in me.vertices]
    tris = []
    me.calc_loop_triangles()
    email = set()
    for t in me.loop_triangles:
        tris.append(tuple(t.vertices))
        sl = o.material_slots[t.material_index].material.name if o.material_slots[t.material_index].material else ''
        if 'roots' not in sl: email.update(t.vertices)
    c0, axe = axe_principal(verts)
    ce = sum((verts[i] for i in email), Vector()) / max(1, len(email))
    if (ce - c0).dot(axe) < 0: axe = -axe            # axe : de l'apex vers la couronne
    NORM = axe
    s_v = [v.dot(axe) for v in verts]
    s_min, s_max = min(s_v), max(s_v)
    s_jac = sorted(verts[i].dot(axe) for i in email)[int(len(email) * 0.03)]   # collet ≈ bas de l'émail
    H = s_max - s_min
    # tranches
    N = 70
    niveaux = [s_min + H * (0.012 + 0.976 * k / (N - 1)) for k in range(N)]
    T = [[infos_boucle(L, axe) for L in sections(verts, tris, axe, s)] for s in niveaux]
    # ── canaux : on remonte chaque racine depuis l'apex ──
    s_toit = s_jac + (s_max - s_jac) * 0.42          # toit de la chambre
    pistes = []                                       # [[(s, info), ...]]
    for k, (s, B) in enumerate(zip(niveaux, T)):
        if s > s_jac + (s_max - s_jac) * 0.05: break
        for b in B:
            best = None
            for P in pistes:
                ls, li = P[-1]
                if ls < s and (li['c'] - b['c']).length < max(li['a'], 0.0015) * 1.2 and (best is None or (P[-1][1]['c'] - b['c']).length < (best[-1][1]['c'] - b['c']).length):
                    best = P
            if best is not None and best[-1][0] < s: best.append((s, b))
            else: pistes.append([(s, b)])
    pistes = [P for P in pistes if len(P) >= 4]
    canaux = []
    for P in pistes:
        apex = P[0][1]['c'] - axe * (P[0][0] - s_min) * 0.0   # premier niveau
        largeur_fin = P[0][1]['a']
        # aplatie : deux canaux (racine mésiale des molaires inf., mésio-vestibulaire des molaires sup.)
        moy_a = sum(i['a'] for _, i in P[len(P) // 3: 2 * len(P) // 3 + 1]) / max(1, len(P[len(P) // 3: 2 * len(P) // 3 + 1]))
        moy_b = sum(i['b'] for _, i in P[len(P) // 3: 2 * len(P) // 3 + 1]) / max(1, len(P[len(P) // 3: 2 * len(P) // 3 + 1]))
        double = moy_a > 2.1 * moy_b and moy_a > 0.0028
        decal = [-0.3, 0.3] if double else [0.0]
        for dx in decal:
            A = []
            for k2, (s, i) in enumerate(P):
                f = k2 / max(1, len(P) - 1)
                r_base = math.sqrt(i['aire'] / math.pi)
                r = max(0.00012, min(0.0009, r_base * (0.16 + 0.12 * f)))
                c = i['c'] + i['g'] * (dx * i['a'])
                A.append(cercle(c, axe, r * (0.8 if double else 1.25), r, i['g']))
            # prolonger jusque dans la chambre
            hautP = P[-1][1]
            for s in (s_jac - (s_jac - P[-1][0]) * 0.3, s_jac + (s_toit - s_jac) * 0.25):
                cc = hautP['c'] + axe * (s - P[-1][0])
                A.append(cercle(cc + hautP['g'] * (dx * hautP['a'] * 0.5), axe, 0.0006, 0.0005, hautP['g']))
            canaux.append(loft(A))
    # ── chambre pulpaire : sections de la couronne réduites ──
    ch = []
    for s, B in zip(niveaux, T):
        if s < s_jac - (s_jac - s_min) * 0.06 or s > s_toit: continue
        if not B: continue
        b = max(B, key=lambda x: x['aire'])
        f = (s - s_jac) / max(1e-6, s_toit - s_jac)
        k = 0.42 if f < 0.55 else 0.42 * max(0.18, 1 - (f - 0.55) / 0.45)
        ch.append([b['c'] + (p - b['c']) * k for p in anneau(b['pts'], b['c'])])
    # ── jonction émail-dentine : couronne réduite de l'épaisseur d'émail ──
    jed = []
    e_max = 0.0013 if '6' else 0.001
    for s, B in zip(niveaux, T):
        if s < s_jac or not B: continue
        if s > s_max - 0.0012: break
        b = max(B, key=lambda x: x['aire'])
        f = min(1.0, (s - s_jac) / max(1e-6, (s_max - s_jac) * 0.35))
        e = 0.00025 + (0.0012 - 0.00025) * f
        R = anneau(b['pts'], b['c'])
        jed.append([b['c'] + (p - b['c']) * max(0.2, 1 - e / max((p - b['c']).length, 1e-6)) for p in R])
    for sl in o.material_slots:
        sl.material = M['racine'] if 'roots' in sl.material.name else M['email']
    sortie.append(o)
    if len(jed) >= 3: sortie.append(objet(o.name + ' | dentine', loft(jed), 'dentine'))
    pulpe = ([loft(ch)] if len(ch) >= 3 else []) + canaux
    if pulpe: sortie.append(objet(o.name + ' | pulpe', joindre(pulpe), 'pulpe'))
    print(o.name, 'racines suivies', len(pistes), 'canaux', len(canaux), flush=True)

for o in ctx:
    for s in o.material_slots: s.material = M['os']
    m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = 0.5
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='dec')
    sortie.append(o)
bpy.ops.object.select_all(action='DESELECT')
for o in sortie: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT + '/dents.glb', export_format='GLB', use_selection=True,
    export_texcoords=False, export_normals=True, export_yup=True, export_apply=True, export_animations=False)
print('EXPORT dents', len(sortie), flush=True)
