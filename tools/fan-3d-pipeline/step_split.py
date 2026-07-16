"""FreeCAD headless: STEP -> per-solid STL + manifest JSON.

Usage: freecadcmd step_split.py <input.stp> <outdir>
Drops degenerate/garbage geometry (huge or empty bboxes).
"""
import sys
import os
import json

import Part
import MeshPart

src = sys.argv[-2]
outdir = sys.argv[-1]
os.makedirs(outdir, exist_ok=True)

shape = Part.Shape()
shape.read(src)

candidates = shape.Solids
if not candidates:
    candidates = shape.Shells

parts = []
for i, solid in enumerate(candidates):
    bb = solid.BoundBox
    if max(bb.XLength, bb.YLength, bb.ZLength) > 5000:
        print(f"skip part {i}: degenerate bbox")
        continue
    if max(bb.XLength, bb.YLength, bb.ZLength) < 1:
        continue
    try:
        volume = solid.Volume
        com = solid.CenterOfMass
        center = [com.x, com.y, com.z]
    except Exception:
        volume = 0.0
        center = [(bb.XMin + bb.XMax) / 2, (bb.YMin + bb.YMax) / 2, (bb.ZMin + bb.ZMax) / 2]
    try:
        mesh = MeshPart.meshFromShape(Shape=solid, LinearDeflection=0.5, AngularDeflection=0.5, Relative=False)
    except Exception as exc:
        print(f"skip part {i}: mesh failed {exc}")
        continue
    fn = os.path.join(outdir, f"part_{i:02d}.stl")
    mesh.write(fn)
    parts.append({
        "index": i,
        "file": os.path.basename(fn),
        "facets": mesh.CountFacets,
        "volume_mm3": volume,
        "center": center,
        "bbox": {
            "x": [bb.XMin, bb.XMax],
            "y": [bb.YMin, bb.YMax],
            "z": [bb.ZMin, bb.ZMax],
        },
    })

with open(os.path.join(outdir, "manifest.json"), "w") as fh:
    json.dump({"source": os.path.basename(src), "parts": parts}, fh, indent=1)

print(f"OK {len(parts)} parts -> {outdir}")
