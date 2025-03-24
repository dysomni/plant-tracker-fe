import {
  addToast,
  Button,
  Checkbox,
  CircularProgress,
  DatePicker,
  DateValue,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Form,
  Slider,
  Textarea,
} from "@heroui/react";
import { FormEvent, useState } from "react";
import { z } from "zod";
import { IconDropletFilled, IconDropletX } from "@tabler/icons-react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import dayjs from "dayjs";

import { fetchWaterPlantV1PlantsPlantIdWaterPost } from "../generated/api/plantsComponents";

const strToDateValue = (date: string): DateValue => {
  return fromDate(
    dayjs(date).tz(getLocalTimeZone()).toDate(),
    getLocalTimeZone(),
  );
};

const dateValueToStr = (date: DateValue): string => {
  return dayjs(date.toDate(getLocalTimeZone())).toISOString();
};

export const createWateringSchema = z.object({
  watering_date: z.string().min(1),
  saturation_scale: z.number().min(0).max(10),
  notes: z.string(),
  bottom_watered: z.boolean(),
});

export const CreateWateringDrawer = (props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onWateringCreated?: () => Promise<void>;
  plantId: string;
}) => {
  const { open, setOpen, onWateringCreated, plantId } = props;

  const [validationErrors, setValidationErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formState, setFormState] = useState<{
    watering_date: string;
    saturation_scale: number;
    notes: string;
    bottom_watered: boolean;
  }>({
    watering_date: dayjs().toISOString(),
    saturation_scale: 10,
    notes: "",
    bottom_watered: false,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = formState;
    const result = createWateringSchema.safeParse(data);

    if (!result.success) {
      setValidationErrors(result.error.flatten().fieldErrors);

      return;
    }

    setSubmitLoading(true);
    try {
      await fetchWaterPlantV1PlantsPlantIdWaterPost({
        pathParams: { plantId },
        body: result.data,
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: `Failed to create watering.`,
        color: "danger",
      });
      setSubmitLoading(false);

      return;
    }

    addToast({
      title: "Success",
      description: `Watering created successfully.`,
      color: "success",
    });
    setSubmitLoading(false);
    await onWateringCreated?.();
    setOpen(false);
  };

  return (
    <Drawer
      isDismissable={false}
      isOpen={open}
      placement="right"
      size="2xl"
      onClose={() => setOpen(false)}
    >
      <Form
        autoComplete="off"
        validationErrors={validationErrors}
        onSubmit={handleSubmit}
      >
        <DrawerContent>
          {submitLoading ? (
            <div className="flex absolute top-0 bottom-0 left-0 right-0 justify-center items-center bg-black z-50 opacity-30">
              <CircularProgress />
            </div>
          ) : null}
          <DrawerHeader>Create a New Watering</DrawerHeader>
          <DrawerBody>
            <DatePicker
              isRequired
              showMonthAndYearPickers
              description="When did you water this plant?"
              label="Watering Date"
              value={strToDateValue(formState.watering_date)}
              variant="bordered"
              onChange={(date) => {
                if (!date) return;
                setFormState((prev) => ({
                  ...prev,
                  watering_date: dateValueToStr(date),
                }));
              }}
            />
            <Slider
              aria-label="Saturation Level"
              defaultValue={10}
              endContent={<IconDropletFilled size={20} />}
              label="Saturation Level"
              marks={[
                {
                  value: 1,
                  label: "Trickle",
                },
                {
                  value: 5,
                  label: "Partial",
                },
                {
                  value: 10,
                  label: "Full Watering",
                },
              ]}
              maxValue={10}
              minValue={1}
              size="lg"
              startContent={<IconDropletX size={20} />}
              step={1}
              value={formState.saturation_scale}
              onChange={(saturation_scale) =>
                setFormState((prev) => ({
                  ...prev,
                  saturation_scale: saturation_scale as number,
                }))
              }
            />
            <Checkbox
              isSelected={formState.bottom_watered}
              onValueChange={(value) => {
                setFormState((prev) => ({ ...prev, bottom_watered: value }));
              }}
            >
              Bottom Watering
            </Checkbox>
            <Textarea
              description="Any additional care details, thoughts, etc."
              label="Notes"
              name="notes"
              value={formState.notes}
              onValueChange={(notes) =>
                setFormState((prev) => ({ ...prev, notes }))
              }
            />
          </DrawerBody>
          <DrawerFooter>
            <Button size="lg" onPress={() => setOpen(false)}>
              Cancel
            </Button>
            <Button color="primary" size="lg" type="submit">
              Create
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Form>
    </Drawer>
  );
};
