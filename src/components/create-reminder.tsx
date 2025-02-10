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
import { fetchCreateReminderV1RemindersPost } from "../generated/api/plantsComponents";
import { useToast } from "../toast";
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
          <DrawerHeader>Create a New Reminder</DrawerHeader>
          <DrawerBody>
            <DatePicker
              isRequired
              name="reminder_date"
              showMonthAndYearPickers
              value={strToDateValue(formState.reminder_date)}
              onChange={(date) => {
                if (!date) return;
                setFormState((prev) => ({
                  ...prev,
                  reminder_date: dateValueToStr(date),
                }));
              }}
              label="Reminder Date"
              description="When to remind you."
              variant="bordered"
            />
            <Select
              isRequired
              name="reminder_type"
              size="sm"
              aria-label="Reminder Type"
              label="Reminder Type"
              description="What type of reminder is this?"
              selectedKeys={[formState.reminder_type]}
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
