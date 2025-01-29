import DefaultLayout from "@/layouts/default";
import { useListAllPlantsV1PlantsGet } from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { useToast } from "../toast";

export default function LocationsPage() {
  const { error } = useListAllPlantsV1PlantsGet({
    queryParams: { include_archived: false },
  });
  useAuthErrorRedirect(error);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10"></section>
    </DefaultLayout>
  );
}
