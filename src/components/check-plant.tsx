import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Slider,
  Checkbox,
  DatePicker,
  DateValue,
  Textarea,
  Button,
  CircularProgress,
  Chip,
} from "@nextui-org/react";
import { now, getLocalTimeZone, fromDate } from "@internationalized/date";
import {
  fetchCheckPlantV1PlantsPlantIdCheckPost,
  fetchCreateReminderV1RemindersPost,
  fetchDeleteReminderV1RemindersReminderIdDelete,
  fetchWaterPlantV1PlantsPlantIdWaterPost,
  useGetPlantV1PlantsPlantIdGet,
} from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { useToast } from "../toast";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { IconDropletFilled, IconDropletX } from "@tabler/icons-react";
import { pluralize, removeTimeZoneBracketFromDatetime, unwrap } from "../util";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const dayjsToDateValue = (date: dayjs.Dayjs): DateValue => {
  return fromDate(date.tz(getLocalTimeZone()).toDate(), getLocalTimeZone());
};

export const CheckPlantDrawer = (props: {
  plantToCheck: string;
  onClose: () => void;
  onCheckDone?: () => Promise<void>;
  quickWater?: boolean;
}) => {
  const { plantToCheck, onClose, onCheckDone, quickWater } = props;

  const [wetness, setWetness] = useState(quickWater ? 1 : 3);
  const [watered, setWatered] = useState(quickWater ? true : false);
  const [wateredTouched, setWateredTouched] = useState(false);
  const [bottomWatered, setBottomWatered] = useState(false);
  const [notes, setNotes] = useState("");
  const [nextCheckDate, setNextCheckDate] = useState<DateValue>(
    now(getLocalTimeZone()).add({ days: 7 })
  );
  const [nextCheckDateTouched, setNextCheckDateTouched] = useState(false);
  const nextCheckDayjs = dayjs(nextCheckDate.toDate(getLocalTimeZone()));
  const nextCheckDaysRounded = Math.round(
    nextCheckDayjs.diff(dayjs(), "day", true)
  );
  const [overrideDate, setOverrideDate] = useState<DateValue>(
    now(getLocalTimeZone())
  );
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    data: plant,
    isFetching: plantLoading,
    error: plantError,
  } = useGetPlantV1PlantsPlantIdGet({ pathParams: { plantId: plantToCheck } });
  useAuthErrorRedirect(plantError);
  const toast = useToast();

  const lastWatering = useMemo(
    () =>
      plant?.last_watering ? dayjs(plant.last_watering.watering_date) : null,
    [plant]
  );

  useEffect(() => {
    if (nextCheckDateTouched) return;
    if (!plant) return;
    if (!lastWatering) return;
    if (plant.waterings.length < 2) return;

    const orderedWaterings = [...plant.waterings].sort(
      (a, b) =>
        dayjs(b.watering_date).toDate().getTime() -
        dayjs(a.watering_date).toDate().getTime()
    );

    const previousWatering = orderedWaterings[0];
    const secondLastWatering = orderedWaterings[1];

    const hoursSinceLastWatering = dayjs().diff(lastWatering, "hour");
    const previousWateringPeriodHours = dayjs(
      previousWatering.watering_date
    ).diff(secondLastWatering.watering_date, "hour");

    if (watered) {
      if (plant.plant.default_watering_interval_days) {
        setNextCheckDate(
          dayjsToDateValue(
            lastWatering.add(plant.plant.default_watering_interval_days, "day")
          )
        );
        return;
      }
      setNextCheckDate(
        dayjsToDateValue(dayjs().add(hoursSinceLastWatering * 0.85, "hour"))
      );
      return;
    }

    const wetnessDropPerHour = (10 - 1) / previousWateringPeriodHours;
    const projectedHoursToNextWatering =
      Math.max(wetness - 1, 0) / wetnessDropPerHour;
    const nextCheckDate = dayjs().add(
      Math.round(projectedHoursToNextWatering),
      "hour"
    );

    setNextCheckDate(dayjsToDateValue(nextCheckDate));
  }, [plant, lastWatering, wetness, watered]);

  useEffect(() => {
    if (wateredTouched) return;

    setWatered(wetness <= 1);
  }, [wateredTouched, wetness]);

  const handleSubmit = async () => {
    if (!plant) return;

    setSubmitLoading(true);

    try {
      await fetchCheckPlantV1PlantsPlantIdCheckPost({
        pathParams: { plantId: plantToCheck },
        body: {
          check_date: removeTimeZoneBracketFromDatetime(
            overrideDate.toString()
          ),
          wetness_scale: wetness,
          notes: notes,
        },
      });
      if (watered) {
        await fetchWaterPlantV1PlantsPlantIdWaterPost({
          pathParams: { plantId: plantToCheck },
          body: {
            saturation_scale: 10,
            watering_date: removeTimeZoneBracketFromDatetime(
              overrideDate.add({ seconds: 1 }).toString()
            ),
            bottom_watered: bottomWatered,
            notes: notes,
          },
        });
        await fetchCheckPlantV1PlantsPlantIdCheckPost({
          pathParams: { plantId: plantToCheck },
          body: {
            check_date: removeTimeZoneBracketFromDatetime(
              overrideDate.add({ seconds: 1 }).toString()
            ),
            wetness_scale: 10,
            notes: notes,
          },
        });
      }
      const existingOustandingReminderIds = plant.outstanding_reminders
        .filter((reminder) => reminder.reminder_type === "check")
        .map((reminder) => unwrap(reminder.id));

      await Promise.all(
        existingOustandingReminderIds.map((reminderId) =>
          fetchDeleteReminderV1RemindersReminderIdDelete({
            pathParams: { reminderId },
          })
        )
      );
      await fetchCreateReminderV1RemindersPost({
        body: {
          plant_id: plantToCheck,
          reminder_date: nextCheckDayjs.toISOString(),
          reminder_type: "check",
          notes: "",
        },
      });
      toast({
        message: `Successfully checked plant! Next reminder is ${nextCheckDayjs.fromNow()}`,
        type: "success",
        duration: 5000,
      });
      setSubmitLoading(false);
      await onCheckDone?.();
      onClose();
    } catch (error) {
      toast({
        message: "Failed to save plant check info.",
        duration: 5000,
        type: "danger",
      });
      setSubmitLoading(false);
    }
  };

  return (
    <Drawer isOpen={true} onClose={onClose} placement="right" size="2xl">
      <DrawerContent>
        {submitLoading || plantLoading ? (
          <div className="flex absolute top-0 bottom-0 left-0 right-0 justify-center items-center bg-black z-50 opacity-30">
            <CircularProgress />
          </div>
        ) : null}
        <DrawerHeader>Check {plant?.plant.name}</DrawerHeader>
        <DrawerBody className="gap-6">
          <div className="flex flex-col gap-0 items-center">
            <h3 className={`text-md font-bold`}>
              {lastWatering
                ? `Last watered ${lastWatering.fromNow()}`
                : "Never watered"}
            </h3>
            {lastWatering ? (
              <p className="text-sm text-gray-500">
                {lastWatering?.format("MMMM D, YYYY h:mm A")}
              </p>
            ) : null}
          </div>
          <Slider
            aria-label="Wetness"
            label="Wetness Measurement"
            defaultValue={0.6}
            maxValue={10}
            minValue={0}
            size="lg"
            step={1}
            endContent={<IconDropletFilled size={20} />}
            startContent={<IconDropletX size={20} />}
            value={wetness}
            onChange={(num) => setWetness(num as number)}
            marks={[
              {
                value: 0,
                label: "Bone Dry",
              },
              {
                value: 5,
                label: "Damp",
              },
              {
                value: 10,
                label: "Watered",
              },
            ]}
          />
          <div
            className={`flex flex-col ${watered ? "gap-3" : "gap-0"}`}
            style={{ transition: "gap 0.2s ease-in-out" }}
          >
            <Checkbox
              isSelected={watered}
              onValueChange={(value) => {
                setWatered(value);
                setWateredTouched(true);
              }}
            >
              Will the plant be watered?
            </Checkbox>
            {plant?.plant.default_watering_interval_days ? (
              <div
                className={`${watered ? "h-7" : "h-0"} overflow-hidden`}
                style={{ transition: "height 0.2s ease-in-out" }}
              >
                <Chip
                  color="success"
                  variant="solid"
                  startContent={<IconDropletFilled size={15} />}
                >
                  This plant's default watering interval is{" "}
                  {plant?.plant.default_watering_interval_days} days
                </Chip>
              </div>
            ) : null}
            <div
              className={`${watered ? "h-6" : "h-0"} overflow-hidden`}
              style={{ transition: "height 0.2s ease-in-out" }}
            >
              <Checkbox
                isSelected={bottomWatered}
                onValueChange={setBottomWatered}
              >
                Bottom watered?
              </Checkbox>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-bold text-lg">
              Next Reminder in {nextCheckDaysRounded}{" "}
              {pluralize(nextCheckDaysRounded, "day", "days")}
            </p>
            <DatePicker
              isRequired
              showMonthAndYearPickers
              value={nextCheckDate}
              onChange={(date) => {
                if (!date) return;
                setNextCheckDate(date);
                setNextCheckDateTouched(true);
              }}
              label="Next Check Date"
              description="Set the date for the next check."
              variant="bordered"
            />
          </div>
          <Textarea
            label="Notes"
            placeholder="Thoughts about the check or watering..."
            value={notes}
            onValueChange={setNotes}
          />

          <DatePicker
            showMonthAndYearPickers
            value={overrideDate}
            onChange={(date) => date && setOverrideDate(date)}
            label="This Check Occurred On"
            description="Change this if you want to backfill a check or watering you did in the past."
            variant="bordered"
          />
        </DrawerBody>
        <DrawerFooter>
          <Button onPress={onClose}>Cancel</Button>
          <Button color="success" onPress={handleSubmit}>
            Submit
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
