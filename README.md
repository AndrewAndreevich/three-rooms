# Three Rooms

Scroll to walk backwards through three rooms. In each room the camera starts at the window and backs away from it. Near the wall behind, the room dissolves from afar into a sphere round the camera that shrinks as you scroll, and the next room grows in at its own window inside a sphere, as on the TSSR site.

The rooms are Gaussian splats, drawn with [Spark](https://sparkjs.dev) 2.4.0 on three.js.

## Rooms and licences

| # | Room | Author | Licence |
|---|------|--------|---------|
| 1 | [Synthetic Apartment](https://superspl.at/scene/ab735a47) | argenzio | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |
| 2 | [Fort Vancouver Counting House](https://superspl.at/scene/fef9a717) | virtualworldtours | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| 3 | [Livingroom](https://superspl.at/scene/4d243600) | shehabmekky | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) |

The splats were converted from the published files without changes, other than these:
- the level-of-detail chunks were merged into one file;
- the Counting House uses its second level of detail (2.8M splats);
- a lighter copy of each room (about 1.5M splats) was made for phones.

This site is non-commercial.

## Files

- `assets/rooms/*.sog` holds the rooms: the full ones for computers and `*_mobile.sog` for phones.
- `assets/rooms/rooms.json` holds each room's title, credit and camera walk:
  - `start`: the pose at the window, with position, turn and tilt in degrees;
  - `end`: the point by the wall behind;
  - `fov`: the lens;
  - `flip`: turns the room upside down, as the superspl.at viewer does.

## Editing the walks

```bash
python tools/editor.py        # then open http://localhost:8780/?edit
```

The editor has these controls:
- drag to look around;
- W A S D to move, Q and E to go down and up, Shift to go faster;
- the wheel changes the lens.

"Set start" and "Set end" take the current pose, and "Play" walks the path. "Save" writes `rooms.json`.
