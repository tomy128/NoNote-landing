# Landing product image sources

## Current state

The redesigned landing page uses verified captures from the current NoNote MVP. No concept UI is presented as product evidence.

The previous `product-preview.jpg` was derived from an early interface concept and is banned from production HTML, CSS, JavaScript, structured data and social metadata.

## Required captures

Each locale needs four PNG source captures from the current NoNote MVP:

| File | Scene |
| --- | --- |
| `zh-workspace.png` / `en-workspace.png` | Complete four-pane Workspace |
| `zh-reader.png` / `en-reader.png` | Reader or Focus Reader |
| `zh-assistant.png` / `en-assistant.png` | Assistant answer with citations |
| `zh-output.png` / `en-output.png` | Save as Note or Task Center |

Place original files in `src/assets/product/source/`. Do not crop, compress, add shadows or redraw interface elements before adding them.

The source directory is intentionally ignored by Git and removed from every build. Only reviewed derivatives in `src/assets/product/derived/` are published.

## 2026-08-01 capture set

- Application commit: `f228478c07e3cd5bfb2bcbbe77de3d4057f5fe8f`
- Branch at capture review: `master-private`
- Operating system: macOS
- Source size: 2880 × 1750 PNG
- Locales: `zh-CN`, `en-US`
- Scenarios: full Workspace, Reader/Insights, Assistant with citations, Task Center history
- Privacy review: no keys or private conversations; Reader source paths are excluded from published crops
- Transformation: Workspace, Assistant and Task Center resized to 1600 × 973 WebP at quality 82; Reader cropped from the top to 2880 × 1380, then resized to 1600 × 766 WebP at quality 82

| Production file | Source file | Published use |
| --- | --- | --- |
| `derived/zh-workspace.webp` | `source/zh-workspace.png` | Chinese hero and workflow |
| `derived/zh-reader.webp` | `source/zh-reader.png` | Chinese Reader evidence |
| `derived/zh-assistant.webp` | `source/zh-assistant.png` | Chinese Assistant evidence |
| `derived/zh-output.webp` | `source/zh-output.png` | Chinese Task Center evidence |
| `derived/en-workspace.webp` | `source/en-workspace.png` | English hero and workflow |
| `derived/en-reader.webp` | `source/en-reader.png` | English Reader evidence |
| `derived/en-assistant.webp` | `source/en-assistant.png` | English Assistant evidence |
| `derived/en-output.webp` | `source/en-output.png` | English Task Center evidence |

## Record required for every production asset

- Production filename
- Original source filename
- Application commit or release tag
- Operating system
- UI locale
- Scenario and capture steps
- Crop, compression, masking or two-dimensional transform
- Privacy review result

## Privacy and authenticity

- Use a synthetic, publishable demo Workspace.
- Do not include real names, personal files, absolute paths, secrets or private conversations.
- Controls, layout, states and results must come from the running MVP.
- Cropping and format conversion are allowed; generating or redrawing product UI is not.
