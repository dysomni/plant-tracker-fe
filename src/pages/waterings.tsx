import DefaultLayout from "@/layouts/default";
import {
  fetchDeleteWateringV1WateringsWateringIdDelete,
  useGetPlantV1PlantsPlantIdGet,
} from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { usePageLoading } from "../components/page-loading";
import { Watering } from "../generated/api/plantsSchemas";
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
} from "@nextui-org/react";
import { useMemo, useState } from "react";
import { IconEdit, IconSortDescending2 } from "@tabler/icons-react";
import { useMediaQueries } from "../components/responsive-hooks";
import { useParams } from "react-router-dom";
import { CreateWateringDrawer } from "../components/create-watering";

export default function WateringsPage() {
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
    await fetchDeleteWateringV1WateringsWateringIdDelete({
      pathParams: { wateringId: deleteId },
    });
    await refetch();
    setDeleteId("");
  };

  const sortedItems = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.waterings].sort((a, b) => {
      const dateA = dayjs(a.watering_date);
      const dateB = dayjs(b.watering_date);
      return sorting === "new" ? dateB.diff(dateA) : dateA.diff(dateB);
    });
    return sorted;
  }, [data, sorting]);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 pb-8 md:pb-10 w-full min-h-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-7 w-full items-center justify-center sm:justify-center">
          <div className="shrink-0">
            <Link href={`/plants/${data?.plant.id}`} color="success">
              <div className="font-extrabold text-3xl">
                Waterings for {data?.plant.name}
              </div>
            </Link>
          </div>
          <div className="flex flex-row items-center justify-center sm:justify-end gap-1 flex-wrap">
            <Chip color="default" variant="solid">
              {data?.waterings.length} Waterings
            </Chip>
          </div>
        </div>
        <div className="flex flex-row justify-center gap-3 w-full flex-wrap">
          <Button
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconEdit size={15} />}
            color="success"
            className="font-bold shrink-0"
            onPress={() => setTimeout(() => setCreateModalOpen(true), 50)}
            isDisabled={isFetching}
          >
            Create Watering
          </Button>
          <Select
            className="max-w-40"
            size={mediaQueries["sm"] ? "md" : "sm"}
            aria-label="Sort Photos By"
            startContent={<IconSortDescending2 />}
            selectedKeys={[sorting]}
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
          {sortedItems.map((watering) => (
            <WateringCard
              watering={watering}
              key={watering.id}
              onDelete={() => setDeleteId(watering.id ?? "")}
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
                Are you sure you want to delete this watering?
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
        <CreateWateringDrawer
          open={createModalOpen}
          setOpen={setCreateModalOpen}
          plantId={plantId}
          onWateringCreated={async () => {
            await refetch();
          }}
        />
      ) : null}
    </DefaultLayout>
  );
}

export const WateringCard = (props: {
  watering: Watering;
  onDelete: () => void;
}) => {
  const { watering, onDelete } = props;
  return (
    <Card>
      <div className="flex flex-row gap-4 flex-wrap justify-between px-4 py-2 items-center">
        <Tooltip
          content={dayjs(watering.watering_date).format("MMMM D, YYYY h:mm A")}
        >
          <div className="font-semibold">
            {dayjs(watering.watering_date).format("YYYY-MM-DD")}
          </div>
        </Tooltip>
        <div>Saturation: {watering.saturation_scale}</div>
        <div>Bottom Watered: {watering.bottom_watered ? "Yes" : "No"}</div>
        {watering.notes ? (
          <div className="text-sm font-serif">{watering.notes}</div>
        ) : null}
        <Button size="sm" color="danger" onPress={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  );
};
