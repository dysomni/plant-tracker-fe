import dayjs from "dayjs";
import {
  Button,
  Card,
  Chip,
  Divider,
  Link,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tooltip,
} from "@heroui/react";
import { useMemo, useState } from "react";
import { IconEdit, IconSortDescending2 } from "@tabler/icons-react";
import { useParams } from "react-router-dom";

import {
  fetchDeleteReminderV1RemindersReminderIdDelete,
  useGetPlantV1PlantsPlantIdGet,
} from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { usePageLoading } from "../components/page-loading";
import { Reminder } from "../generated/api/plantsSchemas";
import { useMediaQueries } from "../components/responsive-hooks";
import { CreateReminderDrawer } from "../components/create-reminder";

import DefaultLayout from "@/layouts/default";

export default function RemindersPage() {
  const plantId = useParams<{ plantId: string }>().plantId;

  if (!plantId) throw new Error("No plant ID provided.");

  const { data, error, refetch, isFetching } = useGetPlantV1PlantsPlantIdGet({
    pathParams: { plantId },
  });

  useAuthErrorRedirect(error);
  usePageLoading(isFetching);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const mediaQueries = useMediaQueries();
  const [sorting, setSorting] = useState<"new" | "old">("new");

  const handleDelete = async () => {
    await fetchDeleteReminderV1RemindersReminderIdDelete({
      pathParams: { reminderId: deleteId },
    });
    await refetch();
    setDeleteId("");
  };

  const sortedItems = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.reminders].sort((a, b) => {
      const dateA = dayjs(a.reminder_date);
      const dateB = dayjs(b.reminder_date);

      return sorting === "new" ? dateB.diff(dateA) : dateA.diff(dateB);
    });

    return sorted;
  }, [data, sorting]);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 pb-8 md:pb-10 w-full min-h-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-7 w-full items-center justify-center sm:justify-center">
          <div className="shrink-0">
            <Link color="primary" href={`/plants/${data?.plant.id}`}>
              <div className="font-extrabold text-3xl">
                Reminders for {data?.plant.name}
              </div>
            </Link>
          </div>
          <div className="flex flex-row items-center justify-center sm:justify-end gap-1 flex-wrap">
            <Chip color="default" variant="solid">
              {data?.reminders.length} Reminders
            </Chip>
          </div>
        </div>
        <div className="flex flex-row justify-center gap-3 w-full flex-wrap">
          <Button
            className="font-bold shrink-0"
            color="primary"
            isDisabled={isFetching}
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconEdit size={15} />}
            onPress={() => setTimeout(() => setCreateModalOpen(true), 50)}
          >
            Create Reminder
          </Button>
          <Select
            aria-label="Sort Photos By"
            className="max-w-40"
            selectedKeys={[sorting]}
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconSortDescending2 />}
            onSelectionChange={(option) => {
              setSorting((option.currentKey ?? sorting) as typeof sorting);
            }}
          >
            <SelectItem key="new">Newest First</SelectItem>
            <SelectItem key="old">Oldest First</SelectItem>
          </Select>
        </div>

        <Divider className="w-full" />
        <div className="w-full flex flex-col gap-0 justify-start grow px-1 pb-6">
          {sortedItems.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onDelete={() => setDeleteId(reminder.id ?? "")}
            />
          ))}
        </div>
      </section>
      <Modal
        isOpen={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId("")}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-0">
                Are you sure you want to delete this reminder?
              </ModalHeader>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    await handleDelete();
                  }}
                >
                  Delete Forever
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {createModalOpen ? (
        <CreateReminderDrawer
          open={createModalOpen}
          plantId={plantId}
          setOpen={setCreateModalOpen}
          onCreate={async () => {
            await refetch();
          }}
        />
      ) : null}
    </DefaultLayout>
  );
}

export const ReminderCard = (props: {
  reminder: Reminder;
  onDelete: () => void;
}) => {
  const { reminder, onDelete } = props;

  return (
    <Card>
      <div className="flex flex-row gap-4 flex-wrap justify-between px-4 py-2 items-center">
        <Tooltip
          content={dayjs(reminder.reminder_date).format("MMMM D, YYYY h:mm A")}
        >
          <div className="font-semibold">
            {dayjs(reminder.reminder_date).format("YYYY-MM-DD")}
          </div>
        </Tooltip>
        <div>Type: {reminder.reminder_type}</div>
        <Tooltip
          content={dayjs(reminder.completed_date).format("MMMM D, YYYY h:mm A")}
          isDisabled={!reminder.completed_date}
        >
          <div className="font-semibold">
            Completed: {reminder.complete ? "Yes" : "No"}
          </div>
        </Tooltip>
        {reminder.notes ? (
          <div className="text-sm font-serif">Notes: {reminder.notes}</div>
        ) : null}
        <Button color="danger" size="sm" onPress={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  );
};
