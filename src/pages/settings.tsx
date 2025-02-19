import { Button, Card } from "@nextui-org/react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
  fetchCreateNotificationSubscriptionV1SubscriptionsPost,
  fetchDisableNotificationSubscriptionV1SubscriptionsSubscriptionIdDisablePost,
  useGetNotificationSubscriptionsV1SubscriptionsGet,
} from "../generated/api/plantsComponents";
import { useAuthErrorRedirect } from "../auth";
import { usePageLoading } from "../components/page-loading";
import { useToast } from "../toast";

import DefaultLayout from "@/layouts/default";

export default function SettingsPage() {
  const { data, isLoading, error, refetch } =
    useGetNotificationSubscriptionsV1SubscriptionsGet({});

  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [_isSubscribed, setIsSubscribed] = useState(false);

  usePageLoading(isLoading);
  useAuthErrorRedirect(error);

  useEffect(() => {
    navigator.serviceWorker.ready?.then((registration) => {
      registration?.pushManager
        ?.permissionState({
          userVisibleOnly: true,
          applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
        })
        ?.then((result) => {
          if (result === "granted") {
            setNotificationsAllowed(true);
          }
        });
      registration.pushManager.getSubscription().then((subscription) => {
        if (subscription) {
          setIsSubscribed(true);
        }
      });
    });
  }, []);

  const toast = useToast();

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10 w-full">
        {data && data.length ? (
          <div className="flex flex-col gap-2 w-full">
            <h2 className="text-lg font-semibold">Notification Devices</h2>
            {data.map((subscription) => (
              <Card key={subscription.id} className="flex gap-2 p-4 w-full">
                <div className="text-nowrap overflow-x-hidden">
                  {subscription.device_name}
                </div>
                <div>
                  {dayjs(subscription.created_at).format(
                    "YYYY-MM-DD HH:mm:ss Z",
                  )}
                </div>
                <Button
                  size="sm"
                  onPress={async () => {
                    await fetchDisableNotificationSubscriptionV1SubscriptionsSubscriptionIdDisablePost(
                      {
                        pathParams: {
                          subscriptionId: subscription.id,
                        },
                      },
                    );
                    await refetch();
                  }}
                >
                  Delete
                </Button>
              </Card>
            ))}
          </div>
        ) : null}
        {isLoading ? null : (
          <Button
            size="sm"
            onPress={async () => {
              Notification.requestPermission().then(async (result) => {
                if (result === "granted") {
                  const registration = await navigator.serviceWorker.ready;

                  const pm = await registration?.pushManager?.permissionState({
                    userVisibleOnly: true,
                    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
                  });

                  if (pm === "granted") {
                    setNotificationsAllowed(true);
                    try {
                      const subscription =
                        await registration?.pushManager?.subscribe({
                          userVisibleOnly: true,
                          applicationServerKey: import.meta.env
                            .VITE_VAPID_PUBLIC_KEY,
                        });

                      await fetchCreateNotificationSubscriptionV1SubscriptionsPost(
                        {
                          body: {
                            subscription: subscription,
                            device_name: navigator.userAgent,
                          },
                        },
                      );
                      setIsSubscribed(true);
                      await refetch();
                    } catch (error) {
                      toast({
                        message: `Failed to subscribe to notifications. ${error}`,
                        type: "danger",
                        duration: 5000,
                      });
                    }
                  }
                  toast({
                    message: "Notifications enabled.",
                    type: "success",
                    duration: 5000,
                  });
                } else {
                  setNotificationsAllowed(false);
                  toast({
                    message: "Notifications failed to enable.",
                    type: "danger",
                    duration: 5000,
                  });
                }
              });
            }}
          >
            Enable Notifications
          </Button>
        )}
        {notificationsAllowed && (
          <Button
            size="sm"
            onPress={async () => {
              const options = {
                body: `You have 4 plants that need watering today.`,
                title: `Time to water your plants!`,
                icon: "/apple-touch-icon.png",
                actions: [
                  {
                    action: "open",
                    title: "Open the app",
                  },
                ],
              };

              const registration = await navigator.serviceWorker.ready;

              await registration?.showNotification(options.title, options);
            }}
          >
            Test Local Notification
          </Button>
        )}
      </section>
    </DefaultLayout>
  );
}
