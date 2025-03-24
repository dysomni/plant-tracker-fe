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
  RadioGroup,
  Radio,
  addToast,
} from "@heroui/react";
import { now, getLocalTimeZone, fromDate } from "@internationalized/date";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  IconDropletFilled,
  IconDropletX,
  IconMinus,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { pluralize, removeTimeZoneBracketFromDatetime } from "../util";
import { useAuthErrorRedirect } from "../auth";
import {
  fetchFullCheckPlantV1PlantsPlantIdFullCheckPost,
  useGetPlantV1PlantsPlantIdGet,
} from "../generated/api/plantsComponents";

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
    now(getLocalTimeZone()).add({ days: 7 }),
  );
  const [nextCheckDateTouched, setNextCheckDateTouched] = useState(false);
  const nextCheckDayjs = dayjs(nextCheckDate.toDate(getLocalTimeZone()));
  const nextCheckDaysRounded = Math.round(
    nextCheckDayjs.diff(dayjs(), "day", true),
  );
  const [overrideDate, setOverrideDate] = useState<DateValue>(
    now(getLocalTimeZone()),
  );
  const [overrideTouched, setOverrideTouched] = useState(false);
  const [scheduleFromCurrentDate, setScheduleFromCurrentDate] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const {
    data: plant,
    isFetching: plantLoading,
    error: plantError,
  } = useGetPlantV1PlantsPlantIdGet({ pathParams: { plantId: plantToCheck } });

  useAuthErrorRedirect(plantError);

  const lastWatering = useMemo(
    () =>
      plant?.last_watering ? dayjs(plant.last_watering.watering_date) : null,
    [plant],
  );

  const typicalDryoutDays = useMemo(() => {
    if (!plant) return undefined;
    if (Number(plant.wetness_decay_per_day) === 0) {
      return undefined;
    }

    return 9 / Number(plant.wetness_decay_per_day);
  }, [plant]);

  useEffect(() => {
    if (nextCheckDateTouched) return;
    if (!plant) return;

    const relativeDate = scheduleFromCurrentDate
      ? dayjs()
      : dayjs(overrideDate.toDate(getLocalTimeZone()));

    if (watered && plant.plant.default_watering_interval_days) {
      const nextCheckDate = relativeDate.add(
        plant.plant.default_watering_interval_days,
        "day",
      );

      setNextCheckDate(dayjsToDateValue(nextCheckDate));

      return;
    }

    const decayPerDay = Number(plant.wetness_decay_per_day);

    if (decayPerDay === 0 || !lastWatering) {
      return;
    }

    const lastWateringDaysAgo = dayjs().diff(lastWatering, "hour") / 24;
    const decayFromLastWatering = (10 - wetness) / lastWateringDaysAgo;
    const decayAverage = (decayPerDay + decayFromLastWatering) / 2;
    const targetCheckWetness = 1.5;
    const daysUntilTwoFromNow = Math.max(
      (wetness - targetCheckWetness) / decayAverage,
      1, // minimum of 1 day
    );
    const daysUntilTwoFromWatering = Math.max(
      (10 - targetCheckWetness) / decayAverage,
      1, // minimum of 1 day
    );

    if (watered) {
      const nextCheckDate = relativeDate.add(
        daysUntilTwoFromWatering * 24,
        "hour",
      );

      setNextCheckDate(dayjsToDateValue(nextCheckDate));

      return;
    }

    const nextCheckDate = relativeDate.add(daysUntilTwoFromNow * 24, "hour");

    setNextCheckDate(dayjsToDateValue(nextCheckDate));
  }, [
    plant,
    lastWatering,
    wetness,
    watered,
    overrideDate,
    scheduleFromCurrentDate,
  ]);

  useEffect(() => {
    if (wateredTouched) return;

    setWatered(wetness <= 1);
  }, [wateredTouched, wetness]);

  const handleSubmit = async () => {
    if (!plant) return;

    setSubmitLoading(true);

    try {
      await fetchFullCheckPlantV1PlantsPlantIdFullCheckPost({
        pathParams: { plantId: plantToCheck },
        body: {
          check_date: removeTimeZoneBracketFromDatetime(
            overrideDate.toString(),
          ),
          wetness_scale: wetness,
          next_reminder_date: removeTimeZoneBracketFromDatetime(
            nextCheckDate.toString(),
          ),
          watered: watered,
          bottom_watered: bottomWatered,
          notes,
        },
      });
      addToast({
        title: "Saved",
        description: `Successfully checked plant! Next reminder is ${nextCheckDayjs.fromNow()}`,
        color: "success",
      });
      setSubmitLoading(false);
      await onCheckDone?.();
      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to save plant check info.",
        color: "danger",
      });
      setSubmitLoading(false);
    }
  };

  return (
    <Drawer
      isDismissable={false}
      isOpen={true}
      placement="right"
      size="2xl"
      onClose={onClose}
    >
      <DrawerContent>
        {submitLoading || plantLoading ? (
          <div className="flex absolute top-0 bottom-0 left-0 right-0 justify-center items-center bg-black z-50 opacity-30">
            <CircularProgress />
          </div>
        ) : null}
        <DrawerHeader>Check {plant?.plant.name}</DrawerHeader>
        <DrawerBody>
          <div className="flex flex-col gap-6 overflow-y-scroll h-full">
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
              defaultValue={0.6}
              endContent={<IconDropletFilled size={20} />}
              label="Wetness Measurement"
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
              maxValue={10}
              minValue={0}
              size="lg"
              startContent={<IconDropletX size={20} />}
              step={1}
              value={wetness}
              onChange={(num) => setWetness(num as number)}
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
                    startContent={<IconDropletFilled size={15} />}
                    variant="solid"
                  >
                    This plant&apos;s default watering interval is{" "}
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
              <div className="flex flex-row justify-between flex-wrap">
                <p className="font-bold text-lg">
                  Next Reminder in {nextCheckDaysRounded}{" "}
                  {pluralize(nextCheckDaysRounded, "day", "days")}
                </p>
                {typicalDryoutDays ? (
                  <p>Typical dryout: {Math.round(typicalDryoutDays)} days</p>
                ) : null}
              </div>

              <DatePicker
                isRequired
                showMonthAndYearPickers
                description="Set the date for the next check."
                label="Next Check Date"
                startContent={
                  nextCheckDateTouched ? undefined : <IconSparkles />
                }
                value={nextCheckDate}
                variant="bordered"
                onChange={(date) => {
                  if (!date) return;
                  setNextCheckDate(date);
                  setNextCheckDateTouched(true);
                }}
              />
              <div className="flex gap-2">
                <Button
                  className="w-full"
                  color="default"
                  startContent={<IconMinus />}
                  variant="flat"
                  onPress={() => {
                    setNextCheckDateTouched(true);
                    setNextCheckDate(
                      dayjsToDateValue(
                        dayjs(
                          nextCheckDate.toDate(getLocalTimeZone()),
                        ).subtract(1, "day"),
                      ),
                    );
                  }}
                >
                  1 day
                </Button>
                <Button
                  className="w-full"
                  color="default"
                  startContent={<IconPlus />}
                  variant="flat"
                  onPress={() => {
                    setNextCheckDateTouched(true);
                    setNextCheckDate(
                      dayjsToDateValue(
                        dayjs(nextCheckDate.toDate(getLocalTimeZone())).add(
                          1,
                          "day",
                        ),
                      ),
                    );
                  }}
                >
                  1 day
                </Button>
              </div>
            </div>
            <Textarea
              label="Notes"
              placeholder="Thoughts about the check or watering..."
              value={notes}
              onValueChange={setNotes}
            />
            <DatePicker
              showMonthAndYearPickers
              description="Change this if you want to backfill a check or watering you did in the past."
              label="This Check Occurred On"
              value={overrideDate}
              variant="bordered"
              onChange={(date) => {
                setOverrideTouched(true);
                date && setOverrideDate(date);
              }}
            />
            {overrideTouched && !nextCheckDateTouched ? (
              <RadioGroup
                defaultValue="no"
                label="Schedule next check relative to:"
                orientation="horizontal"
                value={scheduleFromCurrentDate ? "yes" : "no"}
                onValueChange={(value) =>
                  setScheduleFromCurrentDate(value === "yes")
                }
              >
                <div className="flex gap-6">
                  <Radio className="flex gap-2" value="no">
                    Override Date
                  </Radio>
                  <Radio className="flex gap-2" value="yes">
                    Current Date
                  </Radio>
                </div>
              </RadioGroup>
            ) : null}
          </div>
          <DrawerFooter>
            <Button size="lg" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" size="lg" onPress={handleSubmit}>
              Submit
            </Button>
          </DrawerFooter>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
