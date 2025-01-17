import DefaultLayout from "@/layouts/default";
import { useListAllPlantsV1PlantsGet } from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { usePageLoading } from "../components/page-loading";
import { BasicPlantInfoResponseModel } from "../generated/api/plantsSchemas";
import dayjs from "dayjs";
import { Button, Image, Input, Link } from "@nextui-org/react";
import { useImagePreview } from "../components/image-preview";
import {
  PlantLatestReminderBadge,
  PlantWateringBadge,
  PlantWetnessBadge,
} from "../components/badges";
import { useMemo, useState } from "react";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useMediaQueries } from "../components/responsive-hooks";
import { CreatePlantDrawer } from "../components/create-plant";

export default function PlantsPage() {
  const { data, isLoading, error, refetch } = useListAllPlantsV1PlantsGet({
    queryParams: { include_archived: false },
  });
  useAuthErrorRedirect(error);
  usePageLoading(isLoading);
  const [searchInput, setSearchInput] = useState("");
  const matchedPlants = useMemo(() => {
    if (!searchInput) return data?.plants;
    return data?.plants.filter(
      (plant) =>
        plant.plant.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        plant.location.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        plant.plant.scientific_name
          .toLowerCase()
          .includes(searchInput.toLowerCase())
    );
  }, [data, searchInput]);

  const mediaQueries = useMediaQueries();
  const [createPlantDrawerOpen, setCreatePlantDrawerOpen] = useState(false);

  return (
    <DefaultLayout>
      <CreatePlantDrawer
        open={createPlantDrawerOpen}
        setOpen={setCreatePlantDrawerOpen}
        onPlantCreated={async () => {
          await refetch();
        }}
      />
      <section className="flex flex-col items-center justify-center gap-4 pb-8 md:pb-10 w-full">
        <div className="flex flex-row justify-center gap-3 w-full">
          <Input
            size={mediaQueries["sm"] ? "md" : "sm"}
            value={searchInput}
            placeholder="Search for a plant"
            onValueChange={setSearchInput}
            startContent={<IconSearch size={15} />}
            className="max-w-40 sm:max-w-72"
            variant="bordered"
          />
          <Button
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconPlus size={15} />}
            color="success"
            onPress={() => setCreatePlantDrawerOpen(true)}
          >
            Register Plant
          </Button>
        </div>
        <div className="flex flex-col gap-4 w-full">
          {matchedPlants?.map((plant) => (
            <PlantCard key={plant.plant.id} plant={plant} />
          ))}
        </div>
        {matchedPlants?.length === 0 ? (
          <div className="text-lg font-bold text-center">No plants found.</div>
        ) : null}
      </section>
    </DefaultLayout>
  );
}

const PlantCard = ({ plant }: { plant: BasicPlantInfoResponseModel }) => {
  const imagePreview = useImagePreview();
  const latestReminder =
    plant.outstanding_reminders.length > 0
      ? dayjs(plant.outstanding_reminders[0].reminder_date)
      : null;

  return (
    <div className="flex flex-col sm:flex-row gap-6 border-2 p-4 rounded-lg items-center justify-center shadow-lg dark:black max-h-72">
      <div className="flex flex-row gap-6 items-center justify-center self-start sm:self-auto">
        {plant.cover_photo_url ? (
          <Image
            className="hover:cursor-pointer"
            src={plant.cover_photo_url ?? undefined}
            height={90}
            alt="Plant Cover Photo"
            onClick={() =>
              imagePreview.setPreview({
                src: plant.cover_photo_url ?? "",
                plantName: plant.plant.name,
                locationName: plant.location.name,
              })
            }
          />
        ) : null}
        <div>
          <Link href={`/plants/${plant.plant.id}`} color="success">
            <div className="font-bold text-2xl">{plant.plant.name}</div>
          </Link>
          <div>{plant.location.name}</div>
          <div className="italic font-thin text-sm">
            {plant.plant.scientific_name}
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap gap-1 grow items-center justify-center">
        <PlantLatestReminderBadge latestReminder={latestReminder} />
        <PlantWetnessBadge lastCheck={plant.last_check} />
        <PlantWateringBadge lastWatered={plant.last_watering} />
      </div>
    </div>
  );
};
