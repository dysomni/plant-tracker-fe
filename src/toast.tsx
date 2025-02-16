import React from "react";
import { Alert } from "@nextui-org/alert";

export type ToastMessage = {
  id?: string;
  message: string;
  type?: "warning" | "default" | "primary" | "secondary" | "success" | "danger";
  duration?: number;
};

export type ToastContextType = {
  toastMessages: ToastMessage[];
  addToast: (message: ToastMessage) => void;
};

export const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined,
);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toastMessages, setToastMessages] = React.useState<ToastMessage[]>([]);

  const removeToast = (id: string) => {
    setToastMessages((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (message: ToastMessage) => {
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      duration: message.duration,
      type: message.type ?? "default",
      message: message.message,
    };

    setToastMessages((prev) => {
      if (prev[prev.length - 1]?.message === newMessage.message) {
        return prev;
      }

      return [...prev, newMessage];
    });
    if (newMessage.duration) {
      setTimeout(() => {
        removeToast(newMessage.id!);
      }, newMessage.duration);
    }
  };

  return (
    <ToastContext.Provider value={{ toastMessages, addToast }}>
      <div
        className="fixed top-2 left-1/2 transform -translate-x-1/2 text-center"
        style={{ pointerEvents: "none", zIndex: 1000 }}
      >
        <div
          className="relative flex flex-col gap-2 p-5"
          style={{ pointerEvents: "auto" }}
        >
          {toastMessages.map((message) => (
            <div key={message.id}>
              <Alert
                color={message.type}
                isVisible={true}
                title={message.message}
                onClose={() => removeToast(message.id!)}
              />
            </div>
          ))}
        </div>
      </div>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context.addToast;
};
