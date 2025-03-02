import { now, getLocalTimeZone } from "@internationalized/date";
import dayjs from "dayjs";
import {
  Button,
  Card,
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
import { useParams } from "react-router-dom";

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
import { useImagePreview } from "../components/image-preview";
import {
  PlantLatestReminderBadge,
  PlantWateringBadge,
  PlantWetnessBadge,
} from "../components/badges";
import { useMediaQueries } from "../components/responsive-hooks";
import { CreatePlantDrawer } from "../components/create-plant";
import { removeTimeZoneBracketFromDatetime, unwrap } from "../util";
import { useToast } from "../toast";
import { CheckPlantDrawer } from "../components/check-plant";
import { MyChart } from "../components/history-graph";

import DefaultLayout from "@/layouts/default";

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

  const tabContainerClass = `w-full flex flex-col gap-2 justify-start border-1 dark:border-0 rounded-xl min-h-full`;

  return (
    <DefaultLayout>
      {checking && (
        <CheckPlantDrawer
          plantToCheck={plantId}
          onCheckDone={async () => {
            await refetch();
          }}
          onClose={() => setChecking(false)}
        />
      )}
      <CreatePlantDrawer
        editPlant={data?.plant}
        open={editPlantDrawerOpen}
        setOpen={setEditPlantDrawerOpen}
        onPlantCreated={async () => {
          await refetch();
        }}
      />
      <section className="flex flex-col items-center justify-center gap-4 pb-8 md:pb-10 w-full min-h-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-7 w-full items-center justify-center sm:justify-center">
          <div className="shrink-0">
            <Link color="primary" href={`/plants/${data?.plant.id}`}>
              <div className="font-extrabold text-3xl">{data?.plant.name}</div>
            </Link>
          </div>
          <div className="flex flex-row items-center justify-center sm:justify-end gap-1 flex-wrap">
            <PlantLatestReminderBadge
              hasReminders={
                !!(
                  data?.outstanding_reminders.filter(
                    (r) => r.reminder_type === "check",
                  ).length ?? 0
                )
              }
            />
            {data && (
              <PlantWetnessBadge
                lastCheck={data.last_check}
                wetnessDecayPerDay={data.wetness_decay_per_day}
              />
            )}
            {data && <PlantWateringBadge lastWatered={data?.last_watering} />}
          </div>
        </div>
        <div className="flex flex-row justify-center gap-3 w-full flex-wrap">
          <Button
            className="font-bold shrink-0"
            color="primary"
            isDisabled={isFetching}
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconEdit size={15} />}
            onPress={() => setTimeout(() => setEditPlantDrawerOpen(true), 50)}
          >
            Edit Plant
          </Button>
          <Button
            className="font-bold shrink-0"
            color="primary"
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconRuler2 size={20} />}
            onPress={() => setTimeout(() => setChecking(true), 50)}
          >
            Check
          </Button>
          <Button
            className="font-bold shrink-0"
            color="default"
            isDisabled={isFetching}
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconCamera size={15} />}
            onPress={() => setTimeout(() => setAddPhotoOpen(true), 50)}
          >
            Add Photos
          </Button>
          {data?.plant.archived ? (
            <Button
              className="font-bold shrink-0"
              color="primary"
              isDisabled={isFetching}
              size={mediaQueries["sm"] ? "md" : "sm"}
              startContent={<IconRestore size={15} />}
              onPress={async () => {
                await handleArchive(false);
              }}
            >
              Restore Plant
            </Button>
          ) : (
            <Button
              className="font-bold shrink-0"
              color="danger"
              isDisabled={isFetching}
              size={mediaQueries["sm"] ? "md" : "sm"}
              startContent={<IconArchiveFilled size={15} />}
              onPress={() => setArchiveModalOpen(true)}
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
              <Card className={tabContainerClass}>
                <div className="flex flex-col sm:flex-row gap-6 p-6">
                  <div className="flex flex-col items-center shrink-0">
                    <Image
                      alt="Plant cover photo"
                      className="rounded-xl"
                      height={300}
                      src={data?.cover_photo_url ?? "/placeholder.png"}
                    />
                    <div className="italic font-bold text-sm">
                      {data?.plant.scientific_name}
                    </div>
                  </div>
                  <div className="grow flex flex-col gap-3">
                    <div className="flex flex-row gap-4 items-end flex-wrap">
                      <div>
                        <h4 className="text-xl font-bold">
                          Location: {data?.location.name}
                        </h4>
                        <p className="italic text-sm font-serif">
                          {data?.location.description}
                        </p>
                      </div>
                      <h5 className="text-md flex-grow text-right">
                        Created{" "}
                        {dayjs(data?.plant.created_at).format("MMMM D, YYYY")}
                      </h5>
                    </div>
                    <Divider />
                    {data && Number(data.wetness_decay_per_day) !== 0 ? (
                      <div className="flex flex-row gap-3 items-center">
                        <h4 className="text-md font-bold">
                          Typical Dry Out Time:
                        </h4>
                        <p className="text-right">
                          {Math.ceil(9 / Number(data.wetness_decay_per_day))}{" "}
                          days
                        </p>
                      </div>
                    ) : null}

                    <div>
                      <h4 className="text-xl font-bold">Notes</h4>
                      <p className="font-serif whitespace-pre-line">
                        {data?.plant.notes}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </Tab>
            <Tab title="History">
              <Card className={tabContainerClass}>
                <div className="p-3 sm:p-6 flex flex-col gap-4">
                  <div className="flex gap-3 self-center flex-wrap justify-center">
                    <Button
                      as={Link}
                      href={`/plants/${plantId}/reminders`}
                      size="sm"
                      startContent={<IconBell size={15} />}
                    >
                      See All Reminders
                    </Button>
                    <Button
                      as={Link}
                      href={`/plants/${plantId}/checks`}
                      size="sm"
                      startContent={<IconRuler2 size={15} />}
                    >
                      See All Checks
                    </Button>
                    <Button
                      as={Link}
                      href={`/plants/${plantId}/waterings`}
                      size="sm"
                      startContent={<IconDropletFilled size={15} />}
                    >
                      See All Waterings
                    </Button>
                  </div>
                  {data && (
                    <MyChart
                      checkHistory={data.checks}
                      waterHistory={data.waterings}
                      wetnessDecayPerDay={data.wetness_decay_per_day}
                    />
                  )}
                </div>
              </Card>
            </Tab>
            <Tab title="Photos">
              <Card className={tabContainerClass}>
                <div
                  className={`border-b-1 rounded-xl border-foreground-300 py-2 px-6 flex justify-end`}
                >
                  <Select
                    aria-label="Sort Photos By"
                    className="max-w-40"
                    selectedKeys={[sorting]}
                    size="sm"
                    startContent={<IconSortDescending2 />}
                    onSelectionChange={(option) => {
                      setSorting(
                        (option.currentKey ?? sorting) as typeof sorting,
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
                      className="flex flex-col gap-1 items-center border-2 rounded-xl p-1 shadow-md border-foreground-200"
                    >
                      <Image
                        alt={data?.plant.name}
                        className="cursor-pointer"
                        height={mediaQueries["sm"] ? 200 : 150}
                        src={photo.thumbnail_presigned_url}
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
                          color="primary"
                          size="sm"
                          onPress={async () => {
                            await fetchMarkPhotoAsCoverPhotoV1PhotosPhotoIdMarkCoverPhotoPost(
                              {
                                pathParams: { photoId: unwrap(photo.photo.id) },
                              },
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
              </Card>
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
          plant={data?.plant}
          setOpen={setAddPhotoOpen}
          onPhotoUploaded={async () => {
            await Promise.all([refetch(), refetchPhotos()]);
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
  const [uploadedFiles, setUploadedFiles] = useState<File[] | null>(null);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [overrideDate, setOverrideDate] = useState<DateValue>(
    now(getLocalTimeZone()),
  );
  const toast = useToast();

  const handleSingleUpload = async (file: File, index: number) => {
    try {
      const newPhotoRecord = await fetchCreatePhotoV1PhotosPost({
        body: {
          plant_id: unwrap(plant.id),
          photo_type: file.type,
          photo_date: removeTimeZoneBracketFromDatetime(
            overrideDate.toString(),
          ),
          cover_photo: coverPhotoIndex === index,
          notes: notes,
        },
      });
      const presignedUrl = newPhotoRecord.upload_presigned_url;

      await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      await fetchMarkPhotoUploadedV1PhotosPhotoIdMarkUploadedPost({
        pathParams: { photoId: unwrap(newPhotoRecord.photo.id) },
      });
      toast({
        message: `Photo ${file.name} uploaded successfully.`,
        type: "success",
        duration: 5000,
      });
    } catch (error) {
      toast({
        message: `Failed to upload photo ${file.name}.`,
        type: "danger",
        duration: 5000,
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadedFiles || !uploadedFiles.length) return;

    setLoading(true);
    const filePromises = uploadedFiles.map(handleSingleUpload);

    await Promise.all(filePromises);
    await props.onPhotoUploaded?.();
    setLoading(false);
    setOpen(false);
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
                  multiple
                  accept="image/*"
                  isDisabled={loading}
                  label="Photo"
                  name="photo"
                  type="file"
                  onChange={(e) => {
                    const newFiles = e.target.files;

                    if (!newFiles) return;
                    setUploadedFiles(Array.from(newFiles));
                    setCoverPhotoIndex(null);
                  }}
                />

                {uploadedFiles && (
                  <div className="flex flex-col gap-1">
                    <p className="text-md font-bold pb-0">Uploaded Photos</p>
                    <div className="flex flex-row gap-1 flex-wrap">
                      {uploadedFiles.map((file, indx) => (
                        <Image
                          key={file.name}
                          alt="Uploaded photo preview"
                          className={`border-0 border-secondary ${indx === coverPhotoIndex ? "border-4" : ""} rounded-xl`}
                          height={100}
                          src={URL.createObjectURL(file)}
                          style={{
                            transition: "border-width 0.1s ease",
                          }}
                          onClick={() => {
                            if (indx === coverPhotoIndex) {
                              setCoverPhotoIndex(null);

                              return;
                            }
                            setCoverPhotoIndex(indx);
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-row gap-2">
                      <p className="font-bold text-sm">
                        Select/click to set cover photo.
                      </p>
                      {coverPhotoIndex !== null && (
                        <p className="italic text-sm">
                          (Selected #{coverPhotoIndex + 1})
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Textarea
                isDisabled={loading}
                label="Notes"
                placeholder="Add notes about the photo..."
                value={notes}
                onValueChange={setNotes}
              />
              <DatePicker
                showMonthAndYearPickers
                description="Set the date of this photo to be something else"
                label="Override Date"
                value={overrideDate}
                variant="bordered"
                onChange={(date) => date && setOverrideDate(date)}
              />
            </DrawerBody>
            <DrawerFooter>
              {loading && <CircularProgress />}
              <Button
                color="default"
                isDisabled={loading}
                size="lg"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={!uploadedFiles || !uploadedFiles.length || loading}
                size="lg"
                onPress={handleUpload}
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
