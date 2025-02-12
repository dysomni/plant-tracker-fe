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
} from "@nextui-org/react";
import { now, getLocalTimeZone, fromDate } from "@internationalized/date";
import {
  fetchFullCheckPlantV1PlantsPlantIdFullCheckPost,
  useGetPlantV1PlantsPlantIdGet,
} from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { useToast } from "../toast";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  IconDropletFilled,
  IconDropletX,
  IconMinus,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import { pluralize, removeTimeZoneBracketFromDatetime } from "../util";
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
  const [overrideTouched, setOverrideTouched] = useState(false);
  const [scheduleFromCurrentDate, setScheduleFromCurrentDate] = useState(false);
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
        "day"
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
      1 // minimum of 1 day
    );
    const daysUntilTwoFromWatering = Math.max(
      (10 - targetCheckWetness) / decayAverage,
      1 // minimum of 1 day
    );

    if (watered) {
      const nextCheckDate = relativeDate.add(
        daysUntilTwoFromWatering * 24,
        "hour"
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
            overrideDate.toString()
          ),
          wetness_scale: wetness,
          next_reminder_date: removeTimeZoneBracketFromDatetime(
            nextCheckDate.toString()
          ),
          watered: watered,
          bottom_watered: bottomWatered,
          notes,
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
                value={nextCheckDate}
                onChange={(date) => {
                  if (!date) return;
                  setNextCheckDate(date);
                  setNextCheckDateTouched(true);
                }}
                startContent={
                  nextCheckDateTouched ? undefined : <IconSparkles />
                }
                label="Next Check Date"
                description="Set the date for the next check."
                variant="bordered"
              />
              <div className="flex gap-2">
                <Button
                  className="w-full"
                  startContent={<IconMinus />}
                  variant="flat"
                  color="default"
                  onPress={() => {
                    setNextCheckDateTouched(true);
                    setNextCheckDate(
                      dayjsToDateValue(
                        dayjs(
                          nextCheckDate.toDate(getLocalTimeZone())
                        ).subtract(1, "day")
                      )
                    );
                  }}
                >
                  1 day
                </Button>
                <Button
                  className="w-full"
                  startContent={<IconPlus />}
                  variant="flat"
                  color="default"
                  onPress={() => {
                    setNextCheckDateTouched(true);
                    setNextCheckDate(
                      dayjsToDateValue(
                        dayjs(nextCheckDate.toDate(getLocalTimeZone())).add(
                          1,
                          "day"
                        )
                      )
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
              value={overrideDate}
              onChange={(date) => {
                setOverrideTouched(true);
                date && setOverrideDate(date);
              }}
              label="This Check Occurred On"
              description="Change this if you want to backfill a check or watering you did in the past."
              variant="bordered"
            />
            {overrideTouched && !nextCheckDateTouched ? (
              <RadioGroup
                label="Schedule next check relative to:"
                defaultValue="no"
                orientation="horizontal"
                value={scheduleFromCurrentDate ? "yes" : "no"}
                onValueChange={(value) =>
                  setScheduleFromCurrentDate(value === "yes")
                }
              >
                <div className="flex gap-6">
                  <Radio value="no" className="flex gap-2">
                    Override Date
                  </Radio>
                  <Radio value="yes" className="flex gap-2">
                    Current Date
                  </Radio>
                </div>
              </RadioGroup>
            ) : null}
          </div>
          <DrawerFooter>
            <Button onPress={onClose}>Cancel</Button>
            <Button color="success" onPress={handleSubmit}>
              Submit
            </Button>
          </DrawerFooter>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
