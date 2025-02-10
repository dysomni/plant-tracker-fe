import {
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
} from "@nextui-org/react";
import { FormEvent, useState } from "react";
import { z } from "zod";
import { fetchCheckPlantV1PlantsPlantIdCheckPost } from "../generated/api/plantsComponents";
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

  const toast = useToast();

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
      toast({
        message: `Failed to create check.`,
        type: "danger",
        duration: 5000,
      });
      setSubmitLoading(false);
      return;
    }

    toast({
      message: `Check created successfully.`,
      type: "success",
      duration: 5000,
    });
    setSubmitLoading(false);
    await onCheckCreated?.();
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
          <DrawerHeader>Create a New Check</DrawerHeader>
          <DrawerBody>
            <DatePicker
              isRequired
              showMonthAndYearPickers
              value={strToDateValue(formState.check_date)}
              onChange={(date) => {
                if (!date) return;
                setFormState((prev) => ({
                  ...prev,
                  check_date: dateValueToStr(date),
                }));
              }}
              label="Check Date"
              description="When did you check this plant?"
              variant="bordered"
            />
            <Slider
              aria-label="Wetness Level"
              label="Wetness Level"
              defaultValue={10}
              maxValue={10}
              minValue={0}
              size="lg"
              step={1}
              endContent={<IconDropletFilled size={20} />}
              startContent={<IconDropletX size={20} />}
              value={formState.wetness_scale}
              onChange={(wetness_scale) =>
                setFormState((prev) => ({
                  ...prev,
                  wetness_scale: wetness_scale as number,
                }))
              }
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
