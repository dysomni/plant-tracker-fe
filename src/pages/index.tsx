import { useContext, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "@heroui/button";
import { Card, Divider, Image, Link, Tooltip } from "@heroui/react";
import {
  IconAlertSquareRounded,
  IconCalendarWeekFilled,
  IconClockHour7Filled,
  IconRuler2,
  IconDroplet,
} from "@tabler/icons-react";

import { useGetOutstandingRemindersV1RemindersOutstandingGet } from "../generated/api/plantsComponents";
import { AuthContext, useAuthErrorRedirect } from "../auth";
import { useImagePreview } from "../components/image-preview";
import { ReminderWithPlantInfo } from "../generated/api/plantsSchemas";
import { usePageLoading } from "../components/page-loading";
import { PlantWateringBadge, PlantWetnessBadge } from "../components/badges";
import { pluralize, unwrap } from "../util";
import { CheckPlantDrawer } from "../components/check-plant";
import { useMediaQueries } from "../components/responsive-hooks";

import DefaultLayout from "@/layouts/default";
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
          dayjs().subtract(1, "day").toISOString(),
      ) ?? [],
    [data],
  );

  const recentReminders = useMemo(
    () =>
      data?.reminders.filter(
        (reminder) =>
          reminder.reminder.reminder_date >=
            dayjs().subtract(1, "day").toISOString() &&
          reminder.reminder.reminder_date <
            dayjs().add(12, "hours").toISOString(),
      ) ?? [],
    [data],
  );

  const upcomingReminders = useMemo(
    () =>
      data?.reminders.filter(
        (reminder) =>
          reminder.reminder.reminder_date >=
          dayjs().add(12, "hours").toISOString(),
      ) ?? [],
    [data],
  );

  return (
    <DefaultLayout>
      <section className="flex flex-col items-start justify-center gap-4 pb-8 md:pb-10 w-full">
        <div className="flex gap-4 justify-between w-full flex-col sm:flex-row sm:items-center">
          <div className="inline-block max-w-lg text-right justify-center self-start">
            <span className="text-2xl">welcome&nbsp;</span>
            <span className="text-3xl text-primary-500 font-extrabold">
              {authContext.user?.name}
            </span>
          </div>
          <div className="inline-block max-w-96 sm:max-w-lg text-right self-end sm:self-auto">
            <span className="text-lg whitespace-nowrap">You have&nbsp;</span>
            <span className="text-xl text-primary-500 font-extrabold whitespace-nowrap">
              {overdueReminders.length + recentReminders.length}{" "}
              outstanding&nbsp;
            </span>
            <span className="text-lg">
              {pluralize(
                overdueReminders.length + recentReminders.length,
                "reminder",
                "reminders",
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          {overdueReminders.length ? <OverdueSectionStarter /> : null}
          {overdueReminders.map((reminder) => (
            <ReminderCard
              key={reminder.reminder.id}
              reload={() => refetch({})}
              reminder={reminder}
              type="overdue"
            />
          ))}
          {recentReminders.length ? <RecentSectionStarter /> : null}
          {recentReminders.map((reminder) => (
            <ReminderCard
              key={reminder.reminder.id}
              reload={() => refetch({})}
              reminder={reminder}
              type="recent"
            />
          ))}
          {!overdueReminders.length && !recentReminders.length ? (
            <Card className="h-10 flex items-center justify-center rounded-md shadow-md bg-primary-50 border-1 dark:border-0">
              <div className="text-center text-md italic font-bold">
                All caught up!
              </div>
            </Card>
          ) : null}
          {upcomingReminders.length ? <UpcomingSectionStarter /> : null}
          {upcomingReminders.map((reminder) => (
            <ReminderCard
              key={reminder.reminder.id}
              reload={() => refetch({})}
              reminder={reminder}
              type="upcoming"
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
  type,
}: {
  reminder: ReminderWithPlantInfo;
  reload: () => void;
  type: "overdue" | "recent" | "upcoming";
}) => {
  const imagePreview = useImagePreview();
  const reminderDate = dayjs(reminder.reminder.reminder_date);

  const [plantToCheck, setPlantToCheck] = useState<string | undefined>();
  const [quickWater, setQuickWater] = useState(false);

  const reminderBgColor = useMemo(() => {
    if (!reminder.plant_info.plant.important) {
      return "bg-foreground-100";
    }

    switch (true) {
      case type == "upcoming":
        return "bg-primary-50";
      case type == "recent":
        return "bg-secondary-50";
      default:
        return "bg-danger-50";
    }
  }, [type]);

  const reminderTimeTextColor = useMemo(() => {
    if (reminder.plant_info.plant.important) {
      return "text-primary-900";
    }

    switch (true) {
      case type == "upcoming":
        return "text-primary-800";
      case type == "recent":
        return "text-secondary-800";
      default:
        return "text-danger-800";
    }
  }, [type]);

  const mediaQueries = useMediaQueries();

  return (
    <Card
      className={`flex flex-col sm:flex-row gap-6 p-4 rounded-lg items-center shadow-lg border-1 dark:border-0 ${reminderBgColor}`}
    >
      {plantToCheck ? (
        <CheckPlantDrawer
          plantToCheck={plantToCheck}
          quickWater={quickWater}
          onCheckDone={async () => {
            await reload();
          }}
          onClose={() => {
            setPlantToCheck(undefined);
            setQuickWater(false);
          }}
        />
      ) : null}
      <div className="flex gap-6 items-center self-start w-full sm:3/4 md:w-2/5">
        {reminder.plant_info.cover_photo_thumbnail_url ? (
          <div
            className={`flex justify-center items-center shrink-0 w-[80px] h-[80px] rounded-lg overflow-hidden`}
          >
            <Image
              alt={reminder.plant_info.plant.name}
              className="hover:cursor-pointer object-cover"
              height={80}
              src={reminder.plant_info.cover_photo_thumbnail_url}
              width={80}
              onClick={() =>
                imagePreview.setPreview({
                  src: reminder.plant_info.cover_photo_url!,
                  plantName: reminder.plant_info.plant.name,
                  locationName: reminder.plant_info.location.name,
                })
              }
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-0 items-left">
          <Tooltip content={reminderDate.format("MMMM D, YYYY h:mm A")}>
            <h3 className={`text-md font-bold ${reminderTimeTextColor}`}>
              {reminderDate.fromNow()}
            </h3>
          </Tooltip>
          <div className="flex flex-col gap-0">
            <Link
              color="primary"
              href={`/plants/${reminder.plant_info.plant.id}`}
            >
              <span className="text-lg font-bold text-primary-700">
                {reminder.plant_info.plant.name}
              </span>
            </Link>
            <span className="text-sm">{reminder.plant_info.location.name}</span>
          </div>
        </div>
      </div>
      {mediaQueries.sm && !mediaQueries.md ? null : (
        <div className="flex flex-row sm:flex-col flex-wrap gap-1 grow items-center justify-center w-full sm:w-1/4 md:w-2/5">
          <PlantWetnessBadge
            lastCheck={reminder.plant_info.last_check}
            wetnessDecayPerDay={reminder.plant_info.wetness_decay_per_day}
          />
          <PlantWateringBadge lastWatered={reminder.plant_info.last_watering} />
        </div>
      )}
      <div className="gap-1 flex-row sm:flex-col flex flex-wrap justify-center w-full sm:w-1/4 md:w-1/5 sm:max-w-40">
        {reminder.reminder.reminder_type === "check" ? (
          <Button
            className="font-bold w-full"
            color="primary"
            size={mediaQueries.sm ? "sm" : "md"}
            startContent={<IconRuler2 size={20} />}
            variant="flat"
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
            className="font-bold w-full"
            color="primary"
            size={mediaQueries.sm ? "sm" : "md"}
            startContent={<IconClockHour7Filled size={20} />}
            variant="flat"
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
    <div className="flex flex-row gap-2 w-full items-center pt-2">
      {/* <Divider className="grow w-auto" /> */}
      <IconAlertSquareRounded className="text-danger-800" size={24} />
      <h2 className="text-lg font-bold text-danger-800">Overdue</h2>
      <Divider className="grow w-auto" />
    </div>
  );
};

const RecentSectionStarter = () => {
  return (
    <div className="flex flex-row gap-2 w-full items-center pt-2">
      {/* <Divider className="grow w-auto" /> */}
      <IconDroplet className="text-secondary-800" size={24} />
      <h2 className="text-lg font-bold text-secondary-800">Current</h2>
      <Divider className="grow w-auto" />
    </div>
  );
};

const UpcomingSectionStarter = () => {
  return (
    <div className="flex flex-row gap-2 w-full items-center pt-2">
      {/* <Divider className="grow w-auto" /> */}
      <IconCalendarWeekFilled className="text-primary-800" size={24} />
      <h2 className="text-lg font-bold text-primary-800">Upcoming</h2>
      <Divider className="grow w-auto" />
    </div>
  );
};
