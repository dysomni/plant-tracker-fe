import { Button, Card } from "@nextui-org/react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
  fetchCreateNotificationSubscriptionV1SubscriptionsPost,
  fetchDisableNotificationSubscriptionV1SubscriptionsSubscriptionIdDisablePost,
  fetchGetNotificationSubscriptionsV1SubscriptionsGet,
  GetNotificationSubscriptionsV1SubscriptionsGetResponse,
} from "../generated/api/plantsComponents";
import { usePageLoading } from "../components/page-loading";
import { useToast } from "../toast";

import DefaultLayout from "@/layouts/default";

const handleNoMatchingWithEndpoint = async (
  response: GetNotificationSubscriptionsV1SubscriptionsGetResponse | undefined,
  setSubscriptionEndpoint: (val: string) => void,
) => {
  if (!response) {
    return;
  }
  const matchingSubscription = response.find(
    (subscription) => subscription.matching,
  );

  if (!matchingSubscription) {
    navigator.serviceWorker.ready?.then(async (registration) => {
      const subscription = await registration?.pushManager?.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setSubscriptionEndpoint("");
      }
    });
  }
};

export default function SettingsPage() {
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState("");
  const [data, setData] = useState<
    GetNotificationSubscriptionsV1SubscriptionsGetResponse | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const fetch = async (subscriptionEndpointOverride?: string) => {
    const endpoint = subscriptionEndpointOverride ?? subscriptionEndpoint;

    setIsLoading(true);
    const response = await fetchGetNotificationSubscriptionsV1SubscriptionsGet({
      queryParams: {
        subscription_endpoint: endpoint,
      },
    });

    setData(response);
    setIsLoading(false);

    if (response.length) {
      const matchingSubscription = response.find(
        (subscription) => subscription.matching,
      );

      if (!matchingSubscription) {
        await handleNoMatchingWithEndpoint(response, setSubscriptionEndpoint);
      }
    }
  };

  const [notificationsAllowed, setNotificationsAllowed] = useState(false);

  usePageLoading(isLoading);

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
      registration.pushManager.getSubscription().then(async (subscription) => {
        if (subscription) {
          setSubscriptionEndpoint(subscription.endpoint);
          await fetch(subscription.endpoint);
        } else {
          await fetch();
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
                {subscription.matching ? (
                  <div className="text-success">Current Device</div>
                ) : null}
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
                    if (subscription.matching) {
                      const registration = await navigator.serviceWorker.ready;
                      const subscription =
                        await registration?.pushManager?.getSubscription();

                      if (subscription) {
                        await subscription.unsubscribe();
                        setSubscriptionEndpoint("");
                      }
                    }

                    await fetchDisableNotificationSubscriptionV1SubscriptionsSubscriptionIdDisablePost(
                      {
                        pathParams: {
                          subscriptionId: subscription.id,
                        },
                      },
                    );
                    await fetch();
                  }}
                >
                  Delete
                </Button>
              </Card>
            ))}
          </div>
        ) : null}
        {isLoading || (notificationsAllowed && subscriptionEndpoint) ? null : (
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
                    if (!subscriptionEndpoint) {
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
                        setSubscriptionEndpoint(subscription.endpoint);
                        await fetch(subscription.endpoint);
                      } catch (error) {
                        toast({
                          message: `Failed to subscribe to notifications. ${error}`,
                          type: "danger",
                          duration: 5000,
                        });
                      }
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
