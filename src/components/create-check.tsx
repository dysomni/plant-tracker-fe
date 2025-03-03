import {
  addToast,
  Button,
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

import { fetchCheckPlantV1PlantsPlantIdCheckPost } from "../generated/api/plantsComponents";

const strToDateValue = (date: string): DateValue => {
  return fromDate(
    dayjs(date).tz(getLocalTimeZone()).toDate(),
    getLocalTimeZone(),
  );
};

const dateValueToStr = (date: DateValue): string => {
  return dayjs(date.toDate(getLocalTimeZone())).toISOString();
};

export const createCheckSchema = z.object({
  check_date: z.string().min(1),
  wetness_scale: z.number().min(0).max(10),
  notes: z.string(),
});

export const CreateCheckDrawer = (props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCheckCreated?: () => Promise<void>;
  plantId: string;
}) => {
  const { open, setOpen, onCheckCreated, plantId } = props;

  const [validationErrors, setValidationErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formState, setFormState] = useState<{
    check_date: string;
    wetness_scale: number;
    notes: string;
  }>({
    check_date: dayjs().toISOString(),
    wetness_scale: 10,
    notes: "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = formState;
    const result = createCheckSchema.safeParse(data);

    if (!result.success) {
      setValidationErrors(result.error.flatten().fieldErrors);

      return;
    }

    setSubmitLoading(true);
    try {
      await fetchCheckPlantV1PlantsPlantIdCheckPost({
        pathParams: { plantId },
        body: result.data,
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: `Failed to create check.`,
        color: "danger",
      });
      setSubmitLoading(false);

      return;
    }

    addToast({
      title: "Success",
      description: `Check created successfully.`,
      color: "success",
    });
    setSubmitLoading(false);
    await onCheckCreated?.();
    setOpen(false);
  };

  return (
    <Drawer
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
          <DrawerHeader>Create a New Check</DrawerHeader>
          <DrawerBody>
            <DatePicker
              isRequired
              showMonthAndYearPickers
              description="When did you check this plant?"
              label="Check Date"
              value={strToDateValue(formState.check_date)}
              variant="bordered"
              onChange={(date) => {
                if (!date) return;
                setFormState((prev) => ({
                  ...prev,
                  check_date: dateValueToStr(date),
                }));
              }}
            />
            <Slider
              aria-label="Wetness Level"
              defaultValue={10}
              endContent={<IconDropletFilled size={20} />}
              label="Wetness Level"
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
              value={formState.wetness_scale}
              onChange={(wetness_scale) =>
                setFormState((prev) => ({
                  ...prev,
                  wetness_scale: wetness_scale as number,
                }))
              }
            />
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
