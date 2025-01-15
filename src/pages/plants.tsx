import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";

import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useListAllPlantsV1PlantsGet } from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { useToast } from "../toast";

export default function PlantsPage() {
  const { data, isLoading, error } = useListAllPlantsV1PlantsGet({
    queryParams: { include_archived: false },
  });
  useAuthErrorRedirect(error);
  const toast = useToast();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <span className={title()}>Make&nbsp;</span>
          <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
          <br />
          <span className={title()}>
            websites regardless of your design experience.
          </span>
          <div className={subtitle({ class: "mt-4" })}>
            Beautiful, fast and modern React UI library.
          </div>
        </div>
        {error && <div>Error: {error.message}</div>}

        <div className="mt-8">
          <Snippet hideCopyButton hideSymbol variant="bordered">
            <span>
              Get started by editing{" "}
              <Code color="primary">pages/index.tsx</Code>
            </span>
          </Snippet>
        </div>
      </section>
    </DefaultLayout>
  );
}
