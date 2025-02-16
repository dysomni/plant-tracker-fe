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
  Select,
  SelectItem,
  Textarea,
} from "@nextui-org/react";
import { FormEvent, useState } from "react";
import { z } from "zod";
import { fromDate, getLocalTimeZone } from "@internationalized/date";
import dayjs from "dayjs";

import { fetchCreateReminderV1RemindersPost } from "../generated/api/plantsComponents";
import { useToast } from "../toast";

const strToDateValue = (date: string): DateValue => {
  return fromDate(
    dayjs(date).tz(getLocalTimeZone()).toDate(),
    getLocalTimeZone(),
  );
};

const dateValueToStr = (date: DateValue): string => {
  return dayjs(date.toDate(getLocalTimeZone())).toISOString();
};

export const createReminderSchema = z.object({
  plant_id: z.string().min(1),
  reminder_date: z.string().min(1),
  reminder_type: z.enum(["check", "repot", "prune"]),
  notes: z.string(),
});

export const CreateReminderDrawer = (props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCreate?: () => Promise<void>;
  plantId: string;
}) => {
  const { open, setOpen, onCreate, plantId } = props;

  const [validationErrors, setValidationErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formState, setFormState] = useState<{
    plant_id: string;
    reminder_date: string;
    reminder_type: "check" | "repot" | "prune";
    notes: string;
  }>({
    plant_id: plantId,
    reminder_date: dayjs().toISOString(),
    reminder_type: "check",
    notes: "",
  });

  const toast = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = formState;
    const result = createReminderSchema.safeParse(data);

    if (!result.success) {
      setValidationErrors(result.error.flatten().fieldErrors);

      return;
    }

    setSubmitLoading(true);
    try {
      await fetchCreateReminderV1RemindersPost({
        body: result.data,
      });
    } catch (error) {
      toast({
        message: `Failed to create reminder.`,
        type: "danger",
        duration: 5000,
      });
      setSubmitLoading(false);

      return;
    }

    toast({
      message: `Reminder created successfully.`,
      type: "success",
      duration: 5000,
    });
    setSubmitLoading(false);
    await onCreate?.();
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
          <DrawerHeader>Create a New Reminder</DrawerHeader>
          <DrawerBody>
            <DatePicker
              isRequired
              showMonthAndYearPickers
              description="When to remind you."
              label="Reminder Date"
              name="reminder_date"
              value={strToDateValue(formState.reminder_date)}
              variant="bordered"
              onChange={(date) => {
                if (!date) return;
                setFormState((prev) => ({
                  ...prev,
                  reminder_date: dateValueToStr(date),
                }));
              }}
            />
            <Select
              isRequired
              aria-label="Reminder Type"
              description="What type of reminder is this?"
              label="Reminder Type"
              name="reminder_type"
              selectedKeys={[formState.reminder_type]}
              size="sm"
              onSelectionChange={(option) => {
                setFormState((prev) => ({
                  ...prev,
                  reminder_type: option.currentKey as
                    | "check"
                    | "repot"
                    | "prune",
                }));
              }}
            >
              <SelectItem key="check">Check</SelectItem>
              <SelectItem key="repot">Repot</SelectItem>
              <SelectItem key="prune">Prune</SelectItem>
            </Select>
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
            <Button color="success" type="submit">
              Create
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Form>
    </Drawer>
  );
};
