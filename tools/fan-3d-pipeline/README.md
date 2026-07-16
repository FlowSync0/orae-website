# Pipeline STEP → GLB (ventilateurs du hero)

Convertit les fichiers CAD fournisseur (.stp) en GLB Draco pour `assets/models/fans/`.

1. Découpe par pièce (FreeCAD headless) :
   `/Applications/FreeCAD.app/Contents/Resources/bin/freecadcmd step_split.py <fichier.stp> ./split_<ref>`
2. Assemblage + matériaux + export GLB (Blender headless) :
   `/Applications/Blender.app/Contents/MacOS/Blender -b -P assemble_fan.py -- split_<ref> cfg_<ref>.json fan-<ref>.glb`

Les cfg_*.json classifient les pièces (blades / motor / rod / canopy / led) et
définissent les matériaux PBR (couleurs en RGB linéaire). Le nœud `blades` du
GLB est celui que `fan-3d.js` fait tourner.

Correspondance références fournisseur → produits :
- 2149 → classic-white · 2369 → classic-rounded-white
- 132L → natural-wood-light · 3372B → natural-brown-wood-light (pale foncée, design proche plafond)
