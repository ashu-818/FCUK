# FCUK

Scroll animation + e-commerce website with 240-frame animation.

## Setup

After cloning, extract the frame files. Create a `frames/` folder and extract all 3 zip files into it:

```powershell
# Create frames folder and extract all parts into it
New-Item -ItemType Directory -Path frames -Force
Expand-Archive -Path frames-part1.zip -DestinationPath frames -Force
Expand-Archive -Path frames-part2.zip -DestinationPath frames -Force
Expand-Archive -Path frames-part3.zip -DestinationPath frames -Force
```

You'll end up with:
```
frames/
├── part1/   (frames 001-080)
├── part2/   (frames 081-160)
└── part3/   (frames 161-240)
```
