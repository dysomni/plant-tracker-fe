import {
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
} from "@nextui-org/react";
import { FormEvent, useState } from "react";
import { z } from "zod";
import { fetchWaterPlantV1PlantsPlantIdWaterPost } from "../generated/api/plantsComponents";
import { useToast } from "../toast";
import { IconDropletFilled, IconDropletX } from "@tabler/icons-react";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import dayjs from "dayjs";

const strToDateValue = (date: string): DateValue => {
  return fromDate(
    dayjs(date).tz(getLocalTimeZone()).toDate(),
    getLocalTimeZone()
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

  const toast = useToast();

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
      toast({
        message: `Failed to create watering.`,
        type: "danger",
        duration: 5000,
      });
      setSubmitLoading(false);
      return;
    }

    toast({
      message: `Watering created successfully.`,
      type: "success",
      duration: 5000,
    });
    setSubmitLoading(false);
    await onWateringCreated?.();
    setOpen(false);
  };

  return (
    <Drawer
      isOpen={open}
      onClose={() => setOpen(false)}
      placement="right"
      size="2xl"
    >
      <Form
        onSubmit={handleSubmit}
        validationErrors={validationErrors}
        autoComplete="off"
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
              value={strToDateValue(formState.watering_date)}
              onChange={(date) => {
                if (!date) return;
                setFormState((prev) => ({
                  ...prev,
                  watering_date: dateValueToStr(date),
                }));
              }}
              label="Watering Date"
              description="When did you water this plant?"
              variant="bordered"
            />
            <Slider
              aria-label="Saturation Level"
              label="Saturation Level"
              defaultValue={10}
              maxValue={10}
              minValue={1}
              size="lg"
              step={1}
              endContent={<IconDropletFilled size={20} />}
              startContent={<IconDropletX size={20} />}
              value={formState.saturation_scale}
              onChange={(saturation_scale) =>
                setFormState((prev) => ({
                  ...prev,
                  saturation_scale: saturation_scale as number,
                }))
              }
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
              label="Notes"
              name="notes"
              value={formState.notes}
              onValueChange={(notes) =>
                setFormState((prev) => ({ ...prev, notes }))
              }
              description="Any additional care details, thoughts, etc."
            />
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit" color="success">
              Create
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Form>
    </Drawer>
  );
};
