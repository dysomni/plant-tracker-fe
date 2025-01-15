import {
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@nextui-org/react";

export const ImagePreview = (props: {
  src?: string;
  plantName?: string;
  onClose: () => void;
}) => {
  if (!props.src || !props.plantName) return null;

  return (
    <Modal
      isOpen={!!props.src}
      onOpenChange={props.onClose}
      backdrop="blur"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {props.plantName}
            </ModalHeader>
            <ModalBody>
              <Image
                src={props.src}
                alt={props.plantName}
                // width={500}
                // height={500}
                // className="rounded-lg"
              />
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
