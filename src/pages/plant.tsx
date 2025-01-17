import DefaultLayout from "@/layouts/default";
import {
  fetchCreatePhotoV1PhotosPost,
  fetchDeletePhotoV1PhotosPhotoIdDelete,
  fetchMarkPhotoAsCoverPhotoV1PhotosPhotoIdMarkCoverPhotoPost,
  fetchMarkPhotoUploadedV1PhotosPhotoIdMarkUploadedPost,
  fetchUpdatePlantV1PlantsPlantIdPatch,
  useGetPlantPhotosV1PlantsPlantIdPhotosGet,
  useGetPlantV1PlantsPlantIdGet,
} from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { usePageLoading } from "../components/page-loading";
import { Plant } from "../generated/api/plantsSchemas";
import { now, getLocalTimeZone } from "@internationalized/date";
import dayjs from "dayjs";
import {
  Button,
  Checkbox,
  CircularProgress,
  DatePicker,
  DateValue,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Image,
  Input,
  Link,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Textarea,
} from "@nextui-org/react";
import { useImagePreview } from "../components/image-preview";
import {
  PlantLatestReminderBadge,
  PlantWateringBadge,
  PlantWetnessBadge,
} from "../components/badges";
import { useMemo, useState } from "react";
import {
  IconArchiveFilled,
  IconBell,
  IconCamera,
  IconDropletFilled,
  IconEdit,
  IconRestore,
  IconRuler2,
  IconSortDescending2,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { useMediaQueries } from "../components/responsive-hooks";
import { CreatePlantDrawer } from "../components/create-plant";
import { useParams } from "react-router-dom";
import { removeTimeZoneBracketFromDatetime, unwrap } from "../util";
import { useToast } from "../toast";
import { CheckPlantDrawer } from "../components/check-plant";
import { MyChart } from "../components/history-graph";

export default function PlantPage() {
  const plantId = useParams<{ plantId: string }>().plantId;
  if (!plantId) throw new Error("No plant ID provided.");

  const { data, error, refetch, isFetching } = useGetPlantV1PlantsPlantIdGet({
    pathParams: { plantId },
  });
  const {
    data: photoData,
    isFetching: isFetchingPhotos,
    error: photoError,
    refetch: refetchPhotos,
  } = useGetPlantPhotosV1PlantsPlantIdPhotosGet({
    pathParams: { plantId },
  });
  useAuthErrorRedirect(error || photoError);
  usePageLoading(isFetching || isFetchingPhotos);
  const { setPreview } = useImagePreview();

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState("");
  const [checking, setChecking] = useState(false);

  const mediaQueries = useMediaQueries();
  const [editPlantDrawerOpen, setEditPlantDrawerOpen] = useState(false);
  const [addPhotoOpen, setAddPhotoOpen] = useState(false);
  const [sorting, setSorting] = useState<"new" | "old">("new");

  const handleArchive = async (archive: boolean = true) => {
    await fetchUpdatePlantV1PlantsPlantIdPatch({
      pathParams: { plantId },
      body: { archived: archive },
    });
    await refetch();
    setArchiveModalOpen(false);
  };

  const sortedPhotos = useMemo(() => {
    if (!photoData) return [];
    const sorted = [...photoData.photos].sort((a, b) => {
      const dateA = dayjs(a.photo.photo_date);
      const dateB = dayjs(b.photo.photo_date);
      return sorting === "new" ? dateB.diff(dateA) : dateA.diff(dateB);
    });
    return sorted;
  }, [photoData, sorting]);

  const borderColor = "border-gray-100 dark:border-gray-800";
  const tabContainerClass = `w-full flex flex-col gap-2 justify-start border-2 rounded-xl shadow-md ${borderColor} min-h-full`;

  return (
    <DefaultLayout>
      {checking && (
        <CheckPlantDrawer
          plantToCheck={plantId}
          onClose={() => setChecking(false)}
          onCheckDone={async () => {
            await refetch();
          }}
        />
      )}
      <CreatePlantDrawer
        open={editPlantDrawerOpen}
        setOpen={setEditPlantDrawerOpen}
        onPlantCreated={async () => {
          await refetch();
        }}
        editPlant={data?.plant}
      />
      <section className="flex flex-col items-center justify-center gap-4 pb-8 md:pb-10 w-full min-h-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-7 w-full items-center justify-center sm:justify-center">
          <div className="shrink-0">
            <Link href={`/plants/${data?.plant.id}`} color="success">
              <div className="font-extrabold text-3xl">{data?.plant.name}</div>
            </Link>
            {/* <div className="font-bold">{data?.location.name}</div> */}
          </div>
          <div className="flex flex-row items-center justify-center sm:justify-end gap-1 flex-wrap">
            <PlantLatestReminderBadge
              hasReminders={
                !!(
                  data?.outstanding_reminders.filter(
                    (r) => r.reminder_type === "check"
                  ).length ?? 0
                )
              }
            />
            {data && <PlantWetnessBadge lastCheck={data.last_check} />}
            {data && <PlantWateringBadge lastWatered={data?.last_watering} />}
          </div>
        </div>
        <div className="flex flex-row justify-center gap-3 w-full flex-wrap">
          <Button
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconEdit size={15} />}
            color="success"
            className="font-bold shrink-0"
            onPress={() => setTimeout(() => setEditPlantDrawerOpen(true), 50)}
            isDisabled={isFetching}
          >
            Edit Plant
          </Button>
          <Button
            size={mediaQueries["sm"] ? "md" : "sm"}
            color="primary"
            className="font-bold shrink-0"
            startContent={<IconRuler2 size={20} />}
            onPress={() => setTimeout(() => setChecking(true), 50)}
          >
            Check
          </Button>
          <Button
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconCamera size={15} />}
            color="default"
            className="font-bold shrink-0"
            isDisabled={isFetching}
            onPress={() => setTimeout(() => setAddPhotoOpen(true), 50)}
          >
            Add Photo
          </Button>
          {data?.plant.archived ? (
            <Button
              size={mediaQueries["sm"] ? "md" : "sm"}
              startContent={<IconRestore size={15} />}
              color="primary"
              className="font-bold shrink-0"
              onPress={async () => {
                await handleArchive(false);
              }}
              isDisabled={isFetching}
            >
              Restore Plant
            </Button>
          ) : (
            <Button
              size={mediaQueries["sm"] ? "md" : "sm"}
              startContent={<IconArchiveFilled size={15} />}
              color="danger"
              className="font-bold shrink-0"
              onPress={() => setArchiveModalOpen(true)}
              isDisabled={isFetching}
            >
              Archive Plant
            </Button>
          )}
        </div>

        <Divider className="w-full" />
        <div className="w-full flex flex-col gap-0 justify-start grow px-1 pb-6">
          <Tabs
            aria-label="Plant Tabs"
            className="flex justify-center"
            size="lg"
          >
            <Tab title="Details">
              <div className={tabContainerClass}>
                <div className="flex flex-col sm:flex-row gap-6 p-6">
                  <div className="flex flex-col items-center shrink-0">
                    <Image
                      className="rounded-xl"
                      src={data?.cover_photo_url ?? "/placeholder.png"}
                      alt="Plant cover photo"
                      height={300}
                    />
                    <div className="italic font-bold text-sm">
                      {data?.plant.scientific_name}
                    </div>
                  </div>
                  <div className="grow flex flex-col gap-3">
                    <div>
                      <h4 className="text-xl font-bold">
                        Location - {data?.location.name}
                      </h4>
                      <p className="italic text-sm font-serif">
                        {data?.location.description}
                      </p>
                    </div>
                    <Divider />
                    <div>
                      <h4 className="text-xl font-bold">Notes</h4>
                      <p className="font-serif">{data?.plant.notes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab title="History">
              <div className={tabContainerClass}>
                <div className="p-3 sm:p-6 flex flex-col gap-4">
                  <div className="flex gap-3 self-center flex-wrap justify-center">
                    <Button
                      size="sm"
                      as={Link}
                      href={`/plants/${plantId}/reminders`}
                      startContent={<IconBell size={15} />}
                    >
                      See All Reminders
                    </Button>
                    <Button
                      size="sm"
                      as={Link}
                      href={`/plants/${plantId}/checks`}
                      startContent={<IconRuler2 size={15} />}
                    >
                      See All Checks
                    </Button>
                    <Button
                      size="sm"
                      as={Link}
                      href={`/plants/${plantId}/waterings`}
                      startContent={<IconDropletFilled size={15} />}
                    >
                      See All Waterings
                    </Button>
                  </div>
                  {data && (
                    <MyChart
                      waterHistory={data.waterings}
                      checkHistory={data.checks}
                    />
                  )}
                </div>
              </div>
            </Tab>
            <Tab title="Photos">
              <div className={tabContainerClass}>
                <div
                  className={`border-b-2 rounded-md ${borderColor} bg-slate-50 dark:bg-slate-800 py-1 px-4 flex justify-end`}
                >
                  <Select
                    className="max-w-40"
                    size="sm"
                    aria-label="Sort Photos By"
                    startContent={<IconSortDescending2 />}
                    selectedKeys={[sorting]}
                    onSelectionChange={(option) => {
                      setSorting(
                        (option.currentKey ?? sorting) as typeof sorting
                      );
                    }}
                  >
                    <SelectItem key="new">Newest First</SelectItem>
                    <SelectItem key="old">Oldest First</SelectItem>
                  </Select>
                </div>
                <div className="flex flex-row flex-wrap gap-2 w-full justify-center p-6 pt-2">
                  {sortedPhotos.length === 0 && (
                    <p className="italic">No photos taken yet.</p>
                  )}
                  {sortedPhotos.map((photo) => (
                    <div
                      key={photo.photo.id}
                      className="flex flex-col gap-1 items-center border-2 rounded-xl p-1 shadow-md border-gray-100 dark:border-gray-800"
                    >
                      <Image
                        className="cursor-pointer"
                        height={mediaQueries["sm"] ? 300 : 150}
                        src={photo.presigned_url}
                        alt={data?.plant.name}
                        onClick={() =>
                          setPreview({
                            src: photo.presigned_url,
                            plantName: data?.plant.name ?? "a",
                          })
                        }
                      />
                      <Link href={photo.presigned_url} target="_blank">
                        View Full Size
                      </Link>
                      {data?.cover_photo?.id === photo.photo.id ? (
                        <p className="flex flex-row gap-1 items-center">
                          <IconSparkles />
                          Cover Photo
                          <IconSparkles />
                        </p>
                      ) : (
                        <Button
                          size="sm"
                          color="primary"
                          onPress={async () => {
                            await fetchMarkPhotoAsCoverPhotoV1PhotosPhotoIdMarkCoverPhotoPost(
                              {
                                pathParams: { photoId: unwrap(photo.photo.id) },
                              }
                            );
                            await Promise.all([refetch(), refetchPhotos()]);
                          }}
                        >
                          Set as Cover
                        </Button>
                      )}

                      <p>
                        {dayjs(photo.photo.photo_date).format("MMMM D, YYYY")}
                      </p>
                      <Link
                        className="cursor-pointer"
                        color="danger"
                        onPress={() => setDeletePhotoId(unwrap(photo.photo.id))}
                      >
                        <IconTrash size={15} />
                        Delete
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </section>
      <Modal isOpen={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-0">
                Are you sure you want to archive {data?.plant.name}?
              </ModalHeader>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    await handleArchive(true);
                  }}
                >
                  Archive
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={!!deletePhotoId}
        onOpenChange={(open) => {
          if (!open) setDeletePhotoId("");
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-0">
                Are you sure you want to delete this photo?
              </ModalHeader>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={async () => {
                    await fetchDeletePhotoV1PhotosPhotoIdDelete({
                      pathParams: { photoId: deletePhotoId },
                    });
                    await Promise.all([refetch(), refetchPhotos()]);
                    setDeletePhotoId("");
                  }}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {data && addPhotoOpen && (
        <AddPhotoDrawer
          open={addPhotoOpen}
          setOpen={setAddPhotoOpen}
          plant={data?.plant}
          onPhotoUploaded={async () => {
            await refetch();
          }}
        />
      )}
    </DefaultLayout>
  );
}

const AddPhotoDrawer = (props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  plant: Plant;
  onPhotoUploaded?: () => Promise<void>;
}) => {
  const { open, setOpen, plant } = props;
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [coverSelected, setCoverSelected] = useState(false);
  const [notes, setNotes] = useState("");
  const [overrideDate, setOverrideDate] = useState<DateValue>(
    now(getLocalTimeZone())
  );
  const toast = useToast();

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    try {
      const newPhotoRecord = await fetchCreatePhotoV1PhotosPost({
        body: {
          plant_id: unwrap(plant.id),
          photo_type: uploadedFile.type,
          photo_date: removeTimeZoneBracketFromDatetime(
            overrideDate.toString()
          ),
          cover_photo: coverSelected,
          notes: notes,
        },
      });
      const presignedUrl = newPhotoRecord.upload_presigned_url;
      await fetch(presignedUrl, {
        method: "PUT",
        body: uploadedFile,
        headers: {
          "Content-Type": uploadedFile.type,
        },
      });
      await fetchMarkPhotoUploadedV1PhotosPhotoIdMarkUploadedPost({
        pathParams: { photoId: unwrap(newPhotoRecord.photo.id) },
      });
      await props.onPhotoUploaded?.();
      toast({
        message: "Photo uploaded successfully.",
        type: "success",
        duration: 5000,
      });
      setOpen(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        message: "Failed to upload photo.",
        type: "danger",
        duration: 5000,
      });
    }
  };

  return (
    <Drawer isOpen={open} onOpenChange={setOpen}>
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">
              Add a photo for {plant.name}
            </DrawerHeader>
            <DrawerBody>
              <div className="flex flex-col gap-4">
                <Input
                  type="file"
                  label="Photo"
                  name="photo"
                  accept="image/*"
                  onChange={(e) => {
                    const newFile = e.target.files?.[0];
                    if (!newFile) return;
                    setUploadedFile(newFile);
                  }}
                  isDisabled={loading}
                />
                <Checkbox
                  isSelected={coverSelected}
                  onValueChange={setCoverSelected}
                  isDisabled={loading}
                >
                  Make Cover Photo
                </Checkbox>
                {uploadedFile && (
                  <Image
                    src={URL.createObjectURL(uploadedFile)}
                    alt="Uploaded photo preview"
                    height={200}
                  />
                )}
              </div>
              <Textarea
                label="Notes"
                value={notes}
                onValueChange={setNotes}
                placeholder="Add notes about the photo..."
                isDisabled={loading}
              />
              <DatePicker
                showMonthAndYearPickers
                value={overrideDate}
                onChange={(date) => date && setOverrideDate(date)}
                label="Override Date"
                description="Set the date of this photo to be something else"
                variant="bordered"
              />
            </DrawerBody>
            <DrawerFooter>
              {loading && <CircularProgress />}
              <Button
                color="default"
                variant="light"
                onPress={onClose}
                isDisabled={loading}
              >
                Cancel
              </Button>
              <Button
                color="success"
                onPress={handleUpload}
                isDisabled={!uploadedFile || loading}
              >
                Upload
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};
