import {
  generateSchemaTypes,
  generateReactQueryComponents,
} from "@openapi-codegen/typescript";
import { defineConfig } from "@openapi-codegen/cli";
export default defineConfig({
  plants: {
    from: {
      relativePath: "../plant_tracker/api_spec.json",
      source: "file",
    },
    outputDir: "src/generated/api",
    to: async (context) => {
      const filenamePrefix = "plants";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
