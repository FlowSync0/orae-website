"""Blender headless: per-part STLs + config -> semantic, materialized GLB.

Usage: Blender -b -P assemble_fan.py -- <splitdir> <config.json> <out.glb>

Node layout in the GLB (Y-up):
  fanRoot
    blades   <- fan-3d.js rotates this node
    motor / rod / canopy / led
"""
import bpy
import json
import math
import os
import sys

argv = sys.argv[sys.argv.index("--") + 1:]
splitdir, configpath, outglb = argv

with open(configpath) as fh:
    config = json.load(fh)
with open(os.path.join(splitdir, "manifest.json")) as fh:
    manifest = json.load(fh)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# The rotation axis: average x/y center of the motor group parts (mm).
part_by_file = {p["file"]: p for p in manifest["parts"]}
motor_files = config["groups"].get("motor", [])
axis_parts = [part_by_file[f] for f in motor_files if f in part_by_file] or manifest["parts"]
cx = sum(p["center"][0] for p in axis_parts) / len(axis_parts)
cy = sum(p["center"][1] for p in axis_parts) / len(axis_parts)

MM = 0.001

def make_material(name, spec):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    color = spec.get("color", [0.8, 0.8, 0.8])
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = spec.get("roughness", 0.5)
    bsdf.inputs["Metallic"].default_value = spec.get("metallic", 0.0)
    emissive = spec.get("emissive")
    if emissive:
        bsdf.inputs["Emission Color"].default_value = (*emissive, 1.0)
        bsdf.inputs["Emission Strength"].default_value = spec.get("strength", 3.0)
    return mat

materials = {group: make_material(group, spec) for group, spec in config["materials"].items()}

# Group empties
root = bpy.data.objects.new("fanRoot", None)
scene.collection.objects.link(root)
group_nodes = {}
for group in config["groups"]:
    node = bpy.data.objects.new(group, None)
    scene.collection.objects.link(node)
    node.parent = root
    group_nodes[group] = node

drop = set(config.get("drop", []))

for group, files in config["groups"].items():
    for fname in files:
        if fname in drop or fname not in part_by_file:
            continue
        path = os.path.join(splitdir, fname)
        bpy.ops.wm.stl_import(filepath=path)
        obj = bpy.context.selected_objects[0]
        obj.name = f"{group}_{fname.replace('.stl','')}"
        # Recenter on the rotation axis and convert mm -> m.
        obj.data.transform(__import__("mathutils").Matrix.Translation((-cx, -cy, 0)))
        obj.scale = (MM, MM, MM)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        # Weld vertices so smooth shading works on tessellated STL data.
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.remove_doubles(threshold=0.00002)
        bpy.ops.object.mode_set(mode="OBJECT")
        try:
            bpy.ops.object.shade_auto_smooth(angle=math.radians(38))
        except Exception:
            try:
                bpy.ops.object.shade_smooth_by_angle(angle=math.radians(38))
            except Exception:
                bpy.ops.object.shade_smooth()
        obj.data.materials.clear()
        obj.data.materials.append(materials[group])
        obj.parent = group_nodes[group]

bpy.ops.export_scene.gltf(
    filepath=outglb,
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,
    export_apply=True,
)
print("EXPORTED", outglb)
