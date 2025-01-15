import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";

import DefaultLayout from "@/layouts/default";
import {
  useGetOutstandingRemindersV1RemindersOutstandingGet,
  useListAllPlantsV1PlantsGet,
} from "../generated/api/plantsComponents";
import { AuthContext, useAuthErrorRedirect } from "../auth";
import { useToast } from "../toast";
import { useContext } from "react";

export default function IndexPage() {
  const authContext = useContext(AuthContext);
  const { data, isLoading, error } =
    useGetOutstandingRemindersV1RemindersOutstandingGet({});
  useAuthErrorRedirect(error);
  const toast = useToast();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-start justify-center gap-4 pb-8 md:pb-10 w-full">
        <div className="inline-block max-w-lg text-right justify-center">
          <span className="text-2xl">welcome&nbsp;</span>
          <span className="text-3xl text-lime-600 dark:text-green-500 font-bold">
            {authContext.user?.name}
          </span>
        </div>

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
