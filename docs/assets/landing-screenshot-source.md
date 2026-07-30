# Landing product image sources

## Current state

The redesigned landing page intentionally uses product-media placeholders. No concept UI is presented as product evidence.

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
