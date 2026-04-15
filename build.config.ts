import { defineBuildConfig } from "@bunit/build/config";

export default defineBuildConfig({
  entries: [
    {
      entrypoints: ["./src/index.ts"],
      packages: "bundle",
      external: [],
    },
  ],
});
