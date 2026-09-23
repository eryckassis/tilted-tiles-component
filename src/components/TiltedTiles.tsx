"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

export interface TiltedTilesProps {
  images?: string[];
  columns?: number;
  tilesPerColumn?: number;
  tileAspect?: number;
  rowGap?: number;
  columnGap?: number;
  borderRadius?: number;
  perspective?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
  planeWidth?: number;
  planeHeight?: number;
  stagger?: number;
  duration?: number;
  alternate?: boolean;
  fadeTop?: number;
  fadeBottom?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  pauseOnHover?: boolean;
  saturation?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
}

interface Tile {
  id: string;
  image: string;
}

interface TileColumnProps {
  tiles: Tile[];
  progress: MotionValue<number>;
  rising: boolean;
  lead: number;
  gap: number;
  aspect: number;
  radius: number;
  repeats: number;
}

function finite(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hash(value: number) {
  let result = value | 0;

  result = Math.imul(result ^ (result >>> 16), 0x45d9f3b);
  result = Math.imul(result ^ (result >>> 16), 0x45d9f3b);

  return (result ^ (result >>> 16)) >>> 0;
}

function greatestCommonDivisor(a: number, b: number) {
  let left = Math.abs(a);
  let right = Math.abs(b);

  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }

  return left;
}

function createColumnSequence(
  tiles: Tile[],
  tileCount: number,
  columnIndex: number,
) {
  const length = tiles.length;

  if (length === 0) {
    return [];
  }

  const start = hash(columnIndex + 17) % length;

  let step =
    length === 1 ? 1 : (hash(columnIndex * 2 + 101) % (length - 1)) + 1;

  while (length > 1 && greatestCommonDivisor(step, length) !== 1) {
    step = (step % length) + 1;
  }

  return Array.from({ length: tileCount }, (_, tileIndex) => {
    return tiles[(start + tileIndex * step) % length];
  });
}

function createMask(fadeTop: number, fadeBottom: number) {
  let top = clamp(fadeTop, 0, 100);
  let bottom = clamp(fadeBottom, 0, 100);

  if (top === 0 && bottom === 0) {
    return undefined;
  }

  if (top + bottom > 100) {
    const scale = 100 / (top + bottom);
    top *= scale;
    bottom *= scale;
  }

  const topStops = top > 0 ? `transparent 0%, black ${top}%` : "black 0%";

  const bottomStops =
    bottom > 0 ? `black ${100 - bottom}%, transparent 100%` : "black 100%";

  return `linear-gradient(to bottom, ${topStops}, ${bottomStops})`;
}

function createTiles(images?: string[]): Tile[] {
  const validImages =
    images?.map((image) => image.trim()).filter(Boolean) ?? [];

  return validImages.map((image, index) => ({
    id: `image-${index}-${image}`,
    image,
  }));
}

function TileColumn({
  tiles,
  progress,
  rising,
  lead,
  gap,
  aspect,
  radius,
  repeats,
}: TileColumnProps) {
  const travel = 100 / repeats;

  const y = useTransform(
    progress,
    [0, 1],
    rising ? ["0%", `${-travel}%`] : [`${-travel}%`, "0%"],
  );

  const repeatedTiles = useMemo(
    () =>
      Array.from({ length: repeats }, (_, repeatIndex) =>
        tiles.map((tile, tileIndex) => ({
          ...tile,
          key: `${repeatIndex}-${tileIndex}-${tile.id}`,
        })),
      ).flat(),
    [repeats, tiles],
  );

  return (
    <div
      className="tilted-tiles__column"
      style={{ paddingTop: `${lead}%` }}
    >
      <motion.div
        className="tilted-tiles__track"
        style={{
          y,
          rowGap: gap,
          willChange: "transform",
        }}
      >
        {repeatedTiles.map((tile) => (
          <div
            key={tile.key}
            className="tilted-tiles__tile"
            style={{
              aspectRatio: aspect,
              borderRadius: radius,
              backgroundImage: `url(${JSON.stringify(tile.image)})`,
              backfaceVisibility: "hidden",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

export function TiltedTiles({
  images,
  columns = 16,
  tilesPerColumn = 5,
  tileAspect = 1,
  rowGap = 8,
  columnGap = 8,
  borderRadius = 0,
  perspective = 1600,
  rotateX = 40,
  rotateY = 16,
  rotateZ = -20,
  offsetX = -40,
  offsetY = 0,
  offsetZ = 0,
  planeWidth = 280,
  planeHeight = 260,
  stagger = 20,
  duration = 25,
  alternate = true,
  fadeTop = 22,
  fadeBottom = 0,
  parallax = true,
  parallaxStrength = 8,
  pauseOnHover = false,
  saturation = 1,
  width = "100%",
  height = "100%",
  className = "",
}: TiltedTilesProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const planeRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const safeColumns = Math.max(1, Math.floor(finite(columns, 16)));
  const safeTileCount = Math.max(2, Math.floor(finite(tilesPerColumn, 5)));
  const safeAspect = Math.max(0.05, finite(tileAspect, 1));
  const safeRowGap = Math.max(0, finite(rowGap, 8));
  const safeColumnGap = Math.max(0, finite(columnGap, 8));
  const safeRadius = Math.max(0, finite(borderRadius, 0));
  const safePerspective = Math.max(1, finite(perspective, 1600));
  const safeRotateX = finite(rotateX, 40);
  const safeRotateY = finite(rotateY, 16);
  const safeRotateZ = finite(rotateZ, -20);
  const safeOffsetX = finite(offsetX, -40);
  const safeOffsetY = finite(offsetY, 0);
  const safeOffsetZ = finite(offsetZ, 0);
  const safePlaneWidth = Math.max(1, finite(planeWidth, 280));
  const safePlaneHeight = Math.max(1, finite(planeHeight, 260));
  const safeStagger = Math.max(0, finite(stagger, 20));
  const safeDuration = Math.max(0.5, finite(duration, 25));
  const safeSaturation = Math.max(0, finite(saturation, 1));
  const safeParallaxStrength = Math.max(0, finite(parallaxStrength, 8));

  const progress = useMotionValue(0);
  const pointerRotateX = useMotionValue(0);
  const pointerRotateY = useMotionValue(0);
  const baseRotateX = useMotionValue(safeRotateX);
  const baseRotateY = useMotionValue(safeRotateY);

  const smoothPointerX = useSpring(pointerRotateX, {
    stiffness: 70,
    damping: 18,
    mass: 0.6,
  });

  const smoothPointerY = useSpring(pointerRotateY, {
    stiffness: 70,
    damping: 18,
    mass: 0.6,
  });

  const animatedRotateX = useTransform(
    () => baseRotateX.get() + smoothPointerX.get(),
  );

  const animatedRotateY = useTransform(
    () => baseRotateY.get() + smoothPointerY.get(),
  );

  useEffect(() => {
    baseRotateX.set(safeRotateX);
  }, [baseRotateX, safeRotateX]);

  useEffect(() => {
    baseRotateY.set(safeRotateY);
  }, [baseRotateY, safeRotateY]);

  useEffect(() => {
    if (!pauseOnHover) {
      pausedRef.current = false;
    }
  }, [pauseOnHover]);

  useEffect(() => {
    if (!shouldReduceMotion) {
      return;
    }

    pointerRotateX.jump(0);
    pointerRotateY.jump(0);
  }, [pointerRotateX, pointerRotateY, shouldReduceMotion]);

  useAnimationFrame((_time, delta) => {
    if (pausedRef.current || shouldReduceMotion) {
      return;
    }

    const nextProgress = progress.get() + delta / 1000 / safeDuration;

    progress.set(nextProgress - Math.floor(nextProgress));
  });

  const sourceTiles = useMemo(() => createTiles(images), [images]);

  const columnSequences = useMemo(
    () =>
      Array.from({ length: safeColumns }, (_, columnIndex) =>
        createColumnSequence(sourceTiles, safeTileCount, columnIndex),
      ),
    [safeColumns, safeTileCount, sourceTiles],
  );

  const [measurements, setMeasurements] = useState({
    columnWidth: 1,
    planeHeight: 1,
  });

  useEffect(() => {
    const plane = planeRef.current;

    if (!plane) {
      return;
    }

    const measure = () => {
      const availableWidth =
        plane.clientWidth - safeColumnGap * (safeColumns - 1);

      const nextMeasurements = {
        columnWidth: Math.max(1, availableWidth / safeColumns),
        planeHeight: Math.max(1, plane.clientHeight),
      };

      setMeasurements((current) => {
        if (
          current.columnWidth === nextMeasurements.columnWidth &&
          current.planeHeight === nextMeasurements.planeHeight
        ) {
          return current;
        }

        return nextMeasurements;
      });
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(plane);

      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, [safeColumns, safeColumnGap]);

  const repeatCount = useMemo(() => {
    const tileHeight = measurements.columnWidth / safeAspect;
    const sequenceHeight = safeTileCount * (tileHeight + safeRowGap);

    if (sequenceHeight <= 0) {
      return 2;
    }

    return clamp(
      Math.ceil(measurements.planeHeight / sequenceHeight) + 2,
      2,
      12,
    );
  }, [measurements, safeAspect, safeRowGap, safeTileCount]);

  const mask = useMemo(
    () => createMask(finite(fadeTop, 22), finite(fadeBottom, 0)),
    [fadeBottom, fadeTop],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!parallax || shouldReduceMotion) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();

      if (bounds.width === 0 || bounds.height === 0) {
        return;
      }

      const normalizedX =
        ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;

      const normalizedY =
        ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

      pointerRotateY.set(normalizedX * safeParallaxStrength);
      pointerRotateX.set(-normalizedY * safeParallaxStrength);
    },
    [
      parallax,
      pointerRotateX,
      pointerRotateY,
      safeParallaxStrength,
      shouldReduceMotion,
    ],
  );

  const handlePointerEnter = useCallback(() => {
    if (pauseOnHover) {
      pausedRef.current = true;
    }
  }, [pauseOnHover]);

  const handlePointerLeave = useCallback(() => {
    pausedRef.current = false;

    if (shouldReduceMotion) {
      pointerRotateX.jump(0);
      pointerRotateY.jump(0);
      return;
    }

    pointerRotateX.set(0);
    pointerRotateY.set(0);
  }, [pointerRotateX, pointerRotateY, shouldReduceMotion]);

  const resolvedWidth =
    typeof width === "number" ? finite(width, 0) : width || "100%";

  const resolvedHeight =
    typeof height === "number" ? finite(height, 0) : height || "100%";

  return (
    <div
      aria-hidden="true"
      className={`tilted-tiles ${className}`.trim()}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        perspective: `${safePerspective}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
        filter:
          safeSaturation === 1 ? undefined : `saturate(${safeSaturation})`,
        contain: "layout paint",
      }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className="tilted-tiles__center"
        style={{
          width: `${safePlaneWidth}%`,
          height: `${safePlaneHeight}%`,
          transform: "translate(-50%, -50%)",
          transformStyle: "preserve-3d",
        }}
      >
        <motion.div
          ref={planeRef}
          className="tilted-tiles__plane"
          style={{
            gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
            columnGap: safeColumnGap,
            rotateX: animatedRotateX,
            rotateY: animatedRotateY,
            rotateZ: safeRotateZ,
            x: safeOffsetX,
            y: safeOffsetY,
            z: safeOffsetZ,
            transformOrigin: "50% 50%",
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {columnSequences.map((tiles, columnIndex) => (
            <TileColumn
              key={`${columnIndex}-${repeatCount}`}
              tiles={tiles}
              progress={progress}
              rising={!alternate || columnIndex % 2 === 0}
              lead={safeStagger * (columnIndex % 3)}
              gap={safeRowGap}
              aspect={safeAspect}
              radius={safeRadius}
              repeats={repeatCount}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default TiltedTiles;
