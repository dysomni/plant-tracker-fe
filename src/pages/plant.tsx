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
import {
  BasicPlantInfoResponseModel,
  Plant,
} from "../generated/api/plantsSchemas";
import dayjs from "dayjs";
import {
  Button,
  Checkbox,
  CircularProgress,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Image,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@nextui-org/react";
import { useImagePreview } from "../components/image-preview";
import {
  PlantLatestReminderBadge,
  PlantWateringBadge,
  PlantWetnessBadge,
} from "../components/badges";
import { useState } from "react";
import {
  IconArchiveFilled,
  IconCamera,
  IconPlus,
  IconRestore,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { useMediaQueries } from "../components/responsive-hooks";
import { CreatePlantDrawer } from "../components/create-plant";
import { useParams } from "react-router-dom";
import { unwrap } from "../util";
import { useToast } from "../toast";

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

  const mediaQueries = useMediaQueries();
  const [editPlantDrawerOpen, setEditPlantDrawerOpen] = useState(false);
  const [addPhotoOpen, setAddPhotoOpen] = useState(false);

  const handleArchive = async (archive: boolean = true) => {
    await fetchUpdatePlantV1PlantsPlantIdPatch({
      pathParams: { plantId },
      body: { archived: archive },
    });
    await refetch();
    setArchiveModalOpen(false);
  };

  return (
    <DefaultLayout>
      <CreatePlantDrawer
        open={editPlantDrawerOpen}
        setOpen={setEditPlantDrawerOpen}
        onPlantCreated={async () => {
          await refetch();
        }}
        editPlant={data?.plant}
      />
      <section className="flex flex-col items-center justify-center gap-4 pb-8 md:pb-10 w-full">
        <div className="flex flex-row justify-center gap-3 w-full">
          <Button
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconPlus size={15} />}
            color="success"
            onPress={() => setEditPlantDrawerOpen(true)}
            isDisabled={isFetching}
          >
            Edit Plant
          </Button>
          <Button
            size={mediaQueries["sm"] ? "md" : "sm"}
            startContent={<IconCamera size={15} />}
            color="default"
            isDisabled={isFetching}
            onPress={() => setAddPhotoOpen(true)}
          >
            Add Photo
          </Button>
          {data?.plant.archived ? (
            <Button
              size={mediaQueries["sm"] ? "md" : "sm"}
              startContent={<IconRestore size={15} />}
              color="primary"
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
              onPress={() => setArchiveModalOpen(true)}
              isDisabled={isFetching}
            >
              Archive Plant
            </Button>
          )}
        </div>
        <div className="flex flex-row flex-wrap gap-2">
          {photoData?.photos.map((photo) => (
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
                    plantName: data?.plant.name ?? "",
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

              <p>{dayjs(photo.photo.photo_date).format("MMMM D, YYYY")}</p>
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
  const toast = useToast();

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    try {
      const newPhotoRecord = await fetchCreatePhotoV1PhotosPost({
        body: {
          plant_id: unwrap(plant.id),
          photo_type: uploadedFile.type,
          photo_date: new Date().toISOString(),
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
      console.log(error);
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
