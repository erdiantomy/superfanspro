import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { AppDemo } from "./AppDemo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={540}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="app-demo"
      component={AppDemo}
      durationInFrames={470}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
