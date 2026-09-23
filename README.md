# @baguc/tilted-tiles

Animated 3D image tiles for React, powered by Motion and CSS transforms.

## Install

```bash
pnpm add @eryckeyshow/tilted-tiles motion
```

React 18.2 or newer is required.

## Usage

```tsx
import { TiltedTiles } from "@baguc/tilted-tiles";
import "@baguc/tilted-tiles/style.css";

const images = [
  "/images/image-01.jpg",
  "/images/image-02.jpg",
  "/images/image-03.jpg",
];

export function Gallery() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <TiltedTiles images={images} />
    </div>
  );
}
```

The component does not bundle images. Pass URLs, imported assets, or CDN URLs through the `images` prop.

## Main props

| Prop             | Type               | Default  |
| ---------------- | ------------------ | -------- |
| `images`         | `string[]`         | `[]`     |
| `columns`        | `number`           | `16`     |
| `tilesPerColumn` | `number`           | `5`      |
| `duration`       | `number`           | `25`     |
| `alternate`      | `boolean`          | `true`   |
| `parallax`       | `boolean`          | `true`   |
| `pauseOnHover`   | `boolean`          | `false`  |
| `width`          | `number \| string` | `"100%"` |
| `height`         | `number \| string` | `"100%"` |

All component props are exported through the `TiltedTilesProps` type.

## Development

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm publish:check
```

## License

MIT
