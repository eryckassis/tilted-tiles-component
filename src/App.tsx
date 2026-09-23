import TiltedTiles from "./components/TiltedTiles";
import "./components/TiltedTiles.css";
import { tiltedTilesImages } from "./data/tiltedTilesImages";

function App() {
  return (
    <main className="relative h-svh min-h-160 w-full overflow-hidden bg-zinc-950">
      <TiltedTiles
        images={tiltedTilesImages}
        columns={14}
        tilesPerColumn={5}
        duration={25}
        rotateX={40}
        rotateY={16}
        rotateZ={-20}
        perspective={1600}
        planeWidth={280}
        planeHeight={260}
        stagger={20}
        rowGap={8}
        columnGap={8}
        borderRadius={8}
        fadeTop={22}
        fadeBottom={8}
        parallax
        alternate
      />
    </main>
  );
}

export default App;
