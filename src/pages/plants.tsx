import DefaultLayout from "@/layouts/default";
import { useListAllPlantsV1PlantsGet } from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { usePageLoading } from "../components/page-loading";
import { BasicPlantInfoResponseModel } from "../generated/api/plantsSchemas";
import dayjs from "dayjs";
import { Button, Card, Image, Input, Link } from "@nextui-org/react";
import { useImagePreview } from "../components/image-preview";
import {
  PlantLatestReminderBadge,
  PlantWetnessBadge,
  ReminderlessPlantBadge,
} from "../components/badges";
import { useMemo, useState } from "react";
import { IconPlus, IconRuler2, IconSearch } from "@tabler/icons-react";
import { useMediaQueries } from "../components/responsive-hooks";
import { CreatePlantDrawer } from "../components/create-plant";
import { CheckPlantDrawer } from "../components/check-plant";
import { unwrap } from "../util";

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

  const noRemindersCount = useMemo(
    () =>
      data?.plants.filter((plant) => plant.outstanding_reminders.length === 0)
        .length ?? 0,
    [data]
  );

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
          <div>
            <Button
              size={mediaQueries["sm"] ? "md" : "sm"}
              startContent={<IconPlus size={15} />}
              color="success"
              onPress={() =>
                setTimeout(() => setCreatePlantDrawerOpen(true), 50)
              }
            >
              Register Plant
            </Button>
          </div>
        </div>
        {noRemindersCount ? (
          <ReminderlessPlantBadge count={noRemindersCount} />
        ) : null}
        <div className="flex flex-col gap-4 w-full">
          {matchedPlants?.map((plant) => (
            <PlantCard
              key={plant.plant.id}
              plant={plant}
              reload={async () => {
                refetch({});
              }}
            />
          ))}
        </div>
        {matchedPlants?.length === 0 ? (
          <div className="text-lg font-bold text-center">No plants found.</div>
        ) : null}
      </section>
    </DefaultLayout>
  );
}

const PlantCard = ({
  plant,
  reload,
}: {
  plant: BasicPlantInfoResponseModel;
  reload: () => Promise<void>;
}) => {
  const [checking, setChecking] = useState(false);
  const imagePreview = useImagePreview();
  const latestReminder =
    plant.outstanding_reminders.length > 0
      ? dayjs(plant.outstanding_reminders[0].reminder_date)
      : null;

  return (
    <Card className="flex flex-col sm:flex-row gap-6 sm:gap-0 p-4 rounded-lg items-center justify-center sm:justify-between shadow-lg max-h-72 border-1 dark:border-0">
      {checking ? (
        <CheckPlantDrawer
          plantToCheck={unwrap(plant.plant.id)}
          onClose={() => setChecking(false)}
          onCheckDone={reload}
        />
      ) : null}
      <div className="flex flex-row gap-6 items-center justify-center self-start sm:self-auto">
        {plant.cover_photo_thumbnail_url ? (
          <div className="flex justify-center items-center shrink-0 w-[90px] h-[90px] rounded-lg overflow-hidden">
            <Image
              className="hover:cursor-pointer object-cover"
              src={plant.cover_photo_thumbnail_url ?? undefined}
              width={90}
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
          </div>
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
      <div className="flex flex-col flex-wrap gap-1 grow items-center justify-center">
        <PlantLatestReminderBadge hasReminders={!!latestReminder} />
        <PlantWetnessBadge
          lastCheck={plant.last_check}
          wetnessDecayPerDay={plant.wetness_decay_per_day}
        />
        {/* <PlantWateringBadge lastWatered={plant.last_watering} /> */}
      </div>
      <div>
        <Button
          size="sm"
          variant="flat"
          color="primary"
          className="font-bold"
          startContent={<IconRuler2 size={20} />}
          onPress={() => setTimeout(() => setChecking(true), 50)}
        >
          Check
        </Button>
      </div>
    </Card>
  );
};
