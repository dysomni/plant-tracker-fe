import {
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";
import { createContext, useContext, useState } from "react";

export type ImagePreviewContextType = {
  setPreview: ({
    src,
    plantName,
  }: {
    src: string;
    plantName: string;
    locationName?: string;
  }) => void;
  onClose: () => void;
};

export const ImagePreviewContext = createContext<
  ImagePreviewContextType | undefined
>(undefined);

export const ImagePreviewProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [preview, setPreview] = useState<{
    src?: string;
    plantName?: string;
    locationName?: string;
  }>({});

  const onClose = () => setPreview({});

  return (
    <ImagePreviewContext.Provider value={{ setPreview, onClose }}>
      <ImagePreview
        locationName={preview.locationName}
        plantName={preview.plantName}
        src={preview.src}
        onClose={onClose}
      />
      {children}
    </ImagePreviewContext.Provider>
  );
};

export const useImagePreview = () => {
  const context = useContext(ImagePreviewContext);

  if (!context) {
    throw new Error(
      "useImagePreview must be used within an ImagePreviewProvider",
    );
  }

  return context;
};

export const ImagePreview = (props: {
  src?: string;
  plantName?: string;
  locationName?: string;
  onClose: () => void;
}) => {
  if (!props.src || !props.plantName) return null;

  return (
    <Modal
      backdrop="blur"
      isOpen={!!props.src}
      placement="center"
      onOpenChange={props.onClose}
    >
      <ModalContent>
        {(_onClose) => (
          <>
            <ModalHeader className="flex flex-row gap-2 items-center pb-0">
              {props.plantName}
              {props.locationName ? (
                <span className="text-sm text-gray-500">
                  {props.locationName}
                </span>
              ) : null}
            </ModalHeader>
            <ModalBody>
              <Image alt={props.plantName} src={props.src} />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
