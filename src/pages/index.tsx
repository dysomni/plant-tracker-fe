import DefaultLayout from "@/layouts/default";
import { useGetOutstandingRemindersV1RemindersOutstandingGet } from "../generated/api/plantsComponents";
import { AuthContext, useAuthErrorRedirect } from "../auth";
import { useToast } from "../toast";
import { useContext, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "@nextui-org/button";
import { Image, Tooltip } from "@nextui-org/react";
import { ImagePreview } from "../components/image-preview";
dayjs.extend(relativeTime);

export default function IndexPage() {
  const authContext = useContext(AuthContext);
  const { data, isLoading, error } =
    useGetOutstandingRemindersV1RemindersOutstandingGet({});
  useAuthErrorRedirect(error);
  const toast = useToast();

  const [selectedImage, setSelectedImage] = useState<{
    src?: string;
    plantName?: string;
  }>({});

  const overdueReminders =
    data?.reminders.filter(
      (reminder) => reminder.reminder.reminder_date < new Date().toISOString()
    ) ?? [];
  const upcomingReminders =
    data?.reminders.filter(
      (reminder) => reminder.reminder.reminder_date >= new Date().toISOString()
    ) ?? [];

  const pluralize = (count: number, singular: string, plural: string) =>
    count === 1 ? singular : plural;

  return (
    <DefaultLayout>
      <ImagePreview
        src={selectedImage.src}
        plantName={selectedImage.plantName}
        onClose={() => setSelectedImage({})}
      />
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
              {overdueReminders.length} overdue&nbsp;
            </span>
            <span className="text-lg">
              {pluralize(overdueReminders.length, "reminder", "reminders")}{" "}
              and&nbsp;
            </span>
            <span className="text-xl text-emerald-700 dark:text-emerald-400 font-extrabold whitespace-nowrap">
              {upcomingReminders.length} upcoming&nbsp;
            </span>
            <span className="text-lg">
              {pluralize(upcomingReminders.length, "reminder", "reminders")}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full">
          {overdueReminders.map((reminder) => (
            <div
              key={reminder.reminder.id}
              className="flex gap-6 border-2 border-red-100 dark:border-red-800 p-4 rounded-lg items-center shadow-lg"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-left sm:items-center">
                <Tooltip
                  content={dayjs(reminder.reminder.reminder_date).format(
                    "MMMM D, YYYY h:mm A"
                  )}
                >
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-100">
                    {dayjs(reminder.reminder.reminder_date).fromNow()}
                  </h3>
                </Tooltip>
                <div className="flex flex-col gap-0">
                  <span className="text-md font-bold">
                    {reminder.plant_info.plant.name}
                  </span>
                  <span className="text-sm">
                    {reminder.plant_info.location.name}
                  </span>
                </div>
              </div>
              {reminder.plant_info.cover_photo_url ? (
                <Image
                  src={reminder.plant_info.cover_photo_url}
                  alt={reminder.plant_info.plant.name}
                  height={75}
                  className="rounded-full"
                  onClick={() =>
                    setSelectedImage({
                      src: reminder.plant_info.cover_photo_url!,
                      plantName: reminder.plant_info.plant.name,
                    })
                  }
                />
              ) : null}
              {(["sm", "md"] as const).map((size) => (
                <div
                  className={`gap-4 flex-col sm:flex-row grow justify-end ${size === "sm" ? "flex sm:hidden" : "hidden sm:flex"}`}
                >
                  {reminder.reminder.reminder_type === "check" ? (
                    <Button
                      size={size}
                      variant="flat"
                      color="primary"
                      className="font-bold"
                    >
                      Check Plant
                    </Button>
                  ) : null}
                  <Button
                    size={size}
                    variant="flat"
                    color="success"
                    className="font-bold"
                  >
                    View Plant
                  </Button>
                  <Button
                    size={size}
                    variant="flat"
                    color="danger"
                    className="font-bold"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ))}
          {upcomingReminders.map((reminder) => (
            <div
              key={reminder.reminder.id}
              className="flex gap-6 border-2 border-green-100 dark:border-green-800 p-4 rounded-lg items-center shadow-lg"
            >
              <h3 className="text-lg font-bold text-green-800 dark:text-green-100">
                {dayjs(reminder.reminder.reminder_date).fromNow()}
              </h3>
              <div className="flex flex-col gap-0">
                <span className="text-md font-bold">
                  {reminder.plant_info.plant.name}
                </span>
                <span className="text-sm">
                  {reminder.plant_info.location.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DefaultLayout>
  );
}
