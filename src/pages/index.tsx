import DefaultLayout from "@/layouts/default";
import {
  fetchDeleteReminderV1RemindersReminderIdDelete,
  useGetOutstandingRemindersV1RemindersOutstandingGet,
} from "../generated/api/plantsComponents";
import { AuthContext, useAuthErrorRedirect } from "../auth";
import { useContext, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "@nextui-org/button";
import { Card, Divider, Image, Link, Tooltip } from "@nextui-org/react";
import { useImagePreview } from "../components/image-preview";
import { ReminderWithPlantInfo } from "../generated/api/plantsSchemas";
import { usePageLoading } from "../components/page-loading";
import { PlantWateringBadge, PlantWetnessBadge } from "../components/badges";
import {
  IconClockHour7Filled,
  IconRuler2,
  IconTrash,
} from "@tabler/icons-react";
import { pluralize, unwrap } from "../util";
import { useToast } from "../toast";
import { CheckPlantDrawer } from "../components/check-plant";
dayjs.extend(relativeTime);

export default function IndexPage() {
  const authContext = useContext(AuthContext);
  const { data, isFetching, error, refetch } =
    useGetOutstandingRemindersV1RemindersOutstandingGet({});
  useAuthErrorRedirect(error);
  usePageLoading(isFetching);

  const overdueReminders = useMemo(
    () =>
      data?.reminders.filter(
        (reminder) =>
          reminder.reminder.reminder_date <
          dayjs().subtract(1, "day").toISOString()
      ) ?? [],
    [data]
  );

  const recentReminders = useMemo(
    () =>
      data?.reminders.filter(
        (reminder) =>
          reminder.reminder.reminder_date >=
            dayjs().subtract(1, "day").toISOString() &&
          reminder.reminder.reminder_date <
            dayjs().add(12, "hours").toISOString()
      ) ?? [],
    [data]
  );

  const upcomingReminders = useMemo(
    () =>
      data?.reminders.filter(
        (reminder) =>
          reminder.reminder.reminder_date >=
          dayjs().add(12, "hours").toISOString()
      ) ?? [],
    [data]
  );

  return (
    <DefaultLayout>
      <section className="flex flex-col items-start justify-center gap-4 pb-8 md:pb-10 w-full">
        <div className="flex gap-4 justify-between w-full flex-col sm:flex-row sm:items-center">
          <div className="inline-block max-w-lg text-right justify-center self-start">
            <span className="text-2xl">welcome&nbsp;</span>
            <span className="text-3xl text-lime-600 dark:text-green-500 font-extrabold">
              {authContext.user?.name}
            </span>
          </div>
          <div className="inline-block max-w-96 sm:max-w-lg text-right self-end sm:self-auto">
            <span className="text-lg whitespace-nowrap">You have&nbsp;</span>
            <span className="text-xl text-amber-800 dark:text-amber-400 font-extrabold whitespace-nowrap">
              {overdueReminders.length + recentReminders.length}{" "}
              outstanding&nbsp;
            </span>
            <span className="text-lg">
              {pluralize(
                overdueReminders.length + recentReminders.length,
                "reminder",
                "reminders"
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          {overdueReminders.length ? <OverdueSectionStarter /> : null}
          {overdueReminders.map((reminder) => (
            <ReminderCard
              reminder={reminder}
              key={reminder.reminder.id}
              reload={() => refetch({})}
            />
          ))}
          {recentReminders.length ? <RecentSectionStarter /> : null}
          {recentReminders.map((reminder) => (
            <ReminderCard
              reminder={reminder}
              key={reminder.reminder.id}
              reload={() => refetch({})}
            />
          ))}
          {!overdueReminders.length && !recentReminders.length ? (
            <Card className="h-10 flex items-center justify-center rounded-md shadow-md bg-success-50 border-1 dark:border-0">
              <div className="text-center text-md italic font-bold">
                All caught up!
              </div>
            </Card>
          ) : null}
          {upcomingReminders.length ? <UpcomingSectionStarter /> : null}
          {upcomingReminders.map((reminder) => (
            <ReminderCard
              reminder={reminder}
              key={reminder.reminder.id}
              reload={() => refetch({})}
            />
          ))}
        </div>
      </section>
    </DefaultLayout>
  );
}

const ReminderCard = ({
  reminder,
  reload,
}: {
  reminder: ReminderWithPlantInfo;
  reload: () => void;
}) => {
  const imagePreview = useImagePreview();
  const reminderDate = dayjs(reminder.reminder.reminder_date);
  const toast = useToast();

  const [plantToCheck, setPlantToCheck] = useState<string | undefined>();
  const [quickWater, setQuickWater] = useState(false);

  const reminderTextColor = useMemo(() => {
    const now = dayjs();
    const diffInMinutes = now.diff(reminderDate, "minute");

    switch (true) {
      case diffInMinutes <= 15:
        return "text-success-600";
      case diffInMinutes <= 60:
        return "text-warning-500";
      case diffInMinutes <= 1440:
        return "text-warning-700";
      case diffInMinutes <= 2880:
        return "text-danger-500";
      default:
        return "text-danger-500";
    }
  }, [reminderDate]);

  const reminderBorderColor = useMemo(() => {
    const now = dayjs();
    const diffInMinutes = now.diff(reminderDate, "minute");

    switch (true) {
      case diffInMinutes <= 15:
        return "border-green-600 dark:border-green-400";
      case diffInMinutes <= 60:
        return "border-yellow-600 dark:border-yellow-400";
      case diffInMinutes <= 1440:
        return "border-orange-600 dark:border-orange-400";
      case diffInMinutes <= 2880:
        return "border-red-600 dark:border-red-200";
      default:
        return "border-red-800 dark:border-red-400";
    }
  }, [reminderDate]);

  return (
    <Card className="flex flex-col sm:flex-row gap-6 p-4 rounded-lg items-center shadow-lg border-1 dark:border-0">
      {plantToCheck ? (
        <CheckPlantDrawer
          plantToCheck={plantToCheck}
          onClose={() => {
            setPlantToCheck(undefined);
            setQuickWater(false);
          }}
          onCheckDone={async () => {
            await reload();
          }}
          quickWater={quickWater}
        />
      ) : null}
      <div className="flex gap-6 items-center self-start">
        {reminder.plant_info.cover_photo_url ? (
          <Image
            src={reminder.plant_info.cover_photo_url}
            alt={reminder.plant_info.plant.name}
            height={80}
            className="rounded-large hover:cursor-pointer"
            onClick={() =>
              imagePreview.setPreview({
                src: reminder.plant_info.cover_photo_url!,
                plantName: reminder.plant_info.plant.name,
                locationName: reminder.plant_info.location.name,
              })
            }
          />
        ) : null}
        <div className="flex flex-col gap-1 items-left">
          <Tooltip content={reminderDate.format("MMMM D, YYYY h:mm A")}>
            <h3 className={`text-lg font-bold ${reminderTextColor}`}>
              {reminderDate.fromNow()}
            </h3>
          </Tooltip>
          <div className="flex flex-col gap-0">
            <Link
              href={`/plants/${reminder.plant_info.plant.id}`}
              color="primary"
            >
              <span className="text-md font-bold">
                {reminder.plant_info.plant.name}
              </span>
            </Link>
            <span className="text-sm">{reminder.plant_info.location.name}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap gap-1 grow items-center justify-center">
        <PlantWetnessBadge lastCheck={reminder.plant_info.last_check} />
        <PlantWateringBadge lastWatered={reminder.plant_info.last_watering} />
      </div>
      <div className="gap-1 flex-row sm:flex-col flex flex-wrap justify-center">
        {reminder.reminder.reminder_type === "check" ? (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            className="font-bold"
            startContent={<IconRuler2 size={20} />}
            onPress={() => {
              setTimeout(() => {
                setPlantToCheck(unwrap(reminder.plant_info.plant.id));
              }, 50);
            }}
          >
            Check
          </Button>
        ) : null}
        {reminder.reminder.reminder_type === "check" &&
        reminder.plant_info.plant.default_watering_interval_days ? (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            className="font-bold"
            startContent={<IconClockHour7Filled size={20} />}
            onPress={() => {
              setQuickWater(true);
              setTimeout(() => {
                setPlantToCheck(unwrap(reminder.plant_info.plant.id));
              }, 50);
            }}
          >
            Quick Water
          </Button>
        ) : null}
      </div>
    </Card>
  );
};

const OverdueSectionStarter = () => {
  return (
    <div className="flex flex-row gap-4 w-full items-center pt-2">
      <Divider className="grow w-auto" />
      <h2 className="text-sm font-bold">Overdue</h2>
      <Divider className="grow w-auto" />
    </div>
  );
};

const RecentSectionStarter = () => {
  return (
    <div className="flex flex-row gap-4 w-full items-center pt-2">
      <Divider className="grow w-auto" />
      <h2 className="text-sm font-bold">Recent</h2>
      <Divider className="grow w-auto" />
    </div>
  );
};

const UpcomingSectionStarter = () => {
  return (
    <div className="flex flex-row gap-4 w-full items-center pt-2">
      <Divider className="grow w-auto" />
      <h2 className="text-sm font-bold">Upcoming</h2>
      <Divider className="grow w-auto" />
    </div>
  );
};
